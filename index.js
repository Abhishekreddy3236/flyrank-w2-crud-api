const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tasks',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dev'
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE
      )
    `);
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks');
    if (parseInt(rows[0].count, 10) === 0) {
      await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Example task 1', false]);
      await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Example task 2', true]);
      await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', ['Example task 3', false]);
    }
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}
initDB();

const Database = require('better-sqlite3');
const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT,
    done BOOLEAN
  )
`);

const countStmt = db.prepare('SELECT COUNT(*) AS count FROM tasks');
const { count } = countStmt.get();

if (count === 0) {
  const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insertStmt.run('Example task 1', 0);
  insertStmt.run('Example task 2', 1);
  insertStmt.run('Example task 3', 0);
}

app.get('/', (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: "Title is required and cannot be empty" });
  }

  const cleanTitle = title.trim();
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
      [cleanTitle, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const resultTask = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (resultTask.rows.length === 0) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }
    const task = resultTask.rows[0];

    const { title, done } = req.body;
    if (!req.body || (title === undefined && done === undefined)) {
      return res.status(400).json({ error: "At least 'title' or 'done' field is required to update" });
    }
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: "Title must be a non-empty string" });
    }
    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ error: "Done must be a boolean" });
    }

    const updatedTitle = title !== undefined ? title.trim() : task.title;
    const updatedDone = done !== undefined ? done : task.done;

    const updateResult = await pool.query(
      'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
      [updatedTitle, updatedDone, id]
    );
    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {

  console.log(`Server listening on port ${port}`);
});
