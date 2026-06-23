(async function () {
  const token = JSON.parse(localStorage.getItem('auth-token') || '""');

  if (!token) {
    console.warn('[Thndr Extension] No auth-token found, exiting.');
    return;
  }

  await updateData(token);
  setInterval(() => updateData(token), 30_000);
})();

async function updateData(token) {
  try {
    const [positionsPayload] = await Promise.all([
      fetchPositions(token),

      // Original calls
      fetchPortfolioData(token),
      fetchPurchasePower(token),
      fetchCashInHolding(token),
      fetchEligibilities(token),
      fetchFundingEligibilities(token),
      fetchSuspensionStatuses(token),

      // Additional guess APIs/discovery calls
      // fetchWithdrawable(token),
      // fetchWalletAndPortfolio(token),
      // fetchPositions(token),

      // fetchUserInfo(token),

      // fetchComplianceForms(token),
      // fetchEligibilities(token),
      // fetchFundingEligibilities(token),
      // fetchSuspensionStatuses(token),

      // fetchFundingRequests(token),
      // fetchAccountActivities(token),
      // fetchUserBankAccount(token),
      // fetchFundingFees(token),
      // fetchVFCashNumbers(token),

      // fetchWatchlist(token),

      // fetchMarketHours(token),

      // fetchSubscriptions(token),
      // fetchPlans(token),
      // fetchSubscribers(token),
      // fetchSubscriberPaymentMethod(token),
    ]);

    const symbols = extractEgxSymbolsFromPositions(positionsPayload).slice(0, 3);
    if (symbols.length > 0) {
      await requestTradingViewInsights(symbols);
    }
  } catch (err) {
    console.error('[Thndr Extension] Error updating data:', err);
  }
}

/* ==========================================================================
   Generic Helpers
   ========================================================================== */

