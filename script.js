// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;

// Игровые переменные
let gameData = {
    balance: 0,
    perClick: 1,
    perSecond: 0,
    totalClicks: 0,
    totalEarned: 0,
    playTime: 0,
    level: 1,
    xp: 0,
    upgrades: {
        1: { id: 1, name: "Умный клик", price: 500, effect: "+2 за клик", purchased: false, type: "click" },
        2: { id: 2, name: "Автоматическая печать", price: 2000, effect: "+10 ₮/сек", purchased: false, type: "auto" },
        3: { id: 3, name: "Инвестиционный фонд", price: 10000, effect: "+1% к общему доходу в секунду", purchased: false, type: "percentage" },
        4: { id: 4, name: "Криптоферма", price: 50000, effect: "x3 ко всем доходам", purchased: false, type: "multiplier" },
        5: { id: 5, name: "Центробанк", price: 200000, effect: "x10 к авто-доходу", purchased: false, type: "autoMultiplier" }
    },
    autoMultiplier: 1,
    clickMultiplier: 1,
    usedPromocodes: [],
    dailyBonuses: {},
    loginStreak: 0,
    lastLogin: null,
    lastHourlyBonus: null,
    lastRouletteSpin: null,
    gamesWon: 0,
    leaderboard: []
};

// DOM элементы
const elements = {
    balance: document.getElementById('balance'),
    perClick: document.getElementById('per-click'),
    perSecond: document.getElementById('per-second'),
    playerLevel: document.getElementById('player-level'),
    mainCoin: document.getElementById('main-coin'),
    openUpgrades: document.getElementById('open-upgrades'),
    upgradesModal: document.getElementById('upgrades-modal'),
    closeUpgrades: document.getElementById('close-upgrades'),
    upgradesList: document.getElementById('upgrades-list'),
    hourlyBonusBtn: document.getElementById('hourly-bonus-btn'),
    hourlyTimer: document.getElementById('hourly-timer'),
    navButtons: document.querySelectorAll('.nav-btn'),
    screens: document.querySelectorAll('.screen'),
    settingsBtn: document.getElementById('settings-btn'),
    soundToggle: document.getElementById('sound-toggle'),
    vibrationToggle: document.getElementById('vibration-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    resetProgressBtn: document.getElementById('reset-progress-btn'),
    totalClicks: document.getElementById('total-clicks'),
    totalEarned: document.getElementById('total-earned'),
    playTime: document.getElementById('play-time'),
    gamesWon: document.getElementById('games-won'),
    promoCode: document.getElementById('promo-code'),
    activatePromoBtn: document.getElementById('activate-promo-btn'),
    promocodesList: document.getElementById('promocodes-list'),
    notification: document.getElementById('notification'),
    particlesContainer: document.getElementById('particles-container'),
    levelNumber: document.getElementById('level-number'),
    currentLevel: document.getElementById('current-level'),
    currentXp: document.getElementById('current-xp'),
    nextLevelXp: document.getElementById('next-level-xp'),
    levelProgressFill: document.getElementById('level-progress-fill'),
    levelBonusText: document.getElementById('level-bonus-text'),
    loginStreak: document.getElementById('login-streak'),
    nextBonusTime: document.getElementById('next-bonus-time'),
    bonusCalendar: document.getElementById('bonus-calendar'),
    playerName: document.getElementById('player-name')
};

// Инициализация игры
function initGame() {
    // Инициализация Telegram WebApp
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        elements.playerName.textContent = user.first_name || 'Игрок';
        tg.expand(); // Развернуть приложение на весь экран
    }
    
    // Загрузка сохраненных данных
    loadGameData();
    
    // Настройка интерфейса
    updateUI();
    setupEventListeners();
    initUpgradesList();
    initDailyBonuses();
    updateLevelProgress();
    initLeaderboard();
    
    // Запуск авто-дохода
    startAutoIncome();
    
    // Запуск таймеров
    startTimers();
    
    // Обновление времени игры
    setInterval(() => {
        gameData.playTime++;
        updateStats();
    }, 1000);
}

// Загрузка данных игры
function loadGameData() {
    const saved = localStorage.getItem('tugrikClickerPro');
    if (saved) {
        const loaded = JSON.parse(saved);
        
        // Объединяем загруженные данные с дефолтными (на случай добавления новых полей)
        gameData = { ...gameData, ...loaded };
        
        // Восстанавливаем даты
        if (gameData.lastLogin) gameData.lastLogin = new Date(gameData.lastLogin);
        if (gameData.lastHourlyBonus) gameData.lastHourlyBonus = new Date(gameData.lastHourlyBonus);
        if (gameData.lastRouletteSpin) gameData.lastRouletteSpin = new Date(gameData.lastRouletteSpin);
    }
    
    // Проверяем ежедневный бонус
    checkDailyBonus();
    
    // Проверяем ежечасный бонус
    checkHourlyBonus();
}

