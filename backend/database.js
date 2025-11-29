const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open SQLite database', err);
        return reject(err);
      }
      console.log('SQLite ready:', DB_PATH);
      createTables()
        .then(resolve)
        .catch(reject);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        committee_code TEXT NOT NULL,
        delegation TEXT,
        flag TEXT,
        credentials_day INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        committee_code TEXT NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS note_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        recipient_type TEXT NOT NULL,
        recipient_ref TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        is_starred INTEGER DEFAULT 0,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )`
    ];

    let remaining = statements.length;
    db.serialize(() => {
      statements.forEach((sql) => {
        db.run(sql, (err) => {
          if (err) {
            console.error('Failed to run migration', err);
            return reject(err);
          }
          remaining -= 1;
          if (remaining === 0) {
            resolve();
          }
        });
      });
    });
  });
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

async function seedUsers(defaultUsers = [], forceReseed = false) {
  const count = await get('SELECT COUNT(*) as count FROM users');
  if (count && count.count > 0 && !forceReseed) {
    console.log('Users already exist, skipping seed. Set FORCE_RESEED=true to reseed.');
    return;
  }
  
  if (forceReseed) {
    console.log('Force reseeding: clearing existing users...');
    await run('DELETE FROM users');
  }
  
  const insertSql = `
    INSERT INTO users (username, password, role, committee_code, delegation, flag, credentials_day)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  for (const user of defaultUsers) {
    const hashed = await bcrypt.hash(user.password, 10);
    await run(insertSql, [
      user.username,
      hashed,
      user.role,
      user.committee_code,
      user.delegation,
      user.flag,
      user.credentials_day || 1
    ]);
  }
  console.log('Seeded users:', defaultUsers.length);
}

module.exports = {
  initDatabase,
  query,
  get,
  run,
  seedUsers
};

