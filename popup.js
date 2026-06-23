document.addEventListener('DOMContentLoaded', () => {
  // Get all values at once
  chrome.storage.local.get(
    [
      'portfolioData',
      'portfolioValue',
      'purchasePower',
      'cachInHolding',
      'currentInvestmentTotal',
      'investmentTotal',
      'positions',
      'eligibilities',
      'fundingEligibilities',
      'suspensionStatuses',
      'tradingViewInsights',
      'tradingViewBestSignal',
      'tradingViewLastSync',
    ],
    (result) => {
      // Calculate total money
      const totalMoney =
        (Number.parseFloat(result.portfolioValue) || 0) +
        (Number.parseFloat(result.purchasePower) || 0) +
        (Number.parseFloat(result.cachInHolding) || 0);

      handlePortfolioData({ portfolioData: result.portfolioData });
      handlePortfolioValue({ portfolioValue: result.portfolioValue, currentInvestmentTotal: result.currentInvestmentTotal || 0, investmentTotal: result.investmentTotal || 0, totalMoney: totalMoney });
      handlePurchasePower({ purchasePower: result.purchasePower });
      handleCashInHolding({ cachInHolding: result.cachInHolding });
      handleTopPositions(result.positions);
      handleAccountReadiness({
        eligibilities: result.eligibilities,
        fundingEligibilities: result.fundingEligibilities,
        suspensionStatuses: result.suspensionStatuses,
      });
      handleTechnicalSignal({
        insights: result.tradingViewInsights,
        bestSignal: result.tradingViewBestSignal,
        lastSync: result.tradingViewLastSync,
      });

      // You could now pass this to a new visualization handler
      handleTotalMoney(totalMoney.toFixed(2));

      // Set default value for investmentTotalInput
      const investmentTotalInput = document.getElementById('investmentTotalInput');
      if (investmentTotalInput) {
        const storedInvestmentTotal = Number.parseFloat(result.investmentTotal);
        const storedCurrentInvestmentTotal = Number.parseFloat(result.currentInvestmentTotal);

        if (!Number.isNaN(storedInvestmentTotal)) {
          investmentTotalInput.value = storedInvestmentTotal.toFixed(2);
        } else if (!Number.isNaN(storedCurrentInvestmentTotal)) {
          investmentTotalInput.value = storedCurrentInvestmentTotal.toFixed(2);
        }
      }
    }
  );

  // Listen for changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // Recompute dependent values when any input changes
      if (
        changes.portfolioValue ||
        changes.purchasePower ||
        changes.cachInHolding ||
        changes.currentInvestmentTotal ||
        changes.investmentTotal
      ) {
        chrome.storage.local.get(
          ['portfolioValue', 'purchasePower', 'cachInHolding', 'currentInvestmentTotal', 'investmentTotal'],
          (result) => {
            const totalMoney =
              (Number.parseFloat(result.portfolioValue) || 0) +
              (Number.parseFloat(result.purchasePower) || 0) +
              (Number.parseFloat(result.cachInHolding) || 0);

            handleTotalMoney(totalMoney.toFixed(2));
            handlePortfolioValue({
              portfolioValue: result.portfolioValue,
              currentInvestmentTotal: result.currentInvestmentTotal || 0,
              investmentTotal: result.investmentTotal || 0,
              totalMoney: totalMoney,
            });
          }
        );
      }

      if (changes.portfolioData) {
        handlePortfolioData({ portfolioData: changes.portfolioData.newValue });
      }

      if (changes.purchasePower) {
        handlePurchasePower({ purchasePower: changes.purchasePower.newValue });
      }

      if (changes.cachInHolding) {
        handleCashInHolding({ cachInHolding: changes.cachInHolding.newValue });
      }

      if (changes.positions) {
        handleTopPositions(changes.positions.newValue);
      }

      if (
        changes.eligibilities ||
        changes.fundingEligibilities ||
        changes.suspensionStatuses
      ) {
        chrome.storage.local.get(
          ['eligibilities', 'fundingEligibilities', 'suspensionStatuses'],
          (result) => {
            handleAccountReadiness({
              eligibilities: result.eligibilities,
              fundingEligibilities: result.fundingEligibilities,
              suspensionStatuses: result.suspensionStatuses,
            });
          }
        );
      }

      if (
        changes.tradingViewInsights ||
        changes.tradingViewBestSignal ||
        changes.tradingViewLastSync
      ) {
        chrome.storage.local.get(
          ['tradingViewInsights', 'tradingViewBestSignal', 'tradingViewLastSync'],
          (result) => {
            handleTechnicalSignal({
              insights: result.tradingViewInsights,
              bestSignal: result.tradingViewBestSignal,
              lastSync: result.tradingViewLastSync,
            });
          }
        );
      }
    }
  });

  document.getElementById('saveInvestmentTotalButton').addEventListener('click', () => {
    const investmentTotalInput = document.getElementById('investmentTotalInput');
    const investmentTotal = Number.parseFloat(investmentTotalInput.value);
    if (Number.isNaN(investmentTotal)) {
      alert('Please enter a valid number for total investment.');
    } else {
      saveInvestmentTotal(investmentTotal);
    }
  });
});