// Сохранение данных игры
function saveGameData() {
    // Обновляем XP на основе баланса
    gameData.xp = gameData.balance;
    updateLevel();
    
    // Сохраняем в localStorage
    localStorage.setItem('tugrikClickerPro', JSON.stringify(gameData));
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Клик по монете
    elements.mainCoin.addEventListener('click', handleCoinClick);
    elements.mainCoin.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleCoinClick();
    });
    
    // Открытие улучшений
    elements.openUpgrades.addEventListener('click', () => {
        showModal(elements.upgradesModal);
    });
    
    elements.closeUpgrades.addEventListener('click', () => {
        hideModal(elements.upgradesModal);
    });
    
    // Навигация
    elements.navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.getAttribute('data-screen');
            switchScreen(screen);
            
            // Обновляем активную кнопку
            elements.navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Ежечасный бонус
    elements.hourlyBonusBtn.addEventListener('click', claimHourlyBonus);
    
    // Настройки
    elements.settingsBtn.addEventListener('click', () => {
        switchScreen('settings');
        elements.navButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-btn[data-screen="settings"]').classList.add('active');
    });
    
    elements.soundToggle.addEventListener('change', () => {
        gameData.soundEnabled = elements.soundToggle.checked;
        saveGameData();
    });
    
    elements.vibrationToggle.addEventListener('change', () => {
        gameData.vibrationEnabled = elements.vibrationToggle.checked;
        saveGameData();
    });
    
    elements.themeToggle.addEventListener('change', toggleTheme);
    
    elements.resetProgressBtn.addEventListener('click', resetProgress);
    
    // Промокоды
    elements.activatePromoBtn.addEventListener('click', activatePromocode);
    elements.promoCode.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') activatePromocode();
    });
    
    // Клик вне модального окна для закрытия
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });
    
    // Инициализация мини-игр
    initMiniGames();
    
    // Инициализация мультиплеера
    initMultiplayer();
}

