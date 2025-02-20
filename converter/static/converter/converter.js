let rates = JSON.parse(document.getElementById("rates-data").textContent);

function updateOutput(sourceId, targetId, currency1, currency2) {
    const sourceCurrency = document.getElementById(currency1).value;
    const targetCurrency = document.getElementById(currency2).value;

    // Get the exchange rates
    const sourceRate = rates[sourceCurrency];
    const targetRate = rates[targetCurrency];

    const sourceInput = document.getElementById(sourceId);
    const sourceValue = parseFloat(sourceInput.value);

    // Calculate the result
    const result = (sourceValue * targetRate) / sourceRate;

    const targetInput = document.getElementById(targetId);
    targetInput.value = isNaN(result) ? '' : result.toFixed(2); // Handle invalid input
}

$(function(){
    $('.currency-select').select2();
    $(".currency-select").on("change", function () {
        updateOutput('input1', 'input2', 'currency1', 'currency2');
    });

})

document.querySelector('.swap-btn').addEventListener('click', function () {
    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');
    const currency1 = document.getElementById('currency1');
    const currency2 = document.getElementById('currency2');

    // Swap input values
    const tempInput = input1.value;
    input1.value = input2.value;
    input2.value = tempInput;

    // Swap selected currencies
    const tempCurrency = currency1.value;
    currency1.value = currency2.value;
    currency2.value = tempCurrency;

    $("#currency1").trigger('change');
    $("#currency2").trigger('change');

    // Recalculate the output
    updateOutput('input1', 'input2', 'currency1', 'currency2');
});

let currency1= document.getElementById('currency1');

currency1.addEventListener("change", function() {
    console.log(currency1.value);
});

window.onload = function() {
    updateOutput('input1', 'input2', 'currency1', 'currency2');
};


document.querySelectorAll('.only_number_input').forEach(input => input.addEventListener("keydown", (event) => {
    // Allow numbers (0-9)
    if (event.code.startsWith("Digit")) {
        return; // Allow numbers
    }

    // Allow Backspace, Delete, Arrow keys, Tab, Enter
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(event.code)) {
        return;
    }

    // Allow decimal point (.) but only one
    if (event.code === "Period" && !event.target.value.includes(".")) {
        return;
    }

    // If not allowed, prevent input
    event.preventDefault();
}))

function isNumberKey(evt) {
    let charCode = (evt.which) ? evt.which : evt.keyCode;
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
}
