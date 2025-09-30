document.addEventListener('DOMContentLoaded', () => {
  // Get all values at once
  chrome.storage.local.get(
    ['portfolioData', 'portfolioValue', 'purchasePower', 'cachInHolding', 'currentInvestmentTotal', 'investmentTotal'],
    (result) => {
      // Calculate total money
      const totalMoney =
        (parseFloat(result.portfolioValue) || 0.0) +
        (parseFloat(result.purchasePower) || 0.0) +
        (parseFloat(result.cachInHolding) || 0.0);

      handlePortfolioData({ portfolioData: result.portfolioData });
      handlePortfolioValue({ portfolioValue: result.portfolioValue, currentInvestmentTotal: result.currentInvestmentTotal || 0.0, investmentTotal: result.investmentTotal || 0.0, totalMoney: totalMoney });
      handlePurchasePower({ purchasePower: result.purchasePower });
      handleCashInHolding({ cachInHolding: result.cachInHolding });

      // You could now pass this to a new visualization handler
      handleTotalMoney(totalMoney.toFixed(2));

      // Set default value for investmentTotalInput
      const investmentTotalInput = document.getElementById('investmentTotalInput');
      if (investmentTotalInput) {
        const storedInvestmentTotal = parseFloat(result.investmentTotal);
        const storedCurrentInvestmentTotal = parseFloat(result.currentInvestmentTotal);

        if (!isNaN(storedInvestmentTotal)) {
          investmentTotalInput.value = storedInvestmentTotal.toFixed(2);
        } else if (!isNaN(storedCurrentInvestmentTotal)) {
          investmentTotalInput.value = storedCurrentInvestmentTotal.toFixed(2);
        }
      }
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

  document.getElementById('saveInvestmentTotalButton').addEventListener('click', () => {
    const investmentTotalInput = document.getElementById('investmentTotalInput');
    const investmentTotal = parseFloat(investmentTotalInput.value);
    if (!isNaN(investmentTotal)) {
      saveInvestmentTotal(investmentTotal);
    } else {
      alert('Please enter a valid number for total investment.');
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
  });
}

function handlePortfolioValue(result) {
  const portfolioValue = parseFloat(result.portfolioValue) || 0.0;
  if (!result?.portfolioValue) {
    document.getElementById('portfolio-value').innerText = 'No data available.';
    return;
  }
  const currentInvestmentTotal = result.currentInvestmentTotal || 0.0;
  const investmentTotal = result.investmentTotal || 0.0;
  const totalMoney = parseFloat(result.totalMoney) || portfolioValue;
  const container = document.getElementById('portfolio-value');
  container.innerHTML = '';
  container.appendChild(labeledValue('Portfolio Value', portfolioValue.toFixed(2)));
  if (investmentTotal && investmentTotal !== 0.0) {
    container.appendChild(labeledValue('Returns', (totalMoney - investmentTotal).toFixed(2)));
  } else {
    container.appendChild(labeledValue('Returns', (totalMoney - currentInvestmentTotal).toFixed(2)));
  }
}

function handlePurchasePower(result) {
  const purchasePower = parseFloat(result.purchasePower) || 0.0;
  if (!result?.purchasePower) {
    document.getElementById('purchase-power').innerText = 'No data available.';
    return;
  }
  const container = document.getElementById('purchase-power');
  container.innerHTML = '';
  container.appendChild(labeledValue('Purchase Power', purchasePower.toFixed(2)));
}

function handleCashInHolding(result) {
  const cachInHolding = parseFloat(result.cachInHolding) || 0.0;
  if (!result?.cachInHolding) {
    document.getElementById('cach-in-holding').innerText = 'No data available.';
    return;
  }
  const container = document.getElementById('cach-in-holding');
  container.innerHTML = '';
  container.appendChild(labeledValue('Cash in Holding', cachInHolding.toFixed(2)));
}

function handleTotalMoney(result) {
  const totalMoney = parseFloat(result) || 0.0;
  if (!result) {
    document.getElementById('total-money').innerText = 'No data available.';
    return;
  }
  const container = document.getElementById('total-money');
  container.innerHTML = '';
  container.appendChild(labeledValue(`Total Assets (${new Date().toLocaleTimeString()})`, totalMoney));
}

function saveInvestmentTotal(investmentTotal) {
  chrome.storage.local.set({ investmentTotal: investmentTotal });
}