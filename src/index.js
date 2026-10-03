const express = require('express');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const persistence = require('./persistence');

const app = express();
let store;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/items', async (_request, response, next) => {
  try {
    response.json(await store.getItems());
  } catch (error) {
    next(error);
  }
});

app.post('/items', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    if (!name) return response.status(400).json({ error: 'Name is required' });

    const item = { id: randomUUID(), name, completed: false };
    await store.addItem(item);
    response.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/items/:id', async (request, response, next) => {
  try {
    const item = {
      name: String(request.body.name || '').trim(),
      completed: Boolean(request.body.completed),
    };
    if (!item.name) return response.status(400).json({ error: 'Name is required' });

    const changed = await store.updateItem(request.params.id, item);
    if (!changed) return response.status(404).json({ error: 'Item not found' });
    response.json({ id: request.params.id, ...item });
  } catch (error) {
    next(error);
  }
});

app.delete('/items/:id', async (request, response, next) => {
  try {
    const changed = await store.deleteItem(request.params.id);
    if (!changed) return response.status(404).json({ error: 'Item not found' });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
});

async function start() {
  store = await persistence.createStore();
  const server = app.listen(3000, '0.0.0.0', () => console.log('Listening on port 3000'));

  const stop = () => server.close(async () => {
    await store.close();
    process.exit(0);
  });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
