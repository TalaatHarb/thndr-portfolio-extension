chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
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

});
