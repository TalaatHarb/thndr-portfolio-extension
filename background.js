chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.action === 'storePortfolio') {
    chrome.storage.local.set({ portfolioData: message.percentages }, () => {
    });
  }
});
