document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('portfolioData', handlePortfolioData);
  chrome.storage.local.get('portfolioValue', handlePortfolioValue);
  chrome.storage.local.get('purchasePower', handlePurchasePower);
  chrome.storage.local.get('cachInHolding', handleCashInHolding);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.portfolioData) {
      handlePortfolioData({ portfolioData: changes.portfolioData.newValue });
    }

    if (areaName === 'local' && changes.portfolioValue) {
      handlePortfolioValue({ portfolioValue: changes.portfolioValue.newValue });
    }

    if (areaName === 'local' && changes.purchasePower) {
      handlePurchasePower({ purchasePower: changes.purchasePower.newValue });
    }

    if (areaName === 'local' && changes.cachInHolding) {
      handleCashInHolding({ cachInHolding: changes.cachInHolding.newValue });
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
  })
}

function handlePortfolioValue(result) {
  const portfolioValue = result.portfolioValue;
  const container = document.getElementById('portfolio-value');
  container.innerHTML = '';
  container.appendChild(labeledValue('Portfolio Value', portfolioValue));
}

function handlePurchasePower(result) {
  const purchasePower = result.purchasePower;
  const container = document.getElementById('purchase-power');
  container.innerHTML = '';
  container.appendChild(labeledValue('Purchase Power', purchasePower));
}

function handleCashInHolding(result) {
  const cachInHolding = result.cachInHolding;
  const container = document.getElementById('cach-in-holding');
  container.innerHTML = '';
  container.appendChild(labeledValue('Cash in Holding', cachInHolding));
}