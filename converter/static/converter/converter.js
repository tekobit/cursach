// загрузка словаря с курсами валют
let rates = JSON.parse(document.getElementById("rates-data").textContent);
let debounceTimer;

// функция для изменения значения в полях ввода и вывода
function updateOutput(sourceId, targetId, currency1Id, currency2Id,amount = null) {

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
        saveConversionHistory(sourceCurrency, targetCurrency, sourceValue); // Здесь вызываем сохранение
        renderHistory()
    }, 800); // тут таймер, сколько прождать, чтобы сохранить в историю хардкод(((
}


// добавляем события на поля выбора валют
$(function(){
    $('.currency-select').select2();

    $(".currency-select").on("change", function () {
        updateOutput('input1', 'input2', 'currency1', 'currency2');
    });
})

// обработка кнопки "менять местами"
document.querySelector('.swap-btn').addEventListener('click', function () {

    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');
    const currency1 = document.getElementById('currency1');
    const currency2 = document.getElementById('currency2');

    const tempInput = input1.value;
    input1.value = input2.value;
    input2.value = tempInput;

    const tempCurrency = currency1.value;
    currency1.value = currency2.value;
    currency2.value = tempCurrency;

    $("#currency1").trigger('change');
    $("#currency2").trigger('change');

    updateOutput('input1', 'input2', 'currency1', 'currency2');


});

// при загрузке страницы
window.onload = function() {
    updateOutput('input1', 'input2', 'currency1', 'currency2');
};

// ограничения ввода на числа
document.querySelectorAll('.only_number_input').forEach(input =>{
    input.addEventListener("keydown", (event) => {
        if (event.code.startsWith("Digit")) {
            return;
        }

        if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(event.code)) {
            return;
        }

        if (event.code === "Period" && !event.target.value.includes(".")) {
            return;
        }

        event.preventDefault();
    });

})


// создаем блоки с историей конвертаций

function renderHistory() {


    let historyContainer = document.getElementById("historyContainer");
    historyContainer.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];

    let lastIndex = history.length - 1;
    for (let i = lastIndex; i > lastIndex - 10 && i >= 0; i--) {
        let entry = history[i];

        let btn = document.createElement("button");
        btn.innerText = `${entry.amount} ${entry.from} → ${entry.to} `;
        btn.onclick = () => {
            document.getElementById("currency1").value = entry.from;
            document.getElementById("currency2").value = entry.to;

            $("#currency1").trigger("change");
            $("#currency2").trigger("change");

            document.getElementById("input1").value = entry.amount;

            updateOutput("input1", "input2", "currency1", "currency2", entry.amount);
        }
        btn.className = "hst_conv";

        const removeBtn = document.createElement("span");
        removeBtn.textContent = " ✖";
        removeBtn.className = "remove-btn";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            btn.style.pointerEvents = 'none';
            btn.classList.add("disappear");
            setTimeout(() => {
                removeFromHistory(entry.from, entry.to, entry.amount);
                renderHistory();
            }, 500);
        }

        btn.appendChild(removeBtn);
        historyContainer.appendChild(btn);
        setTimeout(() => {
            btn.classList.add("show");
        }, 10);
    }

}


// добавляем в историю
function saveConversionHistory(sourceCurrency, targetCurrency, amount) {
    if (isNaN(amount) || amount === null) {return 0}
    removeFromHistory(sourceCurrency, targetCurrency, amount);
    let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];


    history.push({
        from: sourceCurrency,
        to: targetCurrency,
        amount: amount,
        date: new Date().toISOString()
    });
    if (history.length > 150) {
        history.shift();
    }

    localStorage.setItem("conversionHistory", JSON.stringify(history));


}

// удаляем из истории (если есть)
function removeFromHistory(sourceCurrency, targetCurrency, amount) {
    let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];

    history.forEach((entry, index) => {
        if (sourceCurrency === entry.from && targetCurrency === entry.to && amount === entry.amount ) {
            history.splice(index, 1);
        }
    });

    localStorage.setItem("conversionHistory", JSON.stringify(history));
}