async function thndrGet(token, path) {
  const response = await fetch(`https://prod.thndr.app${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error(
      '[Thndr Extension] API error:',
      response.status,
      await response.text()
    );
    return null;
  }

  return response.json();
}

function sendStoreMessage(action, payloadKey, payload) {
  chrome.runtime.sendMessage({
    action,
    [payloadKey]: payload
  });
}

function requestTradingViewInsights(symbols) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        action: 'fetchTradingViewInsights',
        symbols,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn('[Thndr Extension] TradingView insight request failed:', chrome.runtime.lastError.message);
        }
        resolve();
      }
    );
  });
}

function extractEgxSymbolsFromPositions(positionsPayload) {
  if (!positionsPayload) return [];

  const source = Array.isArray(positionsPayload)
    ? positionsPayload
    : positionsPayload.positions || positionsPayload.items || [];

  if (!Array.isArray(source)) return [];

  const symbols = new Set();

  for (const item of source) {
    const rawSymbol = String(
      item.symbol || item.asset_symbol || item.ticker || item.code || ''
    ).trim().toUpperCase();

    if (!rawSymbol) continue;
    if (!rawSymbol.startsWith('EGX:')) {
      symbols.add(`EGX:${rawSymbol}`);
      continue;
    }

    symbols.add(rawSymbol);
  }

  return [...symbols];
}



/* ==========================================================================
   MARKET SERVICE
   ========================================================================== */

async function fetchPortfolioData(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/accounts/portfolio-info?market=egypt'
    );

    if (!data) return;

    const portfolio_value = data.portfolio_value.toFixed(2) || 0;
    const total_return = data.total_return.toFixed(2) || 0;
    const current_investment_total = portfolio_value - total_return;
    const positions = data.positions || [];

    const classTotals = {};
    let totalValue = 0;

    for (const position of positions) {
      const cls = position.asset_class || 'UNKNOWN';
      const value = position.market_value || 0;

      classTotals[cls] = (classTotals[cls] || 0) + value;
      totalValue += value;
    }

    const percentages = [];

    for (const [cls, val] of Object.entries(classTotals)) {
      const percentage = ((val / totalValue) * 100).toFixed(2);

      const percentageData = {};
      percentageData[cls] = percentage;

      percentages.push(percentageData);
    }

    sendStoreMessage('storePortfolio', 'percentages', percentages);
    sendStoreMessage('storePortfolioValue', 'portfolio_value', portfolio_value);
    sendStoreMessage('storeCurrentInvestmentTotal', 'current_investment_total', current_investment_total);
  } catch (err) {
    console.error('[Thndr Extension] Error in fetchPortfolioData:', err);
  }
}

async function fetchPurchasePower(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/accounts/purchase-power?market=egypt'
    );

    if (!data) return;

    sendStoreMessage(
      'storePurchasePower',
      'purchase_power',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchCashInHolding(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/accounts/cash-in-holding?market=egypt'
    );

    if (data == null) return;

    sendStoreMessage(
      'storeCachInHolding',
      'cach_in_holding',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchWithdrawable(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/accounts/withdrawable?market=egypt'
    );

    if (!data) return;

    sendStoreMessage(
      'storeWithdrawable',
      'withdrawable',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchWalletAndPortfolio(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/accounts/wallet-and-portfolio?market=egypt'
    );

    if (!data) return;

    sendStoreMessage(
      'storeWalletAndPortfolio',
      'walletAndPortfolio',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchPositions(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/accounts/positions?market=egypt'
    );

    if (!data) return;

    sendStoreMessage(
      'storePositions',
      'positions',
      data
    );

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function fetchMarketHours(token) {
  try {
    const data = await thndrGet(
      token,
      '/market-service/markets/hours'
    );

    if (!data) return;

    sendStoreMessage(
      'storeMarketHours',
      'marketHours',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

/* ==========================================================================
   AUTH SERVICE
   ========================================================================== */

async function fetchUserInfo(token) {
  try {
    const data = await thndrGet(
      token,
      '/auth-service/v2/users/info'
    );

    if (!data) return;

    sendStoreMessage(
      'storeUserInfo',
      'userInfo',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

/* ==========================================================================
   COMPLIANCE SERVICE
   ========================================================================== */

async function fetchComplianceForms(token) {
  try {
    const data = await thndrGet(
      token,
      '/compliance-service/account-forms'
    );

    if (!data) return;

    sendStoreMessage(
      'storeComplianceForms',
      'accountForms',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchEligibilities(token) {
  try {
    const data = await thndrGet(
      token,
      '/compliance-service/eligibilities'
    );

    if (!data) return;

    sendStoreMessage(
      'storeEligibilities',
      'eligibilities',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchFundingEligibilities(token) {
  try {
    const data = await thndrGet(
      token,
      '/compliance-service/funding-eligibilities'
    );

    if (!data) return;

    sendStoreMessage(
      'storeFundingEligibilities',
      'fundingEligibilities',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchSuspensionStatuses(token) {
  try {
    const data = await thndrGet(
      token,
      '/compliance-service/suspension-statuses'
    );

    if (!data) return;

    sendStoreMessage(
      'storeSuspensionStatuses',
      'suspensionStatuses',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

/* ==========================================================================
   FUNDING SERVICE
   ========================================================================== */

async function fetchFundingRequests(token) {
  try {
    const data = await thndrGet(
      token,
      '/funding-service/funding-requests'
    );

    if (!data) return;

    sendStoreMessage(
      'storeFundingRequests',
      'fundingRequests',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchAccountActivities(token) {
  try {
    const data = await thndrGet(
      token,
      '/funding-service/account-activities'
    );

    if (!data) return;

    sendStoreMessage(
      'storeAccountActivities',
      'accountActivities',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchUserBankAccount(token) {
  try {
    const data = await thndrGet(
      token,
      '/funding-service/user-bank-account'
    );

    if (!data) return;

    sendStoreMessage(
      'storeUserBankAccount',
      'userBankAccount',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchFundingFees(token) {
  try {
    const data = await thndrGet(
      token,
      '/funding-service/fees'
    );

    if (!data) return;

    sendStoreMessage(
      'storeFundingFees',
      'fundingFees',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchVFCashNumbers(token) {
  try {
    const data = await thndrGet(
      token,
      '/funding-service/vf-cash-phone-numbers'
    );

    if (!data) return;

    sendStoreMessage(
      'storeVFCashNumbers',
      'vfCashPhoneNumbers',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

/* ==========================================================================
   ASSETS SERVICE
   ========================================================================== */

async function fetchWatchlist(token) {
  try {
    const data = await thndrGet(
      token,
      '/assets-service/watchlist'
    );

    if (!data) return;

    sendStoreMessage(
      'storeWatchlist',
      'watchlist',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

/* ==========================================================================
   PAYMENT SERVICE
   ========================================================================== */

async function fetchSubscriptions(token) {
  try {
    const data = await thndrGet(
      token,
      '/payment-service/v2/subscriptions?market=egypt'
    );

    if (!data) return;

    sendStoreMessage(
      'storeSubscriptions',
      'subscriptions',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchPlans(token) {
  try {
    const data = await thndrGet(
      token,
      '/payment-service/v2/plans?market=egypt'
    );

    if (!data) return;

    sendStoreMessage(
      'storePlans',
      'plans',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchSubscribers(token) {
  try {
    const data = await thndrGet(
      token,
      '/payment-service/v2/subscribers'
    );

    if (!data) return;

    sendStoreMessage(
      'storeSubscribers',
      'subscribers',
      data
    );
  } catch (err) {
    console.error(err);
  }
}

async function fetchSubscriberPaymentMethod(token) {
  try {
    const data = await thndrGet(
      token,
      '/payment-service/v2/subscribers/payment-method'
    );

    if (!data) return;

    sendStoreMessage(
      'storeSubscriberPaymentMethod',
      'paymentMethod',
      data
    );
  } catch (err) {
    console.error(err);
  }
}