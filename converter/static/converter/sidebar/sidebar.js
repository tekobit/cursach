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

export async function saveCurrencyRate() {

    let sourceCurrency = document.getElementById("currency1-sidebar").value;
    let targetCurrency = document.getElementById("currency2-sidebar").value;
    let sourceValue = document.getElementById("input1-sidebar").value;
    let targetValue = document.getElementById("input2-sidebar").value;


    const selected = document.querySelector('input[name="radio-sidebar"]:checked').value;
    let rates = JSON.parse(document.getElementById("rates-data").textContent);

    let payload;

    if (selected === "1") {
        await removeChangedCurrency(sourceCurrency, targetCurrency);

        payload = {
            from: sourceCurrency,
            to: targetCurrency,
            fromValue: 1,
            toValue: targetValue / sourceValue,
            oldChangedCurrencyRate: rates[sourceCurrency]
        };

    } else {
        await removeChangedCurrency(targetCurrency, sourceCurrency);

        payload = {
            from: targetCurrency,
            to: sourceCurrency,
            fromValue: 1,
            toValue: sourceValue / targetValue,
            oldChangedCurrencyRate: rates[targetCurrency]
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
    console.log(typeof changedCurrencies);
    let rates = JSON.parse(document.getElementById("rates-data").textContent);

    const newChangedCurrencies = changedCurrencies.filter(entry => {
        return !(entry.from === sourceCurrency && entry.to === targetCurrency);
    });

    for (const entry of changedCurrencies) {
        if (entry.from === sourceCurrency && entry.to === targetCurrency) {
            rates[sourceCurrency] = entry.oldChangedCurrencyRate;
            break;
        }
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
        saveChangedCurrenciesToCookie(newChangedCurrencies);
    }

}

export async function loadChangedCurrencyToRates() {

    let rates = JSON.parse(document.getElementById("rates-data").textContent);

    let changedCurrencies = await fetchChangedCurrencies();

    for (let i = 0; i < changedCurrencies.length; i++) {
        let entry = changedCurrencies[i];
        let changedCurrency = entry.from;
        let notChangedCurrency = entry.to;

        let new_rate = Math.pow(entry.toValue / (entry.fromValue * rates[notChangedCurrency]), -1);
        rates[changedCurrency] = new_rate;
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