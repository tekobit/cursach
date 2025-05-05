import {updateOutput} from "../updateOutput.js";


export function updateSidebarSize() {
    const converter = document.querySelector('.converter');
    const sidebar = document.getElementById('sidebar');
    const button = document.getElementById('menu-btn');
    // Вычисляем высоту до нижней границы конвертера

    // Устанавливаем высоту меню
    sidebar.style.height = `${converter.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom}px`;
    sidebar.style.top  = `${button.getBoundingClientRect().bottom}px`;
}

// export function saveCurrencyRate(sourceCurrency, targetCurrency,sourceValue,targetValue) {
export function saveCurrencyRate() {


    let sourceCurrency = document.getElementById("currency1-sidebar").value;
    let targetCurrency = document.getElementById("currency2-sidebar").value;
    let sourceValue = document.getElementById("input1-sidebar").value;
    let targetValue = document.getElementById("input2-sidebar").value;


    const selected = document.querySelector('input[name="radio-sidebar"]:checked').value;


    if (selected === "1") {
        removeChangedCurrency(sourceCurrency, targetCurrency);
        let changedCurrencies = JSON.parse(localStorage.getItem("changedCurrencies")) || [];
        let rates = JSON.parse(document.getElementById("rates-data").textContent);

        changedCurrencies.push({
            from: sourceCurrency,
            to: targetCurrency,
            fromValue: 1,
            toValue: targetValue/sourceValue,
            oldChangedCurrencyRate: rates[sourceCurrency]
        });
        localStorage.setItem("changedCurrencies", JSON.stringify(changedCurrencies));

    } else {
        removeChangedCurrency(targetCurrency, sourceCurrency);
        let changedCurrencies = JSON.parse(localStorage.getItem("changedCurrencies")) || [];
        let rates = JSON.parse(document.getElementById("rates-data").textContent);

        changedCurrencies.push({
            from: targetCurrency,
            to: sourceCurrency,
            fromValue: 1,
            toValue: sourceValue/targetValue,
            oldChangedCurrencyRate: rates[targetCurrency]
        });
        localStorage.setItem("changedCurrencies", JSON.stringify(changedCurrencies));

    }


    // if (favourites.length > 6) {
    //     let izbr = document.getElementById("izbrannoeBtn");
    //     izbr.classList.toggle("active");
    //     showNotification("Набрано максимальное количество избранных пар")
    //     return;
    // }

}

export  function renderChangedCurrencies() {
    console.log(" tytsa")

    let changedCurrenciesHTML = document.getElementById("changed_currencies");
    changedCurrenciesHTML.innerHTML = "";

    let changedCurrencies = JSON.parse(localStorage.getItem("changedCurrencies")) || [];
    for (let i = 0; i < changedCurrencies.length ; i++) {
        let entry = changedCurrencies[i];

        let box = document.createElement("div");
        box.innerText = `${entry.fromValue} ${entry.from} → ${entry.toValue} ${entry.to} `;
        box.classList.add("changed_currency_info");

        const removeBtn = document.createElement("span");
        removeBtn.textContent = " ✖";
        removeBtn.className = "remove-btn-sidebar";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            box.style.pointerEvents = 'none';
            box.classList.add("disappear");
            setTimeout(() => {
                removeChangedCurrency(entry.from, entry.to);
                renderChangedCurrencies();
                updateOutput('input1', 'input2', 'currency1', 'currency2');
            }, 500);
        }

        box.appendChild(removeBtn);

        changedCurrenciesHTML.appendChild(box);

    }

}

export function removeChangedCurrency(sourceCurrency, targetCurrency) {
    console.log("sadas")

    let changedCurrencies = JSON.parse(localStorage.getItem("changedCurrencies")) || [];
    let rates = JSON.parse(document.getElementById("rates-data").textContent);
    // console.log(sourceCurrency +" first " +  targetCurrency + changedCurrencies.length);
    let newChangedCurrencies = changedCurrencies;
    console.log(newChangedCurrencies.length);
    for (let i = 0; i < changedCurrencies.length ; i++) {
        let entry = changedCurrencies[i];
        if (sourceCurrency === entry.from && targetCurrency === entry.to ) {
            // console.log(entry.from + " second " + entry.to);
            newChangedCurrencies.splice(i, 1);
            rates[sourceCurrency] = entry.oldChangedCurrencyRate;
        }
        // console.log( entry.oldChangedCurrencyRate);
    }

    document.getElementById("rates-data").textContent = JSON.stringify(rates);
    localStorage.setItem("changedCurrencies", JSON.stringify(newChangedCurrencies));
    console.log(newChangedCurrencies.length);

    console.log("sadas" );

}

export function loadChangedCurrencyToRates() {

    let rates = JSON.parse(document.getElementById("rates-data").textContent);
    let new_rate
    // console.log("old euro = "+JSON.parse(document.getElementById("rates-data").textContent)['EUR'])

    let changedCurrencies = JSON.parse(localStorage.getItem("changedCurrencies")) || [];
    for (let i = 0; i < changedCurrencies.length ; i++) {
        let entry = changedCurrencies[i];
        // console.log(entry);
        let changedCurrency = entry.from;
        let notChangedCurrency = entry.to;

        // console.log(changedCurrency + " " + notChangedCurrency );
        // console.log(rates[changedCurrency] + " " + rates[notChangedCurrency] );
        let new_rate = Math.pow(entry.toValue /(entry.fromValue * rates[notChangedCurrency]),-1);
        rates[changedCurrency] = new_rate;
        // console.log(new_rate);
    }
    document.getElementById("rates-data").textContent = JSON.stringify(rates);
    // console.log("new euro = "+JSON.parse(document.getElementById("rates-data").textContent)['EUR'])
}

