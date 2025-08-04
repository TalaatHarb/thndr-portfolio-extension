(async function () {
  const token = JSON.parse(localStorage.getItem('auth-token') || '""');
  if (!token) {
    console.log('[Thndr Extension] No auth-token found, exiting.');
    return;
  }

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
    const positions = data.positions || [];

    const classTotals = {};
    let totalValue = 0;

    for (const position of positions) {
      const cls = position.asset_class || 'UNKNOWN';
      const value = position.market_value || 0;

      classTotals[cls] = (classTotals[cls] || 0) + value;
      totalValue += value;
    }

    console.log('%c[Thndr Portfolio Breakdown]', 'font-weight: bold; font-size: 16px');
    for (const [cls, val] of Object.entries(classTotals)) {
      const percentage = ((val / totalValue) * 100).toFixed(2);
      console.log(`${cls}: ${percentage}%`);
    }

  } catch (err) {
    console.error('[Thndr Extension] Unexpected error:', err);
  }
})();