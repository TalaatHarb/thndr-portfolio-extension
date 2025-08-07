document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('portfolioData', handlePortfolioData);
  chrome.storage.local.get('portfolioValue', handlePortofolioValue);
  chrome.storage.local.get('purchasePower', handlePurchasePower);
  chrome.storage.local.get('cachInHolding', handleCachInHolding);
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

function handlePortofolioValue(result) {
  const portfolioValue = result.portfolioValue;
  const container = document.getElementById('portfolio-value');
  container.innerHTML = '';
  const div = document.createElement('div');
  div.innerHTML = `Portfolio Value: ${portfolioValue}`;
  container.appendChild(div);
}

function handlePurchasePower(result) {
  const purchasePower = result.purchasePower;
  const container = document.getElementById('purchase-power');
  container.innerHTML = '';
  const div = document.createElement('div');
  div.innerHTML = `Purchase Power: ${purchasePower}`;
  container.appendChild(div);
}

function handleCachInHolding(result) {
  const cachInHolding = result.cachInHolding;
  const container = document.getElementById('cach-in-holding');
  container.innerHTML = '';
  const div = document.createElement('div');
  div.innerHTML = `Cash in Holding: ${cachInHolding}`;
  container.appendChild(div);
}