
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

// Створення таблиці користувачів, якщо її немає
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER NOT NULL
        )
    `);
});

app.use(bodyParser.json());

// Маршрут для кореневого шляху
app.get('/', (req, res) => {
    res.send('Welcome to the REST API server for User entity!');
});

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

// Отримати користувача за ID
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const sql = 'SELECT * FROM users WHERE id = ?';

    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving user', error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(row);
    });
});

// Оновити користувача за ID
app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { name, age } = req.body;

    if (!name || !age) {
        return res.status(400).json({ message: 'Name and age are required' });
    }

    const sql = 'UPDATE users SET name = ?, age = ? WHERE id = ?';
    db.run(sql, [name, age, userId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating user', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ id: userId, name, age });
    });
});

// Видалити користувача за ID
app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const sql = 'DELETE FROM users WHERE id = ?';

    db.run(sql, [userId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting user', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send();
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
