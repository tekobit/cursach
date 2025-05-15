import {saveToHistory} from './history.js'
// функция для изменения значения в полях ввода и вывода
let debounceTimer;

export function updateOutput(sourceId, targetId, currency1Id, currency2Id,amount = null) {
    let rates = JSON.parse(document.getElementById("rates-data").textContent);

    const sourceCurrency = document.getElementById(currency1Id).value;
    const targetCurrency = document.getElementById(currency2Id).value;

    const sourceRate = rates[sourceCurrency];
    const targetRate = rates[targetCurrency];

    const sourceInput = document.getElementById(sourceId);

    let sourceValue = amount!==null ? amount : parseFloat(sourceInput.value);


    const result = (sourceValue * targetRate) / sourceRate;


    const targetInput = document.getElementById(targetId);
    targetInput.value = isNaN(result) ? '' : Number( result.toFixed(Math.max( getDecimalPlaces(sourceRate),getDecimalPlaces(targetRate) ) )  );


    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => { // +async
        await saveToHistory(sourceCurrency, targetCurrency, sourceValue); // +await
        // renderHistory()
    }, 800); // тут таймер, сколько прождать, чтобы сохранить в историю
}

function getDecimalPlaces(num) {
    if (!num.toString().includes('.')) return 0; // No decimal point
    return num.toString().split('.')[1].length;
}
