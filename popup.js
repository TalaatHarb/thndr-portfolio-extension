document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('portfolioData', (result) => {
    const data = result.portfolioData;
    if (!result?.portfolioData) {
      document.getElementById('portfolio').innerText = 'No data available.';
      return;
    }

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
  });
});
