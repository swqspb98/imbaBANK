// Основные игровые переменные
let money = 0;
let perClick = 1;
let upgrades = {
    1: { purchased: false, price: 50, effect: "click" }, // Усиленная печать
    2: { purchased: false, price: 150, effect: "auto" },  // Национальный банк
    3: { purchased: false, price: 500, effect: "multiplier" }, // Финансовый гений
    4: { purchased: false, price: 1200, effect: "speed" } // Экономическое чудо
};

// Переменные для авто-дохода
let autoIncome = 0;
let autoIncomeInterval = 3000; // 3 секунды
let autoIncomeTimer = null;
let timeLeft = autoIncomeInterval;
let autoIncomeMultiplier = 1;

// DOM элементы
const moneyElement = document.getElementById('money');
const perClickElement = document.getElementById('perClick');
const coinElement = document.getElementById('coin');
const resetButton = document.getElementById('reset-btn');
const autoclickerProgress = document.getElementById('autoclicker-progress');
const autoclickerTimer = document.getElementById('autoclicker-timer');
const popup = document.getElementById('popup');

// Инициализация игры
function initGame() {
    loadGame();
    updateUI();
    setupEventListeners();
    
    // Запуск авто-дохода, если куплено улучшение
    if (autoIncome > 0) {
        startAutoIncome();
    }
}

// Загрузка игры из localStorage
function loadGame() {
    const savedGame = localStorage.getItem('tugrikClicker');
    
    if (savedGame) {
        const gameData = JSON.parse(savedGame);
        money = gameData.money || 0;
        perClick = gameData.perClick || 1;
        upgrades = gameData.upgrades || upgrades;
        autoIncome = gameData.autoIncome || 0;
        autoIncomeInterval = gameData.autoIncomeInterval || 3000;
        autoIncomeMultiplier = gameData.autoIncomeMultiplier || 1;
    }
}

// Сохранение игры в localStorage
function saveGame() {
    const gameData = {
        money,
        perClick,
        upgrades,
        autoIncome,
        autoIncomeInterval,
        autoIncomeMultiplier
    };
    
    localStorage.setItem('tugrikClicker', JSON.stringify(gameData));
}

// Обновление интерфейса
function updateUI() {
    moneyElement.textContent = formatNumber(money);
    perClickElement.textContent = formatNumber(perClick);
    
    // Обновление кнопок улучшений
    for (let i = 1; i <= 4; i++) {
        const upgrade = upgrades[i];
        const button = document.querySelector(`.buy-btn[data-id="${i}"]`);
        const card = document.getElementById(`upgrade${i}`);
        
        if (upgrade.purchased) {
            button.textContent = "Куплено";
            button.disabled = true;
            button.classList.add('purchased');
            card.classList.add('purchased');
        } else {
            button.disabled = money < upgrade.price;
        }
    }
    
    // Обновление информации об авто-доходе
    updateAutoIncomeInfo();
}

// Форматирование чисел (добавление разделителей тысяч)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Обработка клика по монете
function handleCoinClick() {
    // Анимация монеты
    coinElement.style.transform = 'scale(0.95) rotate(15deg)';
    
    setTimeout(() => {
        coinElement.style.transform = 'scale(1) rotate(0deg)';
    }, 100);
    
    // Добавление денег
    money += perClick;
    
    // Создание попапа с полученной суммой
    createPopup(perClick);
    
    // Обновление UI и сохранение
    updateUI();
    saveGame();
}

// Создание всплывающего сообщения о полученных тугриках
function createPopup(amount) {
    const newPopup = popup.cloneNode(true);
    newPopup.textContent = `+${formatNumber(amount)} ₮`;
    newPopup.style.opacity = '1';
    newPopup.style.left = `${Math.random() * 70 + 15}%`;
    newPopup.style.top = `${Math.random() * 40 + 30}%`;
    
    document.body.appendChild(newPopup);
    
    // Анимация всплывания и исчезновения
    setTimeout(() => {
        newPopup.style.opacity = '0';
        newPopup.style.transform = 'translateY(-50px)';
    }, 100);
    
    setTimeout(() => {
        document.body.removeChild(newPopup);
    }, 1500);
}

