const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const mysql = require('mysql2/promise');

function createSqliteStore() {
  const location = process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';
  fs.mkdirSync(path.dirname(location), { recursive: true });
  const database = new DatabaseSync(location);
  database.exec(`
    CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log(`Using sqlite database at ${location}`);

  return {
    async getItems() {
      return database.prepare('SELECT id, name, completed FROM todo_items ORDER BY rowid')
        .all().map((item) => ({ ...item, completed: item.completed === 1 }));
    },
    async addItem(item) {
      database.prepare('INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)')
        .run(item.id, item.name, item.completed ? 1 : 0);
    },
    async updateItem(id, item) {
      return database.prepare('UPDATE todo_items SET name = ?, completed = ? WHERE id = ?')
        .run(item.name, item.completed ? 1 : 0, id).changes > 0;
    },
    async deleteItem(id) {
      return database.prepare('DELETE FROM todo_items WHERE id = ?').run(id).changes > 0;
    },
    async close() {
      database.close();
    },
  };
}

async function createMysqlStore() {
  const options = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
  };

  let pool;
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      pool = mysql.createPool(options);
      await pool.query('SELECT 1');
      break;
    } catch (error) {
      lastError = error;
      if (pool) await pool.end().catch(() => {});
      pool = undefined;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  if (!pool) throw lastError;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS todo_items (
      id varchar(36) PRIMARY KEY,
      name varchar(255) NOT NULL,
      completed boolean NOT NULL DEFAULT false
    ) DEFAULT CHARSET utf8mb4
  `);
  console.log(`Connected to mysql db at host ${options.host}`);

  return {
    async getItems() {
      const [rows] = await pool.execute('SELECT id, name, completed FROM todo_items ORDER BY id');
      return rows.map((item) => ({ ...item, completed: item.completed === 1 }));
    },
    async addItem(item) {
      await pool.execute('INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
        [item.id, item.name, item.completed]);
    },
    async updateItem(id, item) {
      const [result] = await pool.execute(
        'UPDATE todo_items SET name = ?, completed = ? WHERE id = ?',
        [item.name, item.completed, id],
      );
      return result.affectedRows > 0;
    },
    async deleteItem(id) {
      const [result] = await pool.execute('DELETE FROM todo_items WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
    async close() {
      await pool.end();
    },
  };
}

module.exports.createStore = () => process.env.MYSQL_HOST
  ? createMysqlStore()
  : Promise.resolve(createSqliteStore());
