import { updateOutput } from './updateOutput.js';
import { updateSidebarSize } from "./sidebar/sidebar.js";

function getHistoryFromLocalStorage() {
    return JSON.parse(localStorage.getItem("conversionHistory")) || [];
}

function saveHistoryToLocalStorage(historyArray) {
    localStorage.setItem("conversionHistory", JSON.stringify(historyArray));
}

function removeFromHistoryLocalStorage(sourceCurrency, targetCurrency, amount) {
    let history = getHistoryFromLocalStorage();
    const initialLength = history.length;
    history = history.filter(entry =>
        !(entry.from === sourceCurrency && entry.to === targetCurrency && entry.amount === parseFloat(amount))
    );

    if (history.length < initialLength) {
        saveHistoryToLocalStorage(history);
    }
}

export async function saveToHistory(sourceCurrency, targetCurrency, amount) { // +async
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount === null) { return; }

    if (window.isAuthenticated) {
        // отправляем на сервер для аутентифицированных пользователей
        try {
            const csrfToken = window.getCookie('csrftoken'); // window.getCookie
            const response = await fetch('/api/history/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    from: sourceCurrency,
                    to: targetCurrency,
                    amount: numericAmount
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to save history to server:", errorData);
            }
        } catch (error) {
            console.error("Error saving history to server:", error);
        }
    } else {
        // логика для localStorage для неаутентифицированных
        removeFromHistoryLocalStorage(sourceCurrency, targetCurrency, numericAmount);

        let history = getHistoryFromLocalStorage();
        history.push({
            from: sourceCurrency,
            to: targetCurrency,
            amount: numericAmount,
            date: new Date().toISOString()
        });

        if (history.length > 150) {
            history.sort((a, b) => new Date(b.date) - new Date(a.date)); // удаляем самую старую
            history = history.slice(0, 150);
        }
        saveHistoryToLocalStorage(history);
    }
    // вызываем renderHistory для обновления UI
    await renderHistory();
}

export async function renderHistory() { // +async
    const historyContainer = document.getElementById("historyList");
    if (!historyContainer) return;

    historyContainer.classList.add("fade-out");

    let historyEntries = [];
    if (window.isAuthenticated) {
        try {
            const response = await fetch('/api/history/');
            if (response.ok) {
                historyEntries = await response.json(); // сервер должен вернуть отсортированные и ограниченные
            } else {
                const errorText = await response.text();
                console.error("Failed to fetch history from server:", errorText);
            }
        } catch (error) {
            console.error("Error fetching history from server:", error);
        }
    } else {
        historyEntries = getHistoryFromLocalStorage();
        historyEntries.sort((a, b) => new Date(b.date) - new Date(a.date)); // новые вверху
        historyEntries = historyEntries.slice(0, 7); // последние 7
    }

    // исключаем записи, где amount не число
    historyEntries = historyEntries.filter(entry => typeof entry.amount === 'number' && !isNaN(entry.amount));


    // для более плавной анимации после получения данных
    requestAnimationFrame(() => {
        historyContainer.innerHTML = ""; // очищаем контейнер один раз

        historyEntries.forEach(entry => {
            const btn = document.createElement("button");
            btn.innerText = `${entry.amount} ${entry.from} → ${entry.to}`;
            btn.className = "hst_conv";

            btn.onclick = () => {
                document.getElementById("currency1").value = entry.from;
                document.getElementById("currency2").value = entry.to;
                $("#currency1").trigger("change");
                $("#currency2").trigger("change");
                document.getElementById("input1").value = entry.amount;
                updateOutput("input1", "input2", "currency1", "currency2", entry.amount);
            };

            if (!window.isAuthenticated) {
                const removeBtn = document.createElement("span");
                removeBtn.textContent = " ✖";
                removeBtn.className = "remove-btn";
                removeBtn.onclick = async (e) => {
                    e.stopPropagation();
                    btn.style.pointerEvents = 'none';
                    btn.classList.add("disappear");
                    await new Promise(resolve => setTimeout(resolve, 500)); // ждем завершения анимации
                    removeFromHistoryLocalStorage(entry.from, entry.to, entry.amount);
                    await renderHistory();
                };
                btn.appendChild(removeBtn);
            }
            historyContainer.appendChild(btn);
            // плавное появление кнопки
            requestAnimationFrame(() => {
                 setTimeout(() => btn.classList.add("show"), 10); // небольшая задержка для CSS-перехода
            });
        });

        historyContainer.classList.remove("fade-out");
        // обновляем размер сайдбара, если он есть и видимый
        if (typeof updateSidebarSize === 'function') {
            updateSidebarSize();
        }
    });
}

export async function clearHistory() {
    if (window.isAuthenticated) {
        try {
            const csrfToken = window.getCookie('csrftoken');
            const response = await fetch('/api/history/clear/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken }
            });
            if (!response.ok) {
                console.error("Failed to clear history on server", await response.json());
            }
        } catch (error) {
            console.error("Error clearing history on server:", error);
        }
    } else {
        localStorage.removeItem("conversionHistory");
    }
    await renderHistory(); // обновляем отображение
}