function handlePortfolioData(result) {
  if (!result?.portfolioData) {
    document.getElementById('portfolio').innerText = 'No data available.';
    return;
  }
  const data = result.portfolioData;

  const container = document.getElementById('portfolio');
  container.innerHTML = '';

  data.forEach(obj => {
    const [symbol, percent] = Object.entries(obj)[0];
    const assetDiv = document.createElement('div');
    assetDiv.className = 'asset';

    const name = document.createElement('div');
    name.className = 'asset-name';
    name.innerText = `${symbol} — ${percent}%`;

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${percent}%`;

    assetDiv.appendChild(name);
    assetDiv.appendChild(bar);
    container.appendChild(assetDiv);
  });
}

function handlePortfolioValue(result) {
  const portfolioValue = Number.parseFloat(result.portfolioValue) || 0;
  if (!result?.portfolioValue) {
    document.getElementById('portfolio-value').innerText = 'No data available.';
    const returnPercentageSpan = document.getElementById('return-percentage');
    if (returnPercentageSpan) returnPercentageSpan.innerText = '—';
    return;
  }
  const currentInvestmentTotal = Number.parseFloat(result.currentInvestmentTotal) || 0;
  const investmentTotal = Number.parseFloat(result.investmentTotal) || 0;
  const totalMoney = Number.parseFloat(result.totalMoney) || portfolioValue;
  const container = document.getElementById('portfolio-value');
  container.innerHTML = '';
  container.appendChild(labeledValue('Portfolio Value', portfolioValue.toFixed(2)));

  const baseInvestmentTotal = investmentTotal && investmentTotal !== 0 ? investmentTotal : currentInvestmentTotal;
  const returns = totalMoney - baseInvestmentTotal;
  container.appendChild(labeledValue('Returns', returns.toFixed(2)));

  const returnPercentageSpan = document.getElementById('return-percentage');
  if (returnPercentageSpan) {
    if (baseInvestmentTotal && baseInvestmentTotal !== 0) {
      const returnPercentage = (returns * 100) / baseInvestmentTotal;
      returnPercentageSpan.innerText = `${returnPercentage.toFixed(2)}%`;
    } else {
      returnPercentageSpan.innerText = '—';
    }
  }
}

function handlePurchasePower(result) {
  const purchasePower = Number.parseFloat(result.purchasePower) || 0;
  if (!result?.purchasePower) {
    document.getElementById('purchase-power').innerText = 'No data available.';
    return;
  }
  const container = document.getElementById('purchase-power');
  container.innerHTML = '';
  container.appendChild(labeledValue('Purchase Power', purchasePower.toFixed(2)));
}

function handleCashInHolding(result) {
  const cachInHolding = Number.parseFloat(result.cachInHolding) || 0;
  if (result?.cachInHolding == null) {
    document.getElementById('cach-in-holding').innerText = 'No data available.';
    return;
  }
  const container = document.getElementById('cach-in-holding');
  container.innerHTML = '';
  container.appendChild(labeledValue('Cash in Holding', cachInHolding.toFixed(2)));
}

function handleTotalMoney(result) {
  const totalMoney = Number.parseFloat(result) || 0;
  if (!result) {
    document.getElementById('total-money').innerText = 'No data available.';
    return;
  }
  const container = document.getElementById('total-money');
  container.innerHTML = '';
  container.appendChild(labeledValue(`Total Assets (${new Date().toLocaleTimeString()})`, totalMoney));
}

function saveInvestmentTotal(investmentTotal) {
  chrome.storage.local.set({ investmentTotal: investmentTotal });
}

function handleTopPositions(positionsPayload) {
  const listContainer = document.getElementById('top-positions');
  const riskContainer = document.getElementById('concentration-risk');
  listContainer.innerHTML = '';
  riskContainer.innerHTML = '';

  const positions = normalizePositions(positionsPayload);

  if (!positions.length) {
    listContainer.appendChild(labeledValue('Top 3 Stocks', 'No data available.'));
    riskContainer.appendChild(labeledValue('Top 3 Funds', 'No data available.'));
    return;
  }

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const stocks = positions.filter((position) => position.positionKind === 'stock');
  const funds = positions.filter((position) => position.positionKind === 'fund');

  renderTopGroup(listContainer, 'Stocks', stocks, totalValue);
  renderTopGroup(riskContainer, 'Funds', funds, totalValue);
}

function renderTopGroup(container, label, positions, totalValue) {
  const top3 = [...positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 3);

  if (!top3.length) {
    container.appendChild(labeledValue(`Top 3 ${label}`, 'No data available.'));
    return;
  }

  container.appendChild(labeledValue(`Top 3 ${label}`, `${top3.length} shown`));

  top3.forEach((position, index) => {
    const pct = totalValue > 0 ? (position.marketValue * 100) / totalValue : 0;
    const gainLossPct = normalizeGainLossPercentage(position.gainLossPercentage);
    const signedGainLoss = formatSignedNumber(position.gainLoss);
    const signedGainLossPct = `${gainLossPct >= 0 ? '+' : ''}${gainLossPct.toFixed(2)}%`;

    let gainLossClassName = '';
    if (position.gainLoss > 0) {
      gainLossClassName = statusClassForState('green');
    } else if (position.gainLoss < 0) {
      gainLossClassName = statusClassForState('red');
    }

    container.appendChild(
      labeledValue(
        `#${index + 1} ${position.symbol} (${pct.toFixed(2)}%)`,
        `${signedGainLoss} (${signedGainLossPct})`,
        gainLossClassName
      )
    );
  });
}

