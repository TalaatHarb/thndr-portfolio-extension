const TRADING_VIEW_FIELDS = [
  'Recommend.Other|5',
  'Recommend.All|5',
  'Recommend.MA|5',
  'RSI|5',
  'RSI[1]|5',
  'Stoch.K|5',
  'Stoch.D|5',
  'MACD.macd|5',
  'MACD.signal|5',
  'EMA10|5',
  'SMA10|5',
  'EMA20|5',
  'SMA20|5',
  'EMA50|5',
  'SMA50|5',
  'EMA200|5',
  'SMA200|5',
  'Rec.Ichimoku|5',
  'Rec.VWMA|5',
  'Rec.HullMA9|5',
  'close|5',
];

function toTradingDecision(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return { label: 'No signal', state: 'neutral' };
  }

  if (score >= 0.35) return { label: 'Buy', state: 'green' };
  if (score >= 0.1) return { label: 'Weak Buy', state: 'green' };
  if (score <= -0.35) return { label: 'Sell', state: 'red' };
  if (score <= -0.1) return { label: 'Weak Sell', state: 'red' };
  return { label: 'Hold', state: 'yellow' };
}

async function fetchTradingViewSymbol(symbol) {
  const fields = encodeURIComponent(TRADING_VIEW_FIELDS.join(','));
  const url = `https://scanner.tradingview.com/symbol?symbol=${encodeURIComponent(symbol)}&fields=${fields}&no_404=true&label-product=external-widgets`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[Thndr Extension] TradingView API error:', response.status, symbol);
      return null;
    }

    const data = await response.json();
    const recommendation = Number.parseFloat(data['Recommend.All|5']);
    const decision = toTradingDecision(recommendation);

    return {
      symbol,
      recommendation,
      decision,
      close: Number.parseFloat(data['close|5']),
      rsi: Number.parseFloat(data['RSI|5']),
      fetchedAt: new Date().toISOString(),
      raw: data,
    };
  } catch (error) {
    console.warn('[Thndr Extension] TradingView fetch failed:', symbol, error);
    return null;
  }
}

async function fetchTradingViewInsights(symbols) {
  const uniqueSymbols = [...new Set((symbols || []).filter(Boolean))].slice(0, 5);
  if (uniqueSymbols.length === 0) {
    return [];
  }

  const insights = (await Promise.all(uniqueSymbols.map(fetchTradingViewSymbol))).filter(Boolean);

  const strongest = insights
    .slice()
    .sort((a, b) => Math.abs(b.recommendation || 0) - Math.abs(a.recommendation || 0))[0] || null;

  await chrome.storage.local.set({
    tradingViewInsights: insights,
    tradingViewBestSignal: strongest,
    tradingViewLastSync: new Date().toISOString(),
  });

  return insights;
}

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.action === 'fetchTradingViewInsights') {
    fetchTradingViewInsights(message.symbols)
      .then((insights) => {
        _sendResponse({ ok: true, count: insights.length });
      })
      .catch((error) => {
        console.error('[Thndr Extension] Error in fetchTradingViewInsights:', error);
        _sendResponse({ ok: false, error: String(error) });
      });

    return true;
  }

  if (message.action === 'storePortfolio') {
    chrome.storage.local.set({ portfolioData: message.percentages }, () => {
    });
  }

  if (message.action === 'storePortfolioValue') {
    chrome.storage.local.set({ portfolioValue: message.portfolio_value }, () => {
    });
  }

  if (message.action === 'storePurchasePower') {
    chrome.storage.local.set({ purchasePower: message.purchase_power }, () => {
    });
  }

  if (message.action === 'storeCachInHolding') {
    chrome.storage.local.set({ cachInHolding: message.cach_in_holding }, () => {
    });
  }

  if (message.action === 'storeCurrentInvestmentTotal') {
    chrome.storage.local.set({ currentInvestmentTotal: message.current_investment_total }, () => {
    });
  }

  if (message.action === 'storePositions') {
    chrome.storage.local.set({ positions: message.positions }, () => {
    });
  }

  if (message.action === 'storeEligibilities') {
    chrome.storage.local.set({ eligibilities: message.eligibilities }, () => {
    });
  }

  if (message.action === 'storeFundingEligibilities') {
    chrome.storage.local.set({ fundingEligibilities: message.fundingEligibilities }, () => {
    });
  }

  if (message.action === 'storeSuspensionStatuses') {
    chrome.storage.local.set({ suspensionStatuses: message.suspensionStatuses }, () => {
    });
  }

});
