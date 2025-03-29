import {updateOutput} from './updateOutput.js';

// добавляем в историю

export function saveToHistory(sourceCurrency, targetCurrency, amount) {
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

export function removeFromHistory(sourceCurrency, targetCurrency, amount) {
    let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];

    history.forEach((entry, index) => {
        if (sourceCurrency === entry.from && targetCurrency === entry.to && amount === entry.amount ) {
            history.splice(index, 1);
        }
    });

    localStorage.setItem("conversionHistory", JSON.stringify(history));
}

// создаем блоки с историей конвертаций

export function renderHistory() {
    let historyContainer = document.getElementById("historyList");

    historyContainer.classList.add("fade-out");

    historyContainer.addEventListener('transitionend', () => {
        historyContainer.innerHTML = "";  // Clear the container's content
        let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
        let lastIndex = history.length - 1;

        for (let i = lastIndex; i > lastIndex - 7 && i >= 0; i--) {
            let entry = history[i];

            let btn = document.createElement("button");
            btn.innerText = `${entry.amount} ${entry.from} → ${entry.to}`;
            btn.className = "hst_conv";

            btn.onclick = () => {
                document.getElementById("currency1").value = entry.from;
                document.getElementById("currency2").value = entry.to;

                $("#currency1").trigger("change");
                $("#currency2").trigger("change");

                document.getElementById("input1").value = entry.amount;
                updateOutput("input1", "input2", "currency1", "currency2", entry.amount);
            }

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

        historyContainer.classList.remove("fade-out");
    }, { once: true });
}
