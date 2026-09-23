const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let tasks = [
  { id: 1, title: "Example task 1", done: false },
  { id: 2, title: "Example task 2", done: true },
  { id: 3, title: "Example task 3", done: false }
];

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

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  
  res.json(task);
});

let nextId = 4;

app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: "Title is required and cannot be empty" });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    done: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.listen(port, () => {

  console.log(`Server listening on port ${port}`);
});
