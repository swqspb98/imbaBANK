// Мультиплеерная логика (дополнение к основному скрипту)

// Расширяем функциональность мультиплеера из основного скрипта

// Глобальные переменные для мультиплеера
let currentRoom = null;
let roomUpdateInterval = null;

// Улучшенная функция создания комнаты
function createRoom() {
    const roomCode = generateRoomCode();
    const playerName = document.getElementById('player-name').textContent;
    
    // Создаем комнату
    const roomData = {
        code: roomCode,
        creator: playerName,
        players: [playerName],
        created: new Date().toISOString(),
        gameState: 'waiting',
        chat: [],
        lastUpdate: new Date().toISOString()
    };
    
    // Сохраняем комнату
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(roomData));
    localStorage.setItem('current_room', roomCode);
    
    // Показываем комнату
    showRoom(roomCode);
    currentRoom = roomCode;
    
    // Начинаем слушать обновления комнаты
    startRoomListener(roomCode);
    
    showNotification(`Комната создана! Код: ${roomCode}`);
    
    // Предлагаем поделиться
    setTimeout(() => {
        if (confirm("Хотите поделиться кодом комнаты с другом?")) {
            shareRoom();
        }
    }, 1000);
}

// Генерация кода комнаты
function generateRoomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    
    // 2 буквы + 4 цифры
    for (let i = 0; i < 2; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 4; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
}

// Улучшенная функция показа комнаты
function showRoom(roomCode) {
    const activeRoom = document.getElementById('active-room');
    const roomCodeSpan = document.getElementById('current-room-code');
    
    roomCodeSpan.textContent = roomCode;
    activeRoom.style.display = 'block';
    
    // Загружаем начальные данные комнаты
    loadRoomData(roomCode);
    
    // Автообновление комнаты
    if (roomUpdateInterval) {
        clearInterval(roomUpdateInterval);
    }
    
    roomUpdateInterval = setInterval(() => {
        updateRoomData(roomCode);
    }, 2000);
}

// Загрузка данных комнаты
function loadRoomData(roomCode) {
    const roomData = localStorage.getItem(`room_${roomCode}`);
    if (!roomData) {
        showNotification("Комната не найдена", true);
        return;
    }
    
    const room = JSON.parse(roomData);
    updateRoomUI(room);
}

// Обновление данных комнаты
function updateRoomData(roomCode) {
    const roomData = localStorage.getItem(`room_${roomCode}`);
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    const playerName = document.getElementById('player-name').textContent;
    
    // Проверяем, не удалили ли нас из комнаты
    if (!room.players.includes(playerName)) {
        showNotification("Вас удалили из комнаты", true);
        leaveRoom();
        return;
    }
    
    // Обновляем время последнего обновления
    room.lastUpdate = new Date().toISOString();
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(room));
    
    updateRoomUI(room);
}

// Обновление интерфейса комнаты
function updateRoomUI(room) {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    const playerName = document.getElementById('player-name').textContent;
    
    // Определяем, кто первый игрок, а кто второй
    const isCreator = room.players[0] === playerName;
    
    // Обновляем первого игрока
    player1.querySelector('.player-name').textContent = room.players[0];
    player1.querySelector('.player-avatar').textContent = room.players[0] === playerName ? '👑' : '👤';
    player1.querySelector('.player-status').textContent = 'Готов';
    
    // Обновляем второго игрока
    if (room.players.length > 1) {
        player2.querySelector('.player-name').textContent = room.players[1];
        player2.querySelector('.player-avatar').textContent = room.players[1] === playerName ? '👑' : '👤';
        player2.querySelector('.player-status').textContent = 'Готов';
        player2.style.opacity = '1';
    } else {
        player2.querySelector('.player-name').textContent = 'Ожидание...';
        player2.querySelector('.player-avatar').textContent = '?';
        player2.querySelector('.player-status').textContent = 'Не подключен';
        player2.style.opacity = '0.7';
    }
    
    // Обновляем чат
    updateChat(room);
    
    // Обновляем состояние игры
    if (room.gameState === 'playing') {
        document.getElementById('click-race-game').style.display = 'block';
        if (room.race) {
            updateRaceProgress(room.race);
        }
    } else {
        document.getElementById('click-race-game').style.display = 'none';
    }
}

