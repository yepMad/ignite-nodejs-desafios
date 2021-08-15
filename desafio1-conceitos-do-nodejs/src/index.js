const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  
  const user = users.find(i => i.username === username);
  if (!user) {
    return response.status(400).json({ error: 'Username not found' });
  }

  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameExists = users.some(i => i.username === username);
  if (usernameExists) {
    return response.status(400).json({ error: 'Username has used' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user);
  return response.status(200).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.status(200).json(request.user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const newTodo = {
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  }

  const userIndex = users.findIndex(i => i.id === request.user.id);
  users[userIndex].todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;

  const userIndex = users.findIndex(i => i.id === request.user.id);
  const user = users[userIndex];

  const todoIndex = user.todos.findIndex(i => i.id === id);
  if (todoIndex < 0) {
    return response.status(404).json({ error: 'Todo do not exists' });
  }

  users[userIndex].todos[todoIndex].title = title || user.title;
  users[userIndex].todos[todoIndex].deadline = deadline ? new Date(deadline) : user.deadline;

  return response.status(200).json(users[userIndex].todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const userIndex = users.findIndex(i => i.id === request.user.id);
  const user = users[userIndex];

  const todoIndex = user.todos.findIndex(i => i.id === id);
  if (todoIndex < 0) {
    return response.status(404).json({ error: 'Todo do not exists' });
  }

  users[userIndex].todos[todoIndex].done = true;
  return response.status(200).json(users[userIndex].todos[todoIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const userIndex = users.findIndex(i => i.id === request.user.id);
  const user = users[userIndex];

  const todoIndex = user.todos.findIndex(i => i.id === id);
  if (todoIndex < 0) {
    return response.status(404).json({ error: 'Todo do not exists' });
  }

  users[userIndex].todos.splice(todoIndex, 1);
  return response.status(204).json();
});

module.exports = app;