// Обработка клика по монете
function handleCoinClick() {
    // Анимация монеты
    animateCoin();
    
    // Добавление денег с учетом множителей
    const baseEarned = gameData.perClick * gameData.clickMultiplier;
    const totalEarned = baseEarned;
    
    gameData.balance += totalEarned;
    gameData.totalClicks++;
    gameData.totalEarned += totalEarned;
    
    // Создание частиц
    createParticles(10);
    
    // Вибрация (если включена)
    if (gameData.vibrationEnabled && window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
    
    // Звук (если бы был)
    if (gameData.soundEnabled) {
        // playClickSound();
    }
    
    // Обновление интерфейса
    updateUI();
    saveGameData();
}

// Анимация монеты
function animateCoin() {
    const coin = elements.mainCoin;
    
    // Вращение и уменьшение
    coin.style.transform = 'scale(0.95) rotate(15deg)';
    
    // Возврат к исходному состоянию
    setTimeout(() => {
        coin.style.transform = 'scale(1) rotate(0deg)';
    }, 100);
}

// Создание частиц
function createParticles(count) {
    const coinRect = elements.mainCoin.getBoundingClientRect();
    const centerX = coinRect.left + coinRect.width / 2;
    const centerY = coinRect.top + coinRect.height / 2;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Начальная позиция в центре монеты
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        
        // Случайный цвет
        const colors = ['#E0FFC2', '#C8FFA6', '#A6FF8B', '#85FF70'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Случайный размер
        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        elements.particlesContainer.appendChild(particle);
        
        // Анимация движения
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        const duration = Math.random() * 1000 + 500;
        
        particle.animate([
            { transform: `translate(0, 0)`, opacity: 1 },
            { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'ease-out'
        });
        
        // Удаление частицы после анимации
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, duration);
    }
}

// Обновление интерфейса
function updateUI() {
    // Форматирование чисел с разделителями
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    elements.balance.textContent = formatNumber(Math.floor(gameData.balance));
    elements.perClick.textContent = formatNumber(gameData.perClick * gameData.clickMultiplier);
    elements.perSecond.textContent = formatNumber(gameData.perSecond * gameData.autoMultiplier);
    elements.playerLevel.textContent = gameData.level;
    elements.levelNumber.textContent = gameData.level;
    elements.currentLevel.textContent = gameData.level;
    
    updateStats();
    updateLevelProgress();
    updateHourlyBonusButton();
}

// Обновление статистики
function updateStats() {
    elements.totalClicks.textContent = gameData.totalClicks.toLocaleString();
    elements.totalEarned.textContent = Math.floor(gameData.totalEarned).toLocaleString();
    
    // Форматирование времени игры
    const hours = Math.floor(gameData.playTime / 3600);
    const minutes = Math.floor((gameData.playTime % 3600) / 60);
    elements.playTime.textContent = `${hours}ч ${minutes}м`;
    
    elements.gamesWon.textContent = gameData.gamesWon;
}

// Обновление прогресса уровня
function updateLevelProgress() {
    const levelThresholds = [0, 10000, 50000, 200000, 1000000];
    const currentLevel = gameData.level;
    
    if (currentLevel < levelThresholds.length) {
        const currentThreshold = levelThresholds[currentLevel - 1];
        const nextThreshold = levelThresholds[currentLevel];
        const currentXP = gameData.xp;
        
        const progress = Math.min(100, ((currentXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
        
        elements.currentXp.textContent = currentXP.toLocaleString();
        elements.nextLevelXp.textContent = nextThreshold.toLocaleString();
        elements.levelProgressFill.style.width = `${progress}%`;
        
        // Текст бонуса уровня
        const levelBonuses = [
            "Базовый доход",
            "+10% к клику",
            "+20% к клику, разблокирована рулетка",
            "+35% к клику, разблокированы все игры"
        ];
        
        if (currentLevel <= levelBonuses.length) {
            elements.levelBonusText.textContent = levelBonuses[currentLevel - 1];
        }
    }
}

// Обновление уровня
function updateLevel() {
    const levelThresholds = [0, 10000, 50000, 200000, 1000000];
    let newLevel = 1;
    
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (gameData.xp >= levelThresholds[i]) {
            newLevel = i + 1;
            break;
        }
    }
    
    if (newLevel !== gameData.level) {
        gameData.level = newLevel;
        showNotification(`🎉 Новый уровень! Теперь вы уровня ${newLevel}!`);
    }
    
    // Обновление видимости игр в зависимости от уровня
    updateGameVisibility();
}

// Обновление видимости игр
function updateGameVisibility() {
    const rouletteCard = document.getElementById('roulette-card');
    const game2048Card = document.getElementById('game-2048-card');
    
    if (gameData.level >= 3) {
        rouletteCard.style.opacity = '1';
        rouletteCard.style.pointerEvents = 'auto';
    } else {
        rouletteCard.style.opacity = '0.5';
        rouletteCard.style.pointerEvents = 'none';
    }
    
    if (gameData.level >= 4) {
        game2048Card.style.opacity = '1';
        game2048Card.style.pointerEvents = 'auto';
    } else {
        game2048Card.style.opacity = '0.5';
        game2048Card.style.pointerEvents = 'none';
    }
}

// Инициализация списка улучшений
function initUpgradesList() {
    elements.upgradesList.innerHTML = '';
    
    Object.values(gameData.upgrades).forEach(upgrade => {
        const upgradeItem = document.createElement('div');
        upgradeItem.className = `upgrade-item ${upgrade.purchased ? 'purchased' : ''}`;
        
        upgradeItem.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-price">${upgrade.price.toLocaleString()} ₮</div>
            </div>
            <div class="upgrade-desc">${upgrade.effect}</div>
            <button class="btn-primary upgrade-buy-btn" 
                    data-id="${upgrade.id}" 
                    ${upgrade.purchased || gameData.balance < upgrade.price ? 'disabled' : ''}>
                ${upgrade.purchased ? 'Куплено' : 'Купить'}
            </button>
        `;
        
        elements.upgradesList.appendChild(upgradeItem);
    });
    
    // Обработчики покупки улучшений
    document.querySelectorAll('.upgrade-buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            buyUpgrade(id);
        });
    });
}

// Покупка улучшения
function buyUpgrade(id) {
    const upgrade = gameData.upgrades[id];
    
    if (upgrade.purchased || gameData.balance < upgrade.price) return;
    
    // Списываем деньги
    gameData.balance -= upgrade.price;
    
    // Применяем эффект
    upgrade.purchased = true;
    
    switch(upgrade.type) {
        case 'click':
            gameData.perClick += 2;
            break;
        case 'auto':
            gameData.perSecond += 10;
            break;
        case 'percentage':
            // +1% к авто-доходу
            gameData.perSecond += gameData.perSecond * 0.01;
            break;
        case 'multiplier':
            gameData.clickMultiplier *= 3;
            gameData.autoMultiplier *= 3;
            break;
        case 'autoMultiplier':
            gameData.autoMultiplier *= 10;
            break;
    }
    
    showNotification(`✅ Куплено улучшение: ${upgrade.name}`);
    
    // Обновляем интерфейс
    updateUI();
    initUpgradesList();
    saveGameData();
}

// Авто-доход
function startAutoIncome() {
    setInterval(() => {
        if (gameData.perSecond > 0) {
            const autoEarned = gameData.perSecond * gameData.autoMultiplier;
            gameData.balance += autoEarned;
            gameData.totalEarned += autoEarned;
            
            updateUI();
            saveGameData();
        }
    }, 1000);
}

// Ежечасный бонус
function checkHourlyBonus() {
    if (!gameData.lastHourlyBonus) {
        // Первый запуск
        gameData.lastHourlyBonus = new Date();
        elements.hourlyBonusBtn.disabled = false;
        return;
    }
    
    const now = new Date();
    const lastBonus = new Date(gameData.lastHourlyBonus);
    const diffHours = (now - lastBonus) / (1000 * 60 * 60);
    
    if (diffHours >= 1) {
        elements.hourlyBonusBtn.disabled = false;
    } else {
        updateHourlyBonusButton();
    }
}

function updateHourlyBonusButton() {
    if (!gameData.lastHourlyBonus) return;
    
    const now = new Date();
    const lastBonus = new Date(gameData.lastHourlyBonus);
    const nextBonus = new Date(lastBonus.getTime() + 60 * 60 * 1000);
    
    if (now >= nextBonus) {
        elements.hourlyBonusBtn.disabled = false;
        elements.hourlyTimer.textContent = "Доступно!";
        return;
    }
    
    const diffMs = nextBonus - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    elements.hourlyTimer.textContent = `${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
    elements.hourlyBonusBtn.disabled = true;
}

function claimHourlyBonus() {
    gameData.balance += 100;
    gameData.totalEarned += 100;
    gameData.lastHourlyBonus = new Date();
    
    showNotification("🎁 +100 ₮ (ежечасный бонус)");
    
    updateUI();
    updateHourlyBonusButton();
    saveGameData();
}

// Ежедневные бонусы
function initDailyBonuses() {
    checkDailyBonus();
    renderBonusCalendar();
}

function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (!gameData.lastLogin) {
        // Первый вход
        gameData.lastLogin = new Date();
        gameData.dailyBonuses = {};
        gameData.loginStreak = 1;
        claimDailyBonus(1);
        return;
    }
    
    const lastLogin = new Date(gameData.lastLogin).toDateString();
    
    if (today === lastLogin) {
        // Уже заходили сегодня
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastLogin === yesterdayStr) {
        // Последовательные входы
        gameData.loginStreak++;
    } else {
        // Сброс серии
        gameData.loginStreak = 1;
    }
    
    gameData.lastLogin = new Date();
    
    // Получаем бонус за текущий день
    const dayOfMonth = new Date().getDate();
    const bonusDay = ((dayOfMonth - 1) % 7) + 1; // 7-дневный цикл
    
    claimDailyBonus(bonusDay);
}

function claimDailyBonus(day) {
    const bonuses = [100, 200, 300, 500, 800, 1200, 2000];
    const bonus = bonuses[(day - 1) % bonuses.length];
    
    gameData.balance += bonus;
    gameData.totalEarned += bonus;
    
    // Отмечаем день как полученный
    gameData.dailyBonuses[new Date().toDateString()] = {
        day: day,
        amount: bonus,
        claimed: true
    };
    
    showNotification(`📅 Ежедневный бонус: +${bonus} ₮! Серия: ${gameData.loginStreak} дней`);
    
    updateUI();
    renderBonusCalendar();
    saveGameData();
}

function renderBonusCalendar() {
    elements.bonusCalendar.innerHTML = '';
    elements.loginStreak.textContent = gameData.loginStreak;
    
    const bonuses = [100, 200, 300, 500, 800, 1200, 2000];
    const today = new Date().toDateString();
    
    for (let i = 1; i <= 7; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'bonus-day';
        
        const dayCircle = document.createElement('div');
        
        // Проверяем, получен ли бонус за этот день
        const isClaimed = Object.keys(gameData.dailyBonuses).some(date => {
            const bonusDate = new Date(date);
            const bonusDay = gameData.dailyBonuses[date].day;
            return bonusDay === i && new Date(date).toDateString() !== today;
        });
        
        const isToday = i === (((new Date().getDate() - 1) % 7) + 1);
        
        if (isToday) {
            dayCircle.className = 'day-circle today';
        } else if (isClaimed) {
            dayCircle.className = 'day-circle claimed';
        } else {
            dayCircle.className = 'day-circle future';
        }
        
        dayCircle.textContent = i;
        
        const dayReward = document.createElement('div');
        dayReward.className = 'day-reward';
        dayReward.textContent = `${bonuses[i-1]} ₮`;
        
        dayDiv.appendChild(dayCircle);
        dayDiv.appendChild(dayReward);
        elements.bonusCalendar.appendChild(dayDiv);
    }
    
    // Таймер до следующего бонуса
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diffMs = tomorrow - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    elements.nextBonusTime.textContent = `${diffHours}ч ${diffMinutes}м`;
}

// Промокоды
function activatePromocode() {
    const code = elements.promoCode.value.trim().toUpperCase();
    
    if (!code) {
        showNotification("❌ Введите промокод", true);
        return;
    }
    
    if (gameData.usedPromocodes.includes(code)) {
        showNotification("❌ Этот промокод уже использован", true);
        return;
    }
    
    let reward = 0;
    let message = "";
    
    switch(code) {
        case 'START777':
            reward = 5000;
            message = `✅ Промокод активирован! +${reward} ₮`;
            break;
        case 'BONUS2024':
            // Устанавливаем уровень 2
            if (gameData.level < 2) {
                gameData.xp = 10000;
                updateLevel();
                message = "✅ Промокод активирован! Вы перешли на уровень 2!";
            } else {
                reward = 10000;
                message = `✅ Промокод активирован! +${reward} ₮`;
            }
            break;
        case 'SWQSPB777':
            reward = 30000;
            message = `✅ Промокод активирован! +${reward} ₮ и x2 к доходу на 1 час!`;
            
            // Добавляем временный множитель
            const originalClickMultiplier = gameData.clickMultiplier;
            const originalAutoMultiplier = gameData.autoMultiplier;
            
            gameData.clickMultiplier *= 2;
            gameData.autoMultiplier *= 2;
            
            setTimeout(() => {
                gameData.clickMultiplier = originalClickMultiplier;
                gameData.autoMultiplier = originalAutoMultiplier;
                updateUI();
            }, 60 * 60 * 1000); // 1 час
            break;
        default:
            showNotification("❌ Неверный промокод", true);
            return;
    }
    
    if (reward > 0) {
        gameData.balance += reward;
        gameData.totalEarned += reward;
    }
    
    gameData.usedPromocodes.push(code);
    
    showNotification(message);
    
    // Обновляем интерфейс
    elements.promoCode.value = '';
    updateUI();
    updateUsedPromocodes();
    saveGameData();
}

function updateUsedPromocodes() {
    elements.promocodesList.innerHTML = '';
    
    gameData.usedPromocodes.forEach(code => {
        const item = document.createElement('div');
        item.className = 'promocode-item';
        item.textContent = code;
        elements.promocodesList.appendChild(item);
    });
}

// Таблица лидеров
function initLeaderboard() {
    if (!gameData.leaderboard || gameData.leaderboard.length === 0) {
        // Начальные данные
        gameData.leaderboard = [
            { name: "Топ игрок", balance: 1000000 },
            { name: "Профи", balance: 500000 },
            { name: "Новичок", balance: 100000 },
            { name: "Вы", balance: gameData.balance }
        ];
    }
    
    // Добавляем текущего игрока, если его нет
    const playerName = elements.playerName.textContent;
    const playerIndex = gameData.leaderboard.findIndex(p => p.name === playerName);
    
    if (playerIndex === -1) {
        gameData.leaderboard.push({ name: playerName, balance: gameData.balance });
    } else {
        gameData.leaderboard[playerIndex].balance = gameData.balance;
    }
    
    // Сортировка по балансу
    gameData.leaderboard.sort((a, b) => b.balance - a.balance);
    
    // Обновляем таблицу лидеров
    updateLeaderboard();
}

function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    // Отображаем топ-10
    const topPlayers = gameData.leaderboard.slice(0, 10);
    
    topPlayers.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        item.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-name">${player.name}</div>
            <div class="leaderboard-balance">${Math.floor(player.balance).toLocaleString()} ₮</div>
        `;
        
        leaderboardList.appendChild(item);
    });
    
    saveGameData();
}

// Мини-игры
function initMiniGames() {
    // Рулетка
    const freeSpinBtn = document.getElementById('free-spin-btn');
    const paidSpinBtn = document.getElementById('paid-spin-btn');
    const rouletteModal = document.getElementById('roulette-modal');
    const closeRoulette = document.getElementById('close-roulette');
    const spinRouletteBtn = document.getElementById('spin-roulette-btn');
    
    // 2048
    const play2048Btn = document.getElementById('play-2048-btn');
    const game2048Modal = document.getElementById('game-2048-modal');
    const close2048 = document.getElementById('close-2048');
    
    if (play2048Btn) {
        play2048Btn.addEventListener('click', () => {
            if (gameData.level >= 4) {
                showModal(game2048Modal);
                init2048Game();
            } else {
                showNotification("❌ Игра разблокируется на 4 уровне", true);
            }
        });
    }
    
    if (close2048) {
        close2048.addEventListener('click', () => hideModal(game2048Modal));
    }
    
    if (freeSpinBtn) {
        freeSpinBtn.addEventListener('click', () => {
            showModal(rouletteModal);
            checkRouletteAvailability();
        });
    }
    
    if (paidSpinBtn) {
        paidSpinBtn.addEventListener('click', () => {
            if (gameData.balance >= 500) {
                gameData.balance -= 500;
                showModal(rouletteModal);
                spinRoulette(false);
            } else {
                showNotification("❌ Недостаточно тугриков", true);
            }
        });
    }
    
    if (closeRoulette) {
        closeRoulette.addEventListener('click', () => hideModal(rouletteModal));
    }
    
    if (spinRouletteBtn) {
        spinRouletteBtn.addEventListener('click', () => {
            if (spinRouletteBtn.disabled) return;
            
            const now = new Date();
            const lastSpin = gameData.lastRouletteSpin ? new Date(gameData.lastRouletteSpin) : null;
            
            if (!lastSpin || (now - lastSpin) >= 2 * 60 * 60 * 1000) {
                // Бесплатный спин
                spinRoulette(true);
            } else if (gameData.balance >= 500) {
                // Платный спин
                gameData.balance -= 500;
                updateUI();
                spinRoulette(false);
            } else {
                showNotification("❌ Недостаточно тугриков", true);
            }
        });
    }
}

function checkRouletteAvailability() {
    const spinBtn = document.getElementById('spin-roulette-btn');
    const timer = document.getElementById('roulette-timer');
    
    const now = new Date();
    const lastSpin = gameData.lastRouletteSpin ? new Date(gameData.lastRouletteSpin) : null;
    
    if (!lastSpin || (now - lastSpin) >= 2 * 60 * 60 * 1000) {
        spinBtn.disabled = false;
        spinBtn.textContent = "Крутить рулетку (бесплатно)";
        timer.textContent = "Бесплатный спин доступен!";
        return;
    }
    
    spinBtn.disabled = true;
    
    const nextSpin = new Date(lastSpin.getTime() + 2 * 60 * 60 * 1000);
    const diffMs = nextSpin - now;
    
    const updateTimer = () => {
        const now = new Date();
        const diffMs = nextSpin - now;
        
        if (diffMs <= 0) {
            spinBtn.disabled = false;
            spinBtn.textContent = "Крутить рулетку (бесплатно)";
            timer.textContent = "Бесплатный спин доступен!";
            return;
        }
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        timer.innerHTML = `Следующий бесплатный спин: <span>${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>`;
        
        setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
}

function spinRoulette(isFree) {
    const spinBtn = document.getElementById('spin-roulette-btn');
    const resultDiv = document.getElementById('roulette-result');
    
    spinBtn.disabled = true;
    resultDiv.innerHTML = '<div class="result-placeholder">Крутим...</div>';
    
    // Анимация вращения барабанов
    const reels = ['reel1', 'reel2', 'reel3'];
    const spinDuration = 2000;
    const startTime = Date.now();
    
    reels.forEach((reelId, index) => {
        const reel = document.getElementById(reelId);
        const items = reel.querySelectorAll('.reel-item');
        
        // Сбрасываем трансформацию
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0)';
        
        // Даем небольшую задержку между барабанами
        setTimeout(() => {
            const spinDistance = -80 * 10; // 10 полных оборотов
            reel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
            reel.style.transform = `translateY(${spinDistance}px)`;
        }, index * 200);
    });
    
    // Определяем результат после анимации
    setTimeout(() => {
        // Случайный результат
        const rand = Math.random();
        let reward = 0;
        let message = "";
        
        if (rand < 0.7) {
            // Мелкий выигрыш (70%)
            reward = Math.floor(Math.random() * 900) + 100;
            message = `🎉 Вы выиграли ${reward} ₮!`;
        } else if (rand < 0.9) {
            // Средний выигрыш (20%)
            reward = Math.floor(Math.random() * 3000) + 2000;
            message = `🎊 Вы выиграли ${reward} ₮!`;
        } else {
            // Джекпот (10%)
            reward = 10000;
            message = `🏆 ДЖЕКПОТ! Вы выиграли ${reward} ₮ и уникальное улучшение!`;
            
            // Даем случайное улучшение, если есть некупленные
            const availableUpgrades = Object.values(gameData.upgrades).filter(u => !u.purchased);
            if (availableUpgrades.length > 0) {
                const randomUpgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
                randomUpgrade.purchased = true;
                message += ` Получено улучшение: ${randomUpgrade.name}`;
            }
        }
        
        // Обновляем баланс
        gameData.balance += reward;
        gameData.totalEarned += reward;
        
        // Обновляем время последнего спина
        gameData.lastRouletteSpin = new Date();
        
        // Показываем результат
        resultDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #E0FFC2; margin-bottom: 10px;">${message}</div>
                <div style="font-size: 18px; color: #C8FFA6;">${isFree ? 'Бесплатный спин' : 'Спин за 500 ₮'}</div>
            </div>
        `;
        
        // Обновляем интерфейс
        updateUI();
        initUpgradesList();
        updateLeaderboard();
        saveGameData();
        
        // Разблокируем кнопку
        spinBtn.disabled = false;
        checkRouletteAvailability();
        
    }, spinDuration + 600); // Добавляем задержку для анимации
}

// Мультиплеер
function initMultiplayer() {
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const shareRoomBtn = document.getElementById('share-room-btn');
    const startRaceBtn = document.getElementById('start-race-btn');
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }
    
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', joinRoom);
    }
    
    if (shareRoomBtn) {
        shareRoomBtn.addEventListener('click', shareRoom);
    }
    
    if (startRaceBtn) {
        startRaceBtn.addEventListener('click', startClickRace);
    }
    
    // Быстрые фразы в чате
    document.querySelectorAll('.phrase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const phrase = e.target.getAttribute('data-phrase');
            sendChatMessage(phrase);
        });
    });
}

