import {updateOutput} from "./updateOutput.js";


export function updateSidebarSize() {
    const converter = document.querySelector('.converter');
    const sidebar = document.getElementById('sidebar');
    const button = document.getElementById('menu-btn');
    // Вычисляем высоту до нижней границы конвертера

    // Устанавливаем высоту меню
    sidebar.style.height = `${converter.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom}px`;
    sidebar.style.top  = `${button.getBoundingClientRect().bottom}px`;
}

export async function saveCurrencyRate() {

    let sourceCurrency = document.getElementById("currency1-sidebar").value;
    let targetCurrency = document.getElementById("currency2-sidebar").value;
    let sourceValue = document.getElementById("input1-sidebar").value;
    let targetValue = document.getElementById("input2-sidebar").value;

    if (Number(sourceCurrency) === 0 || Number(targetValue) === 0 || sourceValue === "" || targetValue === "") { return;}

    const selected = document.querySelector('input[name="radio-sidebar"]:checked').value;

    let payload;

    if (selected === "1") {
        await removeChangedCurrency(sourceCurrency, targetCurrency);
        payload = {
            from: sourceCurrency,
            to: targetCurrency,
            fromValue: 1,
            toValue: targetValue / sourceValue,targetValue,sourceValue,
        };
    } else {
        await removeChangedCurrency(targetCurrency, sourceCurrency);
        payload = {
            from: targetCurrency,
            to: sourceCurrency,
            fromValue: 1,
            toValue: sourceValue / targetValue,sourceValue,targetValue,
        };
    }

    if (window.isAuthenticated) {
        await fetch("/api/changed/add/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify(payload)
        })
    } else {
        await addChangedCurrencyToCookie(payload);
    }

    await renderChangedCurrencies();

}

export async function renderChangedCurrencies() {

    let changedCurrenciesHTML = document.getElementById("changed_currencies");
    changedCurrenciesHTML.innerHTML = "";

    let changedCurrencies = await fetchChangedCurrencies();
    for (let i = 0; i < changedCurrencies.length; i++) {
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
            setTimeout(async () => {
                await removeChangedCurrency(entry.from, entry.to);
                await renderChangedCurrencies();
                updateOutput('input1', 'input2', 'currency1', 'currency2');
            }, 500);
        }

        box.appendChild(removeBtn);

        changedCurrenciesHTML.appendChild(box);

    }

}

export async function removeChangedCurrency(sourceCurrency, targetCurrency) {

    let changedCurrencies = await fetchChangedCurrencies();
    let rates = JSON.parse(document.getElementById("rates-data").textContent);
    let origRates = JSON.parse(document.getElementById("orig-rates-data").textContent);

    const changedCurrenciesAfterRemove = changedCurrencies.filter(entry => {
        return !(entry.from === sourceCurrency && entry.to === targetCurrency);
    });

    for (const entry of changedCurrencies) {
        rates[sourceCurrency] = origRates[sourceCurrency];

    }

    document.getElementById("rates-data").textContent = JSON.stringify(rates);

    if (window.isAuthenticated) {
        await fetch('/api/changed/remove/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ from: sourceCurrency, to: targetCurrency })
        });
    } else {
        saveChangedCurrenciesToCookie(changedCurrenciesAfterRemove);
    }
    await loadChangedCurrencyToRates()
}

export async function loadChangedCurrencyToRates() {

    let rates = JSON.parse(document.getElementById("rates-data").textContent);

    let changedCurrencies = await fetchChangedCurrencies();

    for (let i = 0; i < changedCurrencies.length; i++) {
        let entry = changedCurrencies[i];
        let changedCurrency = entry.from;
        let notChangedCurrency = entry.to;
        let new_rate = Math.pow(entry.toValue / (entry.fromValue * rates[notChangedCurrency]), -1);
        rates[changedCurrency] = strip(new_rate);
    }
    document.getElementById("rates-data").textContent = JSON.stringify(rates);
}

async function fetchChangedCurrencies() {
    if (window.isAuthenticated) {
        const response = await fetch('/api/changed/');
        if (!response.ok) {
            console.error("Не удалось получить данные с сервера");
            return [];
        }
        const data = await response.json();

        return data.data;
    } else {
        return getChangedCurrenciesFromCookie();
    }
}


// методы для куккк

function getChangedCurrenciesFromCookie() {
    const match = document.cookie.match(/(?:^|; )changedCurrencies=([^;]*)/);
    if (!match) return [];
    try {
        return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
        return [];
    }
}

function saveChangedCurrenciesToCookie(changedCurrencies) {
    document.cookie = "changedCurrencies=" + encodeURIComponent(JSON.stringify(changedCurrencies)) +
        "; path=/; max-age=604800";  // 7 дней
}

async function addChangedCurrencyToCookie(newEntry) {
    let changedCurrencies = getChangedCurrenciesFromCookie();

    changedCurrencies = changedCurrencies.filter(entry => !(entry.from === newEntry.from && entry.to === newEntry.to));

    changedCurrencies.unshift(newEntry);

    saveChangedCurrenciesToCookie(changedCurrencies);

    await renderChangedCurrencies();
}



function strip(number) {
    return (parseFloat(number).toPrecision(12));
}