function handleAccountReadiness(payload) {
  const statusContainer = document.getElementById('account-readiness-status');
  const reasonContainer = document.getElementById('account-readiness-reason');
  statusContainer.innerHTML = '';
  reasonContainer.innerHTML = '';

  const evaluation = evaluateReadiness(payload);
  statusContainer.appendChild(
    labeledValue(
      'Status',
      evaluation.label,
      statusClassForState(evaluation.state)
    )
  );
  evaluation.details.forEach((detail) => {
    reasonContainer.appendChild(labeledValue(detail.label, detail.value));
  });
}

function normalizePositions(positionsPayload) {
  if (!positionsPayload) return [];

  const source = Array.isArray(positionsPayload)
    ? positionsPayload
    : positionsPayload.positions || positionsPayload.items || [];

  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      const symbol = item.symbol || item.asset_symbol || item.ticker || item.code || 'UNKNOWN';
      const marketValue =
        Number.parseFloat(item.market_value) ||
        Number.parseFloat(item.marketValue) ||
        Number.parseFloat(item.value) ||
        0;
      const gainLoss =
        Number.parseFloat(item.gain_loss) ||
        Number.parseFloat(item.gainLoss) ||
        0;
      const gainLossPercentage =
        Number.parseFloat(item.gain_loss_percentage) ||
        Number.parseFloat(item.gainLossPercentage) ||
        0;
      const positionKind = classifyPositionKind(item);
      return { symbol, marketValue, positionKind, gainLoss, gainLossPercentage };
    })
    .filter((item) => item.marketValue > 0 && item.positionKind !== 'other');
}