function createRoom() {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Сохраняем комнату в localStorage
    const roomData = {
        code: roomCode,
        creator: elements.playerName.textContent,
        players: [elements.playerName.textContent],
        created: new Date().toISOString(),
        gameState: 'waiting'
    };
    
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(roomData));
    
    // Показываем комнату
    showRoom(roomCode);
    showNotification(`Комната создана! Код: ${roomCode}`);
}

function joinRoom() {
    const roomCode = document.getElementById('room-code').value.trim();
    
    if (!roomCode || roomCode.length !== 6 || isNaN(roomCode)) {
        showNotification("❌ Введите 6-значный код комнаты", true);
        return;
    }
    
    const roomData = localStorage.getItem(`room_${roomCode}`);
    
    if (!roomData) {
        showNotification("❌ Комната не найдена", true);
        return;
    }
    
    const room = JSON.parse(roomData);
    
    if (room.players.length >= 2) {
        showNotification("❌ В комнате уже 2 игрока", true);
        return;
    }
    
    // Добавляем игрока в комнату
    room.players.push(elements.playerName.textContent);
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(room));
    
    // Показываем комнату
    showRoom(roomCode);
    showNotification(`Вы присоединились к комнате ${roomCode}`);
}

function showRoom(roomCode) {
    const activeRoom = document.getElementById('active-room');
    const roomCodeSpan = document.getElementById('current-room-code');
    const player2 = document.getElementById('player2');
    
    roomCodeSpan.textContent = roomCode;
    
    // Загружаем данные комнаты
    const roomData = localStorage.getItem(`room_${roomCode}`);
    if (roomData) {
        const room = JSON.parse(roomData);
        
        if (room.players.length > 1) {
            player2.querySelector('.player-name').textContent = room.players[1];
            player2.querySelector('.player-status').textContent = 'Готов';
            player2.querySelector('.player-status').className = 'player-status ready';
            player2.querySelector('.player-avatar').textContent = '👤';
        }
    }
    
    activeRoom.style.display = 'block';
    
    // Автообновление комнаты
    if (window.roomUpdateInterval) {
        clearInterval(window.roomUpdateInterval);
    }
    
    window.roomUpdateInterval = setInterval(() => {
        updateRoom(roomCode);
    }, 2000);
}

