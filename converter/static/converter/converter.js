// загрузка словаря с курсами валют
let rates = JSON.parse(document.getElementById("rates-data").textContent);

// функция для изменения значения в полях ввода и вывода
function updateOutput(sourceId, targetId, currency1, currency2) {
    // получаем валюты из полей ввода
    const sourceCurrency = document.getElementById(currency1).value;
    const targetCurrency = document.getElementById(currency2).value;

    // получаем курсы валют из словаря
    const sourceRate = rates[sourceCurrency];
    const targetRate = rates[targetCurrency];

    // получаем текущее значение поля ввода
    const sourceInput = document.getElementById(sourceId);
    const sourceValue = parseFloat(sourceInput.value);

    // вычисляем итоговое значение поля вывода
    const result = (sourceValue * targetRate) / sourceRate;

    // выводим результат в поле вывода
    const targetInput = document.getElementById(targetId);
    targetInput.value = isNaN(result) ? '' : result.toFixed(2);
}


// добавляем события на поля выбора валют
$(function(){
    // инициализация select2 для выбора валют
    $('.currency-select').select2();

    // обработка события изменения валюты в полях ввода и вывода
    $(".currency-select").on("change", function () {
        updateOutput('input1', 'input2', 'currency1', 'currency2');
    });
})

// обработка события клика на кнопку "менять местами"
document.querySelector('.swap-btn').addEventListener('click', function () {
    // получаем поля ввода и вывода и валюты из полей выбора
    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');
    const currency1 = document.getElementById('currency1');
    const currency2 = document.getElementById('currency2');

    // меняем местами значения полей ввода и вывода и валюты
    const tempInput = input1.value;
    input1.value = input2.value;
    input2.value = tempInput;

    // меняем местами валюты в полях выбора
    const tempCurrency = currency1.value;
    currency1.value = currency2.value;
    currency2.value = tempCurrency;

    // вызываем функцию для пересчета значений полей ввода и вывода при смене валюты
    $("#currency1").trigger('change');
    $("#currency2").trigger('change');

    // Обновляем значения в полях ввода после смены валют
    updateOutput('input1', 'input2', 'currency1', 'currency2');
});

// Загрузка страницы и пересчет значений полей ввода и вывода при инициализации
window.onload = function() {
    updateOutput('input1', 'input2', 'currency1', 'currency2');
};



// Ограничение ввода только чисел и точки в полях ввода
document.querySelectorAll('.only_number_input').forEach(input => input.addEventListener("keydown", (event) => {
    // Ничего не делаем, если вводится цифра
    if (event.code.startsWith("Digit")) {
        return;
    }
    // Ничего не делаем, если вводятся специальные клавиши
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(event.code)) {
        return;
    }
    // Ничего не делаем, если вводится точка
    if (event.code === "Period" && !event.target.value.includes(".")) {
        return;
    }

    // Отменяем ввод, если введен недопустимый символ
    event.preventDefault();
}))

