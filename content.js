(async function () {
  const token = JSON.parse(localStorage.getItem('auth-token') || '""');
  if (!token) {
    console.log('[Thndr Extension] No auth-token found, exiting.');
    return;
  }

  await fetchPortfolioData(token);
  await fetchPurchasePower(token);
  await fetchCachInHolding(token);

})();

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
    const portfolio_value = data.portfolio_value || 0;
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
    console.log('%c[Thndr Portfolio Breakdown]', 'font-weight: bold; font-size: 16px');
    for (const [cls, val] of Object.entries(classTotals)) {
      const percentage = ((val / totalValue) * 100).toFixed(2);
      const percentageData = {};
      percentageData[cls] = percentage;
      percentages.push(percentageData);
    }
    chrome.runtime.sendMessage({ action: 'storePortfolio', percentages });
    chrome.runtime.sendMessage({ action: 'storePortfolioValue', portfolio_value });
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

async function fetchCachInHolding(token) {
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