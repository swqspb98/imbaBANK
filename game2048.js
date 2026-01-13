// Игра 2048 Тугрик Edition

let game2048 = {
    board: [],
    score: 0,
    bestScore: 0,
    gameOver: false,
    won: false,
    size: 4
};

// Инициализация игры 2048
function init2048Game() {
    // Загружаем рекорд
    const savedBest = localStorage.getItem('2048_best');
    if (savedBest) {
        game2048.bestScore = parseInt(savedBest);
        document.getElementById('2048-best').textContent = game2048.bestScore;
    }
    
    // Создаем игровое поле
    const boardElement = document.getElementById('2048-board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${game2048.size}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${game2048.size}, 1fr)`;
    
    // Инициализируем массив поля
    game2048.board = [];
    for (let i = 0; i < game2048.size; i++) {
        game2048.board[i] = [];
        for (let j = 0; j < game2048.size; j++) {
            game2048.board[i][j] = 0;
        }
    }
    
    // Создаем визуальные плитки
    for (let i = 0; i < game2048.size; i++) {
        for (let j = 0; j < game2048.size; j++) {
            const tile = document.createElement('div');
            tile.className = 'game-2048-tile';
            tile.id = `tile-${i}-${j}`;
            boardElement.appendChild(tile);
        }
    }
    
    // Начальные плитки
    game2048.score = 0;
    game2048.gameOver = false;
    game2048.won = false;
    
    addRandomTile();
    addRandomTile();
    
    update2048Board();
    
    // Обработчики свайпов
    initSwipeControls();
    
    // Кнопка "Новая игра"
    document.getElementById('new-2048-game').addEventListener('click', init2048Game);
}

// Добавляем случайную плитку
function addRandomTile() {
    const emptyCells = [];
    
    for (let i = 0; i < game2048.size; i++) {
        for (let j = 0; j < game2048.size; j++) {
            if (game2048.board[i][j] === 0) {
                emptyCells.push({x: i, y: j});
            }
        }
    }
    
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        game2048.board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
    }
}

// Обновляем доску
function update2048Board() {
    document.getElementById('2048-score').textContent = game2048.score;
    
    for (let i = 0; i < game2048.size; i++) {
        for (let j = 0; j < game2048.size; j++) {
            const tile = document.getElementById(`tile-${i}-${j}`);
            const value = game2048.board[i][j];
            
            tile.textContent = value === 0 ? '' : value;
            tile.className = 'game-2048-tile';
            
            if (value > 0) {
                tile.classList.add(`tile-${value}`);
            }
            
            if (value === 256 && !game2048.won) {
                // Награда за достижение 256
                game2048.won = true;
                award2048Prize();
            }
        }
    }
    
    // Проверяем конец игры
    if (isGameOver()) {
        game2048.gameOver = true;
        setTimeout(() => {
            showNotification("Игра окончена! Счет: " + game2048.score);
        }, 500);
    }
}

// Проверка на конец игры
function isGameOver() {
    // Проверяем, есть ли пустые клетки
    for (let i = 0; i < game2048.size; i++) {
        for (let j = 0; j < game2048.size; j++) {
            if (game2048.board[i][j] === 0) {
                return false;
            }
        }
    }
    
    // Проверяем, есть ли возможные слияния
    for (let i = 0; i < game2048.size; i++) {
        for (let j = 0; j < game2048.size; j++) {
            const current = game2048.board[i][j];
            
            // Проверяем соседей
            if (i < game2048.size - 1 && current === game2048.board[i + 1][j]) {
                return false;
            }
            
            if (j < game2048.size - 1 && current === game2048.board[i][j + 1]) {
                return false;
            }
        }
    }
    
    return true;
}

// Награда за достижение 256
function award2048Prize() {
    // Обновляем глобальные данные игры
    if (typeof gameData !== 'undefined') {
        gameData.balance += 10000;
        gameData.totalEarned += 10000;
        gameData.gamesWon++;
        
        // Обновляем интерфейс основной игры
        updateUI();
        updateLeaderboard();
        saveGameData();
        
        showNotification("🎉 Поздравляем! Вы собрали 256 и получаете 10,000 ₮!");
    }
    
    // Обновляем рекорд
    if (game2048.score > game2048.bestScore) {
        game2048.bestScore = game2048.score;
        document.getElementById('2048-best').textContent = game2048.bestScore;
        localStorage.setItem('2048_best', game2048.bestScore.toString());
    }
}

