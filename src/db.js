const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'raffles.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'AE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_value_aed REAL NOT NULL,
  ticket_price_aed REAL NOT NULL,
  total_tickets INTEGER NOT NULL,
  sold_tickets INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  draw_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raffle_id INTEGER NOT NULL,
  user_id INTEGER,
  ticket_number TEXT NOT NULL,
  payment_gateway TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'initiated',
  amount_aed REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raffle_id) REFERENCES raffles(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  gateway TEXT NOT NULL,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  amount_aed REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
`);

const raffleCount = db.prepare('SELECT COUNT(*) as count FROM raffles').get().count;
if (raffleCount === 0) {
  const seed = db.prepare(`
    INSERT INTO raffles (title, description, prize_type, prize_value_aed, ticket_price_aed, total_tickets, draw_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  seed.run(
    'Luxury Villa Mega Draw',
    'Win a premium waterfront villa in Dubai Marina.',
    'house',
    7500000,
    250,
    5000,
    '2026-01-25'
  );
  seed.run(
    'Supercar Dream Raffle',
    'Drive away with a flagship luxury supercar.',
    'car',
    1800000,
    100,
    10000,
    '2025-11-10'
  );
  seed.run(
    'Elite Lifestyle Bundle',
    'Yacht getaway + luxury watches + VIP travel package.',
    'luxury-gifts',
    950000,
    50,
    20000,
    '2025-10-01'
  );
}

module.exports = db;
