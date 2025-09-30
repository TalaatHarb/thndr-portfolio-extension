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
    await fetchPortfolioData(token);
    await fetchPurchasePower(token);
    await fetchCashInHolding(token);
  } catch (err) {
    console.error('[Thndr Extension] Error updating data:', err);
  }
};

async function fetchPortfolioData(token) {
  try {
    const response = await fetch('https://prod.thndr.app/market-service/accounts/portfolio-info?market=egypt', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('[Thndr Extension] API error:', response.status, await response.text());
      return;
    }

    const data = await response.json();
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
    chrome.runtime.sendMessage({ action: 'storePortfolio', percentages });
    chrome.runtime.sendMessage({ action: 'storePortfolioValue', portfolio_value });
    chrome.runtime.sendMessage({ action: 'storeCurrentInvestmentTotal', current_investment_total });
  } catch (err) {
    console.error('[Thndr Extension] Unexpected error:', err);
  }
}

async function fetchPurchasePower(token) {
  try {
    const response = await fetch('https://prod.thndr.app/market-service/accounts/purchase-power?market=egypt', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('[Thndr Extension] API error:', response.status, await response.text());
      return;
    }

    const purchase_power = await response.json();
    chrome.runtime.sendMessage({ action: 'storePurchasePower', purchase_power });
  } catch (err) {
    console.error('[Thndr Extension] Unexpected error:', err);
  }
}

async function fetchCashInHolding(token) {
  try {
    const response = await fetch('https://prod.thndr.app/market-service/accounts/cash-in-holding?market=egypt', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('[Thndr Extension] API error:', response.status, await response.text());
      return;
    }

    const cach_in_holding = await response.json();
    chrome.runtime.sendMessage({ action: 'storeCachInHolding', cach_in_holding });
  } catch (err) {
    console.error('[Thndr Extension] Unexpected error:', err);
  }
}