// Обновление чата
function updateChat(room) {
    const chatMessages = document.getElementById('chat-messages');
    
    if (!room.chat || room.chat.length === 0) {
        chatMessages.innerHTML = '<div style="color: #C8FFA6; text-align: center; padding: 10px;">Нет сообщений</div>';
        return;
    }
    
    chatMessages.innerHTML = '';
    
    room.chat.slice(-10).forEach(message => { // Показываем последние 10 сообщений
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `
            <div class="chat-sender">${message.sender}:</div>
            <div class="chat-text">${message.text}</div>
            <div class="chat-time">${formatTime(message.time)}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Форматирование времени для чата
function formatTime(timeString) {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    return time.toLocaleDateString();
}

// Отправка сообщения в чат
function sendChatMessage(text) {
    if (!currentRoom) return;
    
    const roomData = localStorage.getItem(`room_${currentRoom}`);
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    const playerName = document.getElementById('player-name').textContent;
    
    if (!room.chat) room.chat = [];
    
    room.chat.push({
        sender: playerName,
        text: text,
        time: new Date().toISOString()
    });
    
    localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
    
    // Обновляем чат
    updateChat(room);
}

// Обновление прогресса гонки кликов
function updateRaceProgress(race) {
    const player1Clicks = document.getElementById('player1-clicks');
    const player2Clicks = document.getElementById('player2-clicks');
    const player1Progress = document.getElementById('player1-progress');
    const player2Progress = document.getElementById('player2-progress');
    const playerName = document.getElementById('player-name').textContent;
    
    // Определяем, какой игрок под каким номером
    const player1Name = race.player1.name;
    const player2Name = race.player2.name;
    
    // Обновляем клики
    player1Clicks.textContent = `${race.player1.clicks}/100`;
    player2Clicks.textContent = `${race.player2.clicks}/100`;
    
    // Обновляем прогресс
    player1Progress.style.width = `${Math.min(100, race.player1.clicks)}%`;
    player2Progress.style.width = `${Math.min(100, race.player2.clicks)}%`;
    
    // Проверяем победителя
    if (race.player1.clicks >= 100 || race.player2.clicks >= 100) {
        endRace(race);
    }
}

// Завершение гонки
function endRace(race) {
    const winner = race.player1.clicks >= 100 ? race.player1 : race.player2;
    const loser = race.player1.clicks >= 100 ? race.player2 : race.player1;
    const playerName = document.getElementById('player-name').textContent;
    
    // Награды
    if (winner.name === playerName) {
        gameData.balance += 5000;
        gameData.gamesWon++;
        showNotification(`🏆 Вы победили! +5000 ₮`);
    } else {
        gameData.balance += 1000;
        showNotification(`🥈 Вы проиграли. +1000 ₮`);
    }
    
    // Обновляем интерфейс основной игры
    updateUI();
    updateLeaderboard();
    saveGameData();
    
    // Сбрасываем комнату
    if (currentRoom) {
        const roomData = localStorage.getItem(`room_${currentRoom}`);
        if (roomData) {
            const room = JSON.parse(roomData);
            room.gameState = 'finished';
            delete room.race;
            localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
        }
    }
    
    // Скрываем игру через 3 секунды
    setTimeout(() => {
        document.getElementById('click-race-game').style.display = 'none';
    }, 3000);
}

// Начало гонки кликов
function startClickRace() {
    if (!currentRoom) {
        showNotification("Сначала создайте или присоединитесь к комнате", true);
        return;
    }
    
    const roomData = localStorage.getItem(`room_${currentRoom}`);
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    const playerName = document.getElementById('player-name').textContent;
    
    if (room.players.length < 2) {
        showNotification("❌ Ожидаем второго игрока", true);
        return;
    }
    
    // Создаем гонку
    room.gameState = 'playing';
    room.race = {
        player1: { name: room.players[0], clicks: 0 },
        player2: { name: room.players[1], clicks: 0 },
        started: new Date().toISOString()
    };
    
    localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
    
    // Показываем игру
    document.getElementById('click-race-game').style.display = 'block';
    
    // Добавляем обработчик кликов для гонки
    document.addEventListener('click', handleRaceClick);
    
    showNotification("Гонка началась! Кликайте по экрану как можно быстрее!");
}

// Обработчик кликов во время гонки
function handleRaceClick(e) {
    if (!currentRoom) return;
    
    const roomData = localStorage.getItem(`room_${currentRoom}`);
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    const playerName = document.getElementById('player-name').textContent;
    
    if (!room.race || room.gameState !== 'playing') return;
    
    // Определяем, какой игрок кликнул
    if (room.race.player1.name === playerName) {
        room.race.player1.clicks++;
    } else if (room.race.player2.name === playerName) {
        room.race.player2.clicks++;
    }
    
    localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
    
    // Обновляем прогресс
    updateRaceProgress(room.race);
    
    // Анимация клика
    createRaceClickParticle(e.clientX, e.clientY);
}

// Создание частиц при клике во время гонки
function createRaceClickParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = '#E0FFC2';
    
    document.getElementById('particles-container').appendChild(particle);
    
    // Анимация
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 50 + 30;
    
    particle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }
    ], {
        duration: 500,
        easing: 'ease-out'
    });
    
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 500);
}

// Выход из комнаты
function leaveRoom() {
    if (!currentRoom) return;
    
    const roomData = localStorage.getItem(`room_${currentRoom}`);
    if (roomData) {
        const room = JSON.parse(roomData);
        const playerName = document.getElementById('player-name').textContent;
        
        // Удаляем игрока из комнаты
        room.players = room.players.filter(p => p !== playerName);
        
        if (room.players.length === 0) {
            // Если комната пустая, удаляем её
            localStorage.removeItem(`room_${currentRoom}`);
        } else {
            localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
        }
    }
    
    // Скрываем комнату
    document.getElementById('active-room').style.display = 'none';
    
    // Останавливаем слушатель
    if (roomUpdateInterval) {
        clearInterval(roomUpdateInterval);
        roomUpdateInterval = null;
    }
    
    // Удаляем обработчик кликов гонки
    document.removeEventListener('click', handleRaceClick);
    
    currentRoom = null;
    localStorage.removeItem('current_room');
    
    showNotification("Вы вышли из комнаты");
}

// Начало прослушивания комнаты
function startRoomListener(roomCode) {
    // Проверяем обновления комнаты каждые 2 секунды
    if (roomUpdateInterval) {
        clearInterval(roomUpdateInterval);
    }
    
    roomUpdateInterval = setInterval(() => {
        const roomData = localStorage.getItem(`room_${roomCode}`);
        if (!roomData) {
            // Комната удалена
            showNotification("Комната была удалена", true);
            leaveRoom();
            return;
        }
        
        const room = JSON.parse(roomData);
        
        // Проверяем, не слишком ли старые обновления (таймаут 30 секунд)
        const lastUpdate = new Date(room.lastUpdate);
        const now = new Date();
        const diffSeconds = (now - lastUpdate) / 1000;
        
        if (diffSeconds > 30) {
            showNotification("Соединение с комнатой потеряно", true);
            leaveRoom();
            return;
        }
        
        updateRoomUI(room);
    }, 2000);
}

// Автоматическое присоединение к комнате при загрузке
function checkSavedRoom() {
    const savedRoom = localStorage.getItem('current_room');
    if (savedRoom) {
        const roomData = localStorage.getItem(`room_${savedRoom}`);
        if (roomData) {
            const room = JSON.parse(roomData);
            const playerName = document.getElementById('player-name').textContent;
            
            if (room.players.includes(playerName)) {
                // Восстанавливаем комнату
                currentRoom = savedRoom;
                showRoom(savedRoom);
                startRoomListener(savedRoom);
            } else {
                localStorage.removeItem('current_room');
            }
        }
    }
}

// Инициализация мультиплеера при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем сохраненную комнату
    setTimeout(checkSavedRoom, 1000);
    
    // Добавляем кнопку выхода из комнаты
    const activeRoom = document.getElementById('active-room');
    if (activeRoom) {
        const leaveBtn = document.createElement('button');
        leaveBtn.className = 'btn-secondary';
        leaveBtn.style.marginTop = '15px';
        leaveBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти из комнаты';
        leaveBtn.addEventListener('click', leaveRoom);
        
        const roomHeader = activeRoom.querySelector('.room-header');
        roomHeader.appendChild(leaveBtn);
    }
});
