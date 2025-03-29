import {saveToHistory,renderHistory} from './history.js'
// функция для изменения значения в полях ввода и вывода
let debounceTimer;
let rates = JSON.parse(document.getElementById("rates-data").textContent);

export function updateOutput(sourceId, targetId, currency1Id, currency2Id,amount = null) {

    const sourceCurrency = document.getElementById(currency1Id).value;
    const targetCurrency = document.getElementById(currency2Id).value;

    const sourceRate = rates[sourceCurrency];
    const targetRate = rates[targetCurrency];

    const sourceInput = document.getElementById(sourceId);

    let sourceValue = amount!==null ? amount : parseFloat(sourceInput.value);


    const result = (sourceValue * targetRate) / sourceRate;


    const targetInput = document.getElementById(targetId);
    targetInput.value = isNaN(result) ? '' : result.toFixed(2);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        saveToHistory(sourceCurrency, targetCurrency, sourceValue); // Здесь вызываем сохранение
        renderHistory()
    }, 800); // тут таймер, сколько прождать, чтобы сохранить в историю хардкод(((
}
