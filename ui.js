function labeledValue(label, value, valueClassName = '') {
    const row = document.createElement('div');
    row.className = 'kv';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'kv-label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'kv-value';
    if (valueClassName) {
        valueSpan.classList.add(valueClassName);
    }
    valueSpan.textContent = value;

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
}