function updateRoom(roomCode) {
    const roomData = localStorage.getItem(`room_${roomCode}`);
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    const player2 = document.getElementById('player2');
    
    if (room.players.length > 1) {
        player2.querySelector('.player-name').textContent = room.players[1];
        player2.querySelector('.player-status').textContent = 'Готов';
        player2.querySelector('.player-status').className = 'player-status ready';
        player2.querySelector('.player-avatar').textContent = '👤';
    }
    
    // Проверяем, началась ли игра
    if (room.gameState === 'playing') {
        document.getElementById('click-race-game').style.display = 'block';
        updateClickRace(room);
    }
}

function shareRoom() {
    const roomCode = document.getElementById('current-room-code').textContent;
    const message = `Присоединяйся к моей комнате в Тугрик Кликер Pro! Код: ${roomCode}`;
    
    if (tg && tg.share) {
        tg.share(message);
    } else {
        // Fallback для браузера
        if (navigator.share) {
            navigator.share({
                title: 'Тугрик Кликер Pro',
                text: message,
                url: window.location.href
            });
        } else {
            // Копирование в буфер обмена
            navigator.clipboard.writeText(message);
            showNotification('Ссылка скопирована в буфер обмена!');
        }
    }
}

function startClickRace() {
    const roomCode = document.getElementById('current-room-code').textContent;
    const roomData = localStorage.getItem(`room_${roomCode}`);
    
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    
    if (room.players.length < 2) {
        showNotification("❌ Ожидаем второго игрока", true);
        return;
    }
    
    // Начинаем игру
    room.gameState = 'playing';
    room.race = {
        player1: { name: room.players[0], clicks: 0 },
        player2: { name: room.players[1], clicks: 0 },
        started: new Date().toISOString()
    };
    
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(room));
    
    // Показываем игру
    document.getElementById('click-race-game').style.display = 'block';
    showNotification("Гонка началась! Кликайте как можно быстрее!");
}

