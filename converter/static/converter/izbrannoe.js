import {updateOutput} from './updateOutput.js';

// добавляем в избранное
//TODO неправильно перерассчитываются курсы валют если добавить вал1-вал2 и вал2-вал1 .
// Сначала все правильно используется курс вал2-вал1 т.к.
// он добавлен последним, но после удаления вал2-вал1 должен использоваться вал1-вал2
// но этого не происходит почему-то no ideas((
// как вариант можно удалить впринципе эту возможность
export function saveToFavourites(sourceCurrency, targetCurrency) {
    let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

    favourites.push({
        from: sourceCurrency,
        to: targetCurrency,

    });
    if (favourites.length > 6) {
        let izbr = document.getElementById("izbrannoeBtn");
        izbr.classList.toggle("active");
        showNotification("Набрано максимальное количество избранных пар")
        return;
    }

    localStorage.setItem("favourites", JSON.stringify(favourites));
}

// удаляем из избранного

export function removeFromFavourites(sourceCurrency, targetCurrency) {
    let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

    favourites.forEach((entry, index) => {
        if (sourceCurrency === entry.from && targetCurrency === entry.to  ) {
            favourites.splice(index, 1);
        }
    });

    localStorage.setItem("favourites", JSON.stringify(favourites));
}

// рендерим избранное

export  function renderFavourites() {

    let favouriteList = document.getElementById("favouriteList");
    favouriteList.innerHTML = "";

    let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
    for (let i = 0; i < favourites.length ; i++) {
        let entry = favourites[i];

        let btn = document.createElement("button");
        btn.innerText = `${entry.from} → ${entry.to} `;
        btn.onclick = () => {
            document.getElementById("currency1").value = entry.from;
            document.getElementById("currency2").value = entry.to;

            $("#currency1").trigger("change");
            $("#currency2").trigger("change");

            updateOutput("input1", "input2", "currency1", "currency2");
            handleActiveness()
        }
        btn.className = "fav_conv";


        favouriteList.appendChild(btn);
        setTimeout(() => {
            btn.classList.add("show");
        }, 10);
    }

}

// проверяем, если есть в списке избранных, красим кнопку желтым
export function handleActiveness() {
    let izbr = document.getElementById("izbrannoeBtn");
    let from = document.getElementById("currency1").value ;
    let to = document.getElementById("currency2").value ;
    let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
    izbr.classList.remove("active");
    for (let i = 0; i < favourites.length ; i++) {
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