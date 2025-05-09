import {updateOutput} from './updateOutput.js';

// добавляем в избранное
//TODO неправильно перерассчитываются курсы валют если добавить вал1-вал2 и вал2-вал1 .
// Сначала все правильно используется курс вал2-вал1 т.к.
// он добавлен последним, но после удаления вал2-вал1 должен использоваться вал1-вал2
// но этого не происходит почему-то no ideas((
// как вариант можно удалить в принципе эту возможность
export async function saveToFavourites(sourceCurrency, targetCurrency) {
    const csrf = getCookie('csrftoken');
    if (window.isAuthenticated) {
        const response = await fetch('/converter/api/favourites/add/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',
                'X-CSRFToken': csrf},
            body: JSON.stringify({from: sourceCurrency, to: targetCurrency})
        });

        if (!response.ok) {
            const error = await response.json();
            showNotification(error.error || "Ошибка");
        }
    } else {
        let favourites = getFavouritesFromCookie();
        if (favourites.length >= 6) {
            showNotification("Набрано максимальное количество избранных пар");
            return;
        }
        favourites.push({ from: sourceCurrency, to: targetCurrency });
        setFavouritesToCookie(favourites);
    }

}

// удаляем из избранного

export async function removeFromFavourites(sourceCurrency, targetCurrency) {
    const csrf = getCookie('csrftoken');
    if (window.isAuthenticated) {
        await fetch('/converter/api/favourites/remove/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',
                'X-CSRFToken': csrf},
            body: JSON.stringify({from: sourceCurrency, to: targetCurrency})
        });
    } else {
        removeFromFavouritesCookie(sourceCurrency, targetCurrency);
    }

}

// рендерим избранное

export  async function renderFavourites() {
    const favourites = await fetchFavourites();
    let favouriteList = document.getElementById("favouriteList");
    favouriteList.innerHTML = "";

    favourites.forEach(entry => {
        let btn = document.createElement("button");
        btn.innerText = `${entry.from} → ${entry.to} `;
        btn.onclick = () => {
            document.getElementById("currency1").value = entry.from;
            document.getElementById("currency2").value = entry.to;

            $("#currency1").trigger("change");
            $("#currency2").trigger("change");

            updateOutput("input1", "input2", "currency1", "currency2");
            handleActiveness();
        };
        btn.className = "fav_conv";
        favouriteList.appendChild(btn);
        setTimeout(() => btn.classList.add("show"), 10);
    });
}

// проверяем, если есть в списке избранных, красим кнопку желтым
export async function handleActiveness() {
    let izbr = document.getElementById("izbrannoeBtn");

    let from = document.getElementById("currency1").value;
    let to = document.getElementById("currency2").value;

    const favourites = await fetchFavourites();

    izbr.classList.remove("active");
    for (let i = 0; i < favourites.length; i++) {
        let entry = favourites[i];
        if (entry.from === from && entry.to === to) {
            izbr.classList.add("active");
        }
    }
}


// уведомление (в данный момент используется только для максимума избранных пар)
export function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.add('disappear');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 2000);
}

async function fetchFavourites() {
    if (window.isAuthenticated) {
        const response = await fetch('/converter/api/favourites/');
        return await response.json();
    } else {
        return getFavouritesFromCookie();
    }

}


// отдельные методы для работы с куки, в случае когда пользователь не зарегистрирован
function getFavouritesFromCookie() {
    const match = document.cookie.match(/(?:^|; )favourites=([^;]*)/);
    if (!match) return [];
    try {
        return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
        return [];
    }
}

function setFavouritesToCookie(favourites) {
    document.cookie = "favourites=" + encodeURIComponent(JSON.stringify(favourites)) +
        "; path=/; max-age=604800";  // 7 дней
}

function removeFromFavouritesCookie(sourceCurrency, targetCurrency) {
    let favourites = getFavouritesFromCookie();

    favourites = favourites.filter(entry => !(entry.from === sourceCurrency && entry.to === targetCurrency));

    setFavouritesToCookie(favourites);

    renderFavourites();
}