function updateClickRace(room) {
    if (!room.race) return;
    
    const race = room.race;
    const player1Clicks = document.getElementById('player1-clicks');
    const player2Clicks = document.getElementById('player2-clicks');
    const player1Progress = document.getElementById('player1-progress');
    const player2Progress = document.getElementById('player2-progress');
    
    // Обновляем клики
    player1Clicks.textContent = `${race.player1.clicks}/100`;
    player2Clicks.textContent = `${race.player2.clicks}/100`;
    
    // Обновляем прогресс
    player1Progress.style.width = `${Math.min(100, race.player1.clicks)}%`;
    player2Progress.style.width = `${Math.min(100, race.player2.clicks)}%`;
    
    // Проверяем победителя
    if (race.player1.clicks >= 100 || race.player2.clicks >= 100) {
        endClickRace(room, race);
    }
}

function endClickRace(room, race) {
    const roomCode = document.getElementById('current-room-code').textContent;
    const winner = race.player1.clicks >= 100 ? race.player1 : race.player2;
    const loser = race.player1.clicks >= 100 ? race.player2 : race.player1;
    
    // Награды
    if (winner.name === elements.playerName.textContent) {
        gameData.balance += 5000;
        gameData.gamesWon++;
        showNotification(`🏆 Вы победили! +5000 ₮`);
    } else {
        gameData.balance += 1000;
        showNotification(`🥈 Вы проиграли. +1000 ₮`);
    }
    
    // Сбрасываем комнату
    room.gameState = 'finished';
    delete room.race;
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(room));
    
    // Обновляем интерфейс
    updateUI();
    updateLeaderboard();
    saveGameData();
    
    // Скрываем игру через 5 секунд
    setTimeout(() => {
        document.getElementById('click-race-game').style.display = 'none';
    }, 5000);
}

function sendChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.textContent = `${elements.playerName.textContent}: ${message}`;
    messageDiv.style.padding = '5px 10px';
    messageDiv.style.backgroundColor = 'rgba(224, 255, 194, 0.1)';
    messageDiv.style.borderRadius = '10px';
    messageDiv.style.marginBottom = '5px';
    messageDiv.style.fontSize = '14px';
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Управление модальными окнами
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

// Переключение экранов
function switchScreen(screenId) {
    elements.screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.scrollTop = 0;
    }
}

// Показать уведомление
function showNotification(message, isError = false) {
    const notification = elements.notification;
    
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#ff4444' : '#E0FFC2';
    notification.style.color = isError ? '#FFFFFF' : '#064734';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Смена темы
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    gameData.darkTheme = document.body.classList.contains('dark-theme');
    saveGameData();
}

// Сброс прогресса
function resetProgress() {
    if (confirm("Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить!")) {
        localStorage.removeItem('tugrikClickerPro');
        
        // Сброс переменных игры
        gameData = {
            balance: 0,
            perClick: 1,
            perSecond: 0,
            totalClicks: 0,
            totalEarned: 0,
            playTime: 0,
            level: 1,
            xp: 0,
            upgrades: {
                1: { id: 1, name: "Умный клик", price: 500, effect: "+2 за клик", purchased: false, type: "click" },
                2: { id: 2, name: "Автоматическая печать", price: 2000, effect: "+10 ₮/сек", purchased: false, type: "auto" },
                3: { id: 3, name: "Инвестиционный фонд", price: 10000, effect: "+1% к общему доходу в секунду", purchased: false, type: "percentage" },
                4: { id: 4, name: "Криптоферма", price: 50000, effect: "x3 ко всем доходам", purchased: false, type: "multiplier" },
                5: { id: 5, name: "Центробанк", price: 200000, effect: "x10 к авто-доходу", purchased: false, type: "autoMultiplier" }
            },
            autoMultiplier: 1,
            clickMultiplier: 1,
            usedPromocodes: [],
            dailyBonuses: {},
            loginStreak: 0,
            lastLogin: null,
            lastHourlyBonus: null,
            lastRouletteSpin: null,
            gamesWon: 0,
            leaderboard: []
        };
        
        // Обновление интерфейса
        updateUI();
        initUpgradesList();
        initDailyBonuses();
        updateUsedPromocodes();
        updateLeaderboard();
        
        showNotification("Прогресс сброшен");
    }
}

// Запуск таймеров
function startTimers() {
    // Таймер ежечасного бонуса
    setInterval(() => {
        updateHourlyBonusButton();
    }, 1000);
    
    // Таймер ежедневного бонуса
    setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diffMs = tomorrow - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        elements.nextBonusTime.textContent = `${diffHours}ч ${diffMinutes}м`;
    }, 60000); // Обновляем каждую минуту
}

// Загрузка игры 2048
function init2048Game() {
    // Эта функция будет в game2048.js
    console.log("Инициализация игры 2048");
    // Здесь будет код игры 2048
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initGame);
