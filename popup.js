document.addEventListener('DOMContentLoaded', () => {
  // Get all values at once
  chrome.storage.local.get(
    ['portfolioData', 'portfolioValue', 'purchasePower', 'cachInHolding'],
    (result) => {
      handlePortfolioData({ portfolioData: result.portfolioData });
      handlePortfolioValue({ portfolioValue: result.portfolioValue });
      handlePurchasePower({ purchasePower: result.purchasePower });
      handleCashInHolding({ cachInHolding: result.cachInHolding });

      // Calculate total money
      const totalMoney =
        (parseFloat(result.portfolioValue) || 0.0) +
        (parseFloat(result.purchasePower) || 0.0) +
        (parseFloat(result.cachInHolding) || 0.0);

      // You could now pass this to a new visualization handler
      handleTotalMoney(totalMoney.toFixed(2));
    }
  );

  // Listen for changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // Check if any of the 3 values changed
      if (changes.portfolioValue || changes.purchasePower || changes.cachInHolding) {
        chrome.storage.local.get(
          ['portfolioValue', 'purchasePower', 'cachInHolding'],
          (result) => {
            const totalMoney =
              (parseFloat(result.portfolioValue) || 0) +
              (parseFloat(result.purchasePower) || 0) +
              (parseFloat(result.cachInHolding) || 0);

            handleTotalMoney(totalMoney);
          }
        );
      }

      if (changes.portfolioData) {
        handlePortfolioData({ portfolioData: changes.portfolioData.newValue });
      }

      if (changes.portfolioValue) {
        handlePortfolioValue({ portfolioValue: changes.portfolioValue.newValue });
      }

      if (changes.purchasePower) {
        handlePurchasePower({ purchasePower: changes.purchasePower.newValue });
      }

      if (changes.cachInHolding) {
        handleCashInHolding({ cachInHolding: changes.cachInHolding.newValue });
      }
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

function handleTotalMoney(result) {
  const totalMoney = result;
  const container = document.getElementById('total-money');
  container.innerHTML = '';
  container.appendChild(labeledValue(`Total Assets (${new Date().toLocaleTimeString()})`, totalMoney));
}