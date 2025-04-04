import {updateOutput} from './updateOutput.js';
import * as izbrannoe from './izbrannoe.js';

// при загрузке страницы
window.onload = function() {
    updateOutput('input1', 'input2', 'currency1', 'currency2');
    izbrannoe.renderFavourites();
    izbrannoe.handleActiveness();
};

// добавляем события на поля выбора валют
$(function(){
    $('.currency-select').select2();

    $(".currency-select").on("change", function () {
        updateOutput('input1', 'input2', 'currency1', 'currency2');
        izbrannoe.handleActiveness();
    });
})

document.getElementById("input2").addEventListener("input", function() {
    updateOutput("input2", "input1", "currency2", "currency1");
});
document.getElementById("input1").addEventListener("input", function() {
    updateOutput("input1", "input2", "currency1", "currency2");
});


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
    izbrannoe.handleActiveness();


});

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


let izbr = document.getElementById("izbrannoeBtn");


// обрабатываем клик на кнопку звезды
izbr.addEventListener("click", function () {
    izbr.classList.toggle("active");
    let isActive= false
    const currency1Value = document.getElementById('currency1').value;
    const currency2Value = document.getElementById('currency2').value;

    izbr.classList.forEach(el => {
        if (el === "active") {
            isActive = true
        }
    })

    if (isActive) {
        izbrannoe.saveToFavourites(currency1Value,currency2Value)
        izbrannoe.renderFavourites()
    } else {
        izbrannoe.removeFromFavourites(currency1Value,currency2Value)
        izbrannoe.renderFavourites()
    }

});