// Покупка улучшения
function buyUpgrade(id) {
    const upgrade = upgrades[id];
    
    if (money >= upgrade.price && !upgrade.purchased) {
        money -= upgrade.price;
        upgrade.purchased = true;
        
        // Применение эффекта улучшения
        applyUpgradeEffect(id);
        
        // Обновление UI и сохранение
        updateUI();
        saveGame();
    }
}

// Применение эффекта улучшения
function applyUpgradeEffect(id) {
    switch(id) {
        case 1: // Усиленная печать
            perClick += 1;
            break;
        case 2: // Национальный банк
            autoIncome += 2;
            startAutoIncome();
            break;
        case 3: // Финансовый гений
            perClick *= 2;
            break;
        case 4: // Экономическое чудо
            autoIncomeMultiplier *= 2;
            // Обновляем интервал авто-дохода
            if (autoIncomeTimer) {
                clearInterval(autoIncomeTimer);
                autoIncomeInterval = 3000 / autoIncomeMultiplier;
                startAutoIncome();
            }
            break;
    }
}

// Запуск авто-дохода
function startAutoIncome() {
    if (autoIncomeTimer) {
        clearInterval(autoIncomeTimer);
        clearInterval(progressTimer);
    }
    
    if (autoIncome <= 0) return;
    
    // Сбрасываем таймер
    timeLeft = autoIncomeInterval;
    
    // Запускаем интервал для авто-дохода
    autoIncomeTimer = setInterval(() => {
        money += autoIncome;
        
        // Создание попапа для авто-дохода
        createPopup(autoIncome);
        
        // Обновление UI и сохранение
        updateUI();
        saveGame();
        
        // Сброс таймера
        timeLeft = autoIncomeInterval;
        autoclickerProgress.style.width = '0%';
    }, autoIncomeInterval);
    
    // Запускаем анимацию прогресс  бара
    const progressStep = 100 / (autoIncomeInterval / 100);
    let progress = 0;
    
    const progressTimer = setInterval(() => {
        timeLeft -= 100;
        progress += progressStep;
        autoclickerProgress.style.width = `${progress}%`;
        
        // Обновление текста таймера
        const seconds = Math.ceil(timeLeft / 1000);
        autoclickerTimer.textContent = `Авто-доход через: ${seconds}с`;
    }, 100);
}

// Обновление информации об авто-доходе
function updateAutoIncomeInfo() {
    if (autoIncome > 0) {
        autoclickerTimer.textContent = `Авто-доход: +${autoIncome} ₮ каждые ${3/autoIncomeMultiplier}с`;
        document.querySelector('.autoclicker-info').style.display = 'block';
    } else {
        document.querySelector('.autoclicker-info').style.display = 'none';
    }
}

// Сброс прогресса игры
function resetGame() {
    if (confirm("Вы уверены, что хотите обнулить казну? Весь прогресс будет потерян.")) {
        // Сброс переменных
        money = 0;
        perClick = 1;
        autoIncome = 0;
        autoIncomeInterval = 3000;
        autoIncomeMultiplier = 1;
        
        // Сброс улучшений
        for (let id in upgrades) {
            upgrades[id].purchased = false;
        }
        
        // Остановка таймеров
        if (autoIncomeTimer) {
            clearInterval(autoIncomeTimer);
        }
        
        // Очистка localStorage
        localStorage.removeItem('tugrikClicker');
        
        // Обновление UI
        updateUI();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Клик по монете
    coinElement.addEventListener('click', handleCoinClick);
    
    // Клики по кнопкам покупки улучшений
    document.querySelectorAll('.buy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            buyUpgrade(id);
        });
    });
    
    // Кнопка сброса прогресса
    resetButton.addEventListener('click', resetGame);
    
    // Поддержка сенсорных устройств
    coinElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleCoinClick();
    });
    
    // Сохранение при закрытии окна
    window.addEventListener('beforeunload', saveGame);
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', initGame);
