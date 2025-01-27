const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Підключення до бази даних SQLite
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Створення таблиць, якщо їх немає
db.serialize(() => {
    // Таблиця користувачів
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER NOT NULL
        )
    `);

    // Таблиця для зв'язків між друзями
    db.run(`
        CREATE TABLE IF NOT EXISTS friendships (
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, friend_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
});

app.use(bodyParser.json());

// Маршрут для кореневого шляху
app.get('/', (req, res) => {
    res.send('Welcome to the REST API server with Friends functionality!');
});

// *** Користувачі ***

// Отримати всіх користувачів
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving users', error: err.message });
        }
        res.json(rows);
    });
});

// Додати нового користувача
app.post('/users', (req, res) => {
    const { name, age } = req.body;
    if (!name || !age) {
        return res.status(400).json({ message: 'Name and age are required' });
    }

    const sql = 'INSERT INTO users (name, age) VALUES (?, ?)';
    db.run(sql, [name, age], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error adding user', error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, age });
    });
});

// *** Друзі ***

// Додати друга
app.post('/users/:id/friends', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { friendId } = req.body;

    if (!friendId) {
        return res.status(400).json({ message: 'Friend ID is required' });
    }

    const sql = `
        INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)
    `;
    db.run(sql, [userId, friendId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error adding friend', error: err.message });
        }
        res.json({ message: 'Friend added successfully.' });
    });
});

// Отримати список друзів користувача
app.get('/users/:id/friends', (req, res) => {
    const userId = parseInt(req.params.id, 10);

    const sql = `
        SELECT u.id, u.name, u.age
        FROM friendships f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving friends', error: err.message });
        }
        res.json(rows);
    });
});

// Видалити друга
app.delete('/users/:id/friends', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { friendId } = req.body;

    if (!friendId) {
        return res.status(400).json({ message: 'Friend ID is required' });
    }

    const sql = `
        DELETE FROM friendships WHERE user_id = ? AND friend_id = ?
    `;
    db.run(sql, [userId, friendId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting friend', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Friendship not found' });
        }
        res.json({ message: 'Friend removed successfully.' });
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Закриття підключення до бази даних при завершенні процесу
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing SQLite connection:', err.message);
        } else {
            console.log('SQLite connection closed.');
        }
        process.exit(0);
    });
});
