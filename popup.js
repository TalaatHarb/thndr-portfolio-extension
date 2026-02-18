document.addEventListener('DOMContentLoaded', () => {
  // Get all values at once
  chrome.storage.local.get(
    ['portfolioData', 'portfolioValue', 'purchasePower', 'cachInHolding', 'currentInvestmentTotal', 'investmentTotal'],
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
  if (!result?.cachInHolding) {
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