// Управление свайпами
function initSwipeControls() {
    let startX, startY;
    
    document.getElementById('2048-board').addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    });
    
    document.getElementById('2048-board').addEventListener('touchend', (e) => {
        if (!startX || !startY || game2048.gameOver) return;
        
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        
        const diffX = endX - startX;
        const diffY = endY - startY;
        
        // Минимальная дистанция для свайпа
        const minSwipeDistance = 30;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Горизонтальный свайп
            if (Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    // Свайп вправо
                    moveRight();
                } else {
                    // Свайп влево
                    moveLeft();
                }
            }
        } else {
            // Вертикальный свайп
            if (Math.abs(diffY) > minSwipeDistance) {
                if (diffY > 0) {
                    // Свайп вниз
                    moveDown();
                } else {
                    // Свайп вверх
                    moveUp();
                }
            }
        }
        
        startX = null;
        startY = null;
    });
    
    // Управление с клавиатуры для тестирования
    document.addEventListener('keydown', (e) => {
        if (game2048.gameOver) return;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                moveUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveDown();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveRight();
                break;
        }
    });
}

// Движение вверх
function moveUp() {
    let moved = false;
    
    for (let j = 0; j < game2048.size; j++) {
        // Собираем ненулевые элементы в столбце
        const column = [];
        for (let i = 0; i < game2048.size; i++) {
            if (game2048.board[i][j] !== 0) {
                column.push(game2048.board[i][j]);
            }
        }
        
        // Объединяем одинаковые
        for (let i = 0; i < column.length - 1; i++) {
            if (column[i] === column[i + 1]) {
                column[i] *= 2;
                game2048.score += column[i];
                column.splice(i + 1, 1);
            }
        }
        
        // Заполняем столбец обратно
        for (let i = 0; i < game2048.size; i++) {
            const newValue = i < column.length ? column[i] : 0;
            if (game2048.board[i][j] !== newValue) {
                moved = true;
            }
            game2048.board[i][j] = newValue;
        }
    }
    
    if (moved) {
        addRandomTile();
        update2048Board();
    }
}

// Движение вниз
function moveDown() {
    let moved = false;
    
    for (let j = 0; j < game2048.size; j++) {
        // Собираем ненулевые элементы в столбце
        const column = [];
        for (let i = game2048.size - 1; i >= 0; i--) {
            if (game2048.board[i][j] !== 0) {
                column.push(game2048.board[i][j]);
            }
        }
        
        // Объединяем одинаковые
        for (let i = 0; i < column.length - 1; i++) {
            if (column[i] === column[i + 1]) {
                column[i] *= 2;
                game2048.score += column[i];
                column.splice(i + 1, 1);
            }
        }
        
        // Заполняем столбец обратно
        for (let i = game2048.size - 1; i >= 0; i--) {
            const newValue = game2048.size - 1 - i < column.length ? column[game2048.size - 1 - i] : 0;
            if (game2048.board[i][j] !== newValue) {
                moved = true;
            }
            game2048.board[i][j] = newValue;
        }
    }
    
    if (moved) {
        addRandomTile();
        update2048Board();
    }
}

// Движение влево
function moveLeft() {
    let moved = false;
    
    for (let i = 0; i < game2048.size; i++) {
        // Собираем ненулевые элементы в строке
        const row = [];
        for (let j = 0; j < game2048.size; j++) {
            if (game2048.board[i][j] !== 0) {
                row.push(game2048.board[i][j]);
            }
        }
        
        // Объединяем одинаковые
        for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
                row[j] *= 2;
                game2048.score += row[j];
                row.splice(j + 1, 1);
            }
        }
        
        // Заполняем строку обратно
        for (let j = 0; j < game2048.size; j++) {
            const newValue = j < row.length ? row[j] : 0;
            if (game2048.board[i][j] !== newValue) {
                moved = true;
            }
            game2048.board[i][j] = newValue;
        }
    }
    
    if (moved) {
        addRandomTile();
        update2048Board();
    }
}

// Движение вправо
function moveRight() {
    let moved = false;
    
    for (let i = 0; i < game2048.size; i++) {
        // Собираем ненулевые элементы в строке
        const row = [];
        for (let j = game2048.size - 1; j >= 0; j--) {
            if (game2048.board[i][j] !== 0) {
                row.push(game2048.board[i][j]);
            }
        }
        
        // Объединяем одинаковые
        for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
                row[j] *= 2;
                game2048.score += row[j];
                row.splice(j + 1, 1);
            }
        }
        
        // Заполняем строку обратно
        for (let j = game2048.size - 1; j >= 0; j--) {
            const newValue = game2048.size - 1 - j < row.length ? row[game2048.size - 1 - j] : 0;
            if (game2048.board[i][j] !== newValue) {
                moved = true;
            }
            game2048.board[i][j] = newValue;
        }
    }
    
    if (moved) {
        addRandomTile();
        update2048Board();
    }
}
