function labeledValue(label, value) {
    const div = document.createElement('div');
    div.innerHTML = `${label}: ${value}`;
    return div;
}