function normalizeGainLossPercentage(rawValue) {
  const numeric = Number.parseFloat(rawValue) || 0;
  if (Math.abs(numeric) <= 1) {
    return numeric * 100;
  }
  return numeric;
}

function formatSignedNumber(rawValue) {
  const numeric = Number.parseFloat(rawValue) || 0;
  const sign = numeric >= 0 ? '+' : '-';
  return `${sign}${Math.abs(numeric).toFixed(2)}`;
}

function classifyPositionKind(item) {
  const rawFields = [
    item.asset_class,
    item.assetClass,
    item.instrument_type,
    item.instrumentType,
    item.security_type,
    item.securityType,
    item.product_name,
    item.productName,
    item.category,
    item.type,
    item.name,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const text = rawFields.join(' ');

  if (/fund|mutual|etf/.test(text)) {
    return 'fund';
  }

  if (/stock|equity|share|common|preferred/.test(text)) {
    return 'stock';
  }

  return 'stock';
}

function evaluateReadiness(payload) {
  const suspensionSummary = summarizeSuspensionStatuses(payload?.suspensionStatuses);
  if (suspensionSummary.hasBlockingSuspension) {
    return {
      state: 'red',
      label: 'Restricted',
      details: [
        { label: 'Suspension', value: suspensionSummary.summaryText },
      ],
    };
  }

  const fundingSummary = summarizeFundingEligibilities(payload?.fundingEligibilities);
  const eligibilitySummary = summarizeProductEligibilities(payload?.eligibilities);

  const details = [
    { label: 'Suspension', value: suspensionSummary.summaryText },
    { label: 'Funding (Egypt)', value: fundingSummary.summaryText },
    { label: 'Products', value: eligibilitySummary.summaryText },
  ];

  if (fundingSummary.hasBlockingIssue) {
    return {
      state: 'yellow',
      label: 'Action Needed',
      details,
    };
  }

  if (eligibilitySummary.hasActionNeeded) {
    return {
      state: 'yellow',
      label: 'Review Required',
      details,
    };
  }

  return {
    state: 'green',
    label: 'Ready',
    details,
  };
}

function summarizeSuspensionStatuses(suspensionStatuses) {
  if (!suspensionStatuses || typeof suspensionStatuses !== 'object') {
    return {
      hasBlockingSuspension: false,
      summaryText: 'No data',
    };
  }

  const suspensionFlags = [
    'buying_securities_suspended',
    'selling_securities_suspended',
    'withdraw_suspended',
    'deposit_suspended',
  ];

  const activeFlags = suspensionFlags.filter((flag) => Boolean(suspensionStatuses[flag]));
  if (!activeFlags.length) {
    return {
      hasBlockingSuspension: false,
      summaryText: 'None',
    };
  }

  const labels = activeFlags.map((flag) => flag.replace(/_suspended$/, '').replaceAll('_', ' '));
  return {
    hasBlockingSuspension: true,
    summaryText: labels.join(', '),
  };
}

function summarizeFundingEligibilities(fundingEligibilities) {
  const source = fundingEligibilities?.eligibilities;
  const list = Array.isArray(source) ? source : [];

  if (!list.length) {
    return {
      hasBlockingIssue: false,
      summaryText: 'No data',
    };
  }

  const egypt = list.find((item) => String(item.market).toLowerCase() === 'egypt');
  const target = egypt || list[0];
  const canDeposit = Boolean(target.eligible_to_deposit);
  const canWithdraw = Boolean(target.eligible_to_withdraw);

  let summaryText = `${String(target.market || 'unknown')} `;
  summaryText += `deposit ${canDeposit ? 'enabled' : 'disabled'}, `;
  summaryText += `withdraw ${canWithdraw ? 'enabled' : 'disabled'}`;

  const reasons = target.ineligibility_reason || {};
  const reasonText = [reasons.deposit, reasons.withdraw].filter(Boolean).join(', ');
  if (reasonText) {
    summaryText += ` (${reasonText})`;
  }

  return {
    hasBlockingIssue: !canDeposit || !canWithdraw,
    summaryText,
  };
}

function summarizeProductEligibilities(eligibilitiesResponse) {
  const source = eligibilitiesResponse?.eligibilities;
  const list = Array.isArray(source) ? source : [];

  if (!list.length) {
    return {
      hasActionNeeded: false,
      summaryText: 'No data',
    };
  }

  const registeredEligible = list.filter(
    (item) => item.eligibility_status === 'ELIGIBLE' && item.registration_status === 'REGISTERED'
  ).length;

  const pending = list.filter(
    (item) => item.registration_status === 'PENDING' || item.registration_status === 'IN_REVIEW'
  ).length;

  const notAttempted = list.filter(
    (item) => item.registration_status === 'NOT_ATTEMPTED' || item.eligibility_status === 'NOT_REGISTERED'
  ).length;

  let summaryText = `${registeredEligible} eligible & registered`;
  if (pending > 0) {
    summaryText += `, ${pending} pending`;
  }
  if (notAttempted > 0) {
    summaryText += `, ${notAttempted} not started`;
  }

  return {
    hasActionNeeded: registeredEligible === 0 || pending > 0,
    summaryText,
  };
}

function statusClassForState(state) {
  if (state === 'green') return 'status-green';
  if (state === 'red') return 'status-red';
  return 'status-yellow';
}

function handleTechnicalSignal(payload) {
  const container = document.getElementById('technical-signal');
  container.innerHTML = '';

  const bestSignal = payload?.bestSignal;
  const insights = Array.isArray(payload?.insights) ? payload.insights : [];

  if (!bestSignal && insights.length === 0) {
    container.appendChild(labeledValue('Signal', 'No data available.'));
    return;
  }

  const selected = bestSignal || insights[0];
  const recommendation = Number.parseFloat(selected.recommendation);
  const decisionLabel = selected?.decision?.label || recommendationLabelFromScore(recommendation);
  const decisionState = selected?.decision?.state || recommendationStateFromScore(recommendation);

  container.appendChild(
    labeledValue(
      `${selected.symbol} (${formatIntervalLabel('5')})`,
      decisionLabel,
      statusClassForState(decisionState)
    )
  );

  if (!Number.isNaN(recommendation)) {
    container.appendChild(labeledValue('Recommendation Score', recommendation.toFixed(3)));
    container.appendChild(labeledValue('Confidence', scoreConfidence(Math.abs(recommendation))));
  }

  const close = Number.parseFloat(selected.close);
  if (!Number.isNaN(close)) {
    container.appendChild(labeledValue('Last Price', close.toFixed(2)));
  }

  const rsi = Number.parseFloat(selected.rsi);
  if (!Number.isNaN(rsi)) {
    container.appendChild(labeledValue('RSI', rsi.toFixed(2)));
  }

  const lastSync = payload?.lastSync || selected?.fetchedAt;
  if (lastSync) {
    const date = new Date(lastSync);
    if (!Number.isNaN(date.getTime())) {
      container.appendChild(labeledValue('Updated', date.toLocaleTimeString()));
    }
  }

  if (insights.length > 1) {
    container.appendChild(labeledValue('Symbols Scanned', `${insights.length}`));
  }
}

function recommendationLabelFromScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'No signal';
  if (score >= 0.35) return 'Buy';
  if (score >= 0.1) return 'Weak Buy';
  if (score <= -0.35) return 'Sell';
  if (score <= -0.1) return 'Weak Sell';
  return 'Hold';
}

function recommendationStateFromScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'yellow';
  if (score >= 0.1) return 'green';
  if (score <= -0.1) return 'red';
  return 'yellow';
}

function scoreConfidence(absScore) {
  if (absScore >= 0.7) return 'Very High';
  if (absScore >= 0.45) return 'High';
  if (absScore >= 0.25) return 'Medium';
  return 'Low';
}

function formatIntervalLabel(interval) {
  if (interval === '5') return '5m';
  return interval;
}