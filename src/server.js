require('dotenv').config();
const path = require('path');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { selectGateway, createGatewayOrder } = require('./payments');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const getRaffles = db.prepare('SELECT * FROM raffles WHERE status = ? ORDER BY created_at DESC');
const getRaffleById = db.prepare('SELECT * FROM raffles WHERE id = ?');
const createUserStmt = db.prepare(
  'INSERT INTO users (name, email, country_code) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET name=excluded.name, country_code=excluded.country_code'
);
const getUserStmt = db.prepare('SELECT * FROM users WHERE email = ?');
const createTicketStmt = db.prepare(
  'INSERT INTO tickets (raffle_id, user_id, ticket_number, payment_gateway, amount_aed) VALUES (?, ?, ?, ?, ?)'
);
const createPaymentStmt = db.prepare(
  'INSERT INTO payments (ticket_id, gateway, gateway_order_id, amount_aed, status) VALUES (?, ?, ?, ?, ?)'
);

function createTicketNumber(raffleId) {
  return `RR-${raffleId}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

app.get('/', (req, res) => {
  const raffles = getRaffles.all('active');
  res.render('home', { raffles, brandName: 'RAYHAAN RAFFLES' });
});

app.get('/raffles/:id', (req, res) => {
  const raffle = getRaffleById.get(req.params.id);
  if (!raffle) {
    return res.status(404).render('not-found');
  }
  return res.render('raffle-detail', { raffle, brandName: 'RAYHAAN RAFFLES' });
});

app.post('/checkout', async (req, res) => {
  try {
    const { raffleId, name, email, countryCode = 'AE' } = req.body;
    const raffle = getRaffleById.get(raffleId);
    if (!raffle) {
      return res.status(404).json({ error: 'Raffle not found' });
    }

    createUserStmt.run(name, email, countryCode.toUpperCase());
    const user = getUserStmt.get(email);

    const gateway = selectGateway(countryCode);
    const ticketNumber = createTicketNumber(raffle.id);

    const ticketResult = createTicketStmt.run(raffle.id, user.id, ticketNumber, gateway, raffle.ticket_price_aed);
    const ticketId = ticketResult.lastInsertRowid;

    const order = await createGatewayOrder({
      gateway,
      amountAed: raffle.ticket_price_aed,
      ticketId,
      customerEmail: email
    });

    createPaymentStmt.run(ticketId, gateway, order.orderId, raffle.ticket_price_aed, 'created');

    return res.json({
      success: true,
      gateway,
      currency: 'AED',
      amountAed: raffle.ticket_price_aed,
      ticketNumber,
      orderId: order.orderId,
      clientSecret: order.clientSecret || null,
      message: 'Order created. Use your front-end SDK integration to complete payment confirmation.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Checkout failed' });
  }
});

app.get('/admin', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    raffles: db.prepare('SELECT COUNT(*) AS count FROM raffles').get().count,
    tickets: db.prepare('SELECT COUNT(*) AS count FROM tickets').get().count,
    revenue: db.prepare('SELECT IFNULL(SUM(amount_aed), 0) AS total FROM tickets').get().total
  };

  const recentTickets = db
    .prepare(
      `SELECT t.ticket_number, t.payment_gateway, t.amount_aed, t.created_at, r.title AS raffle_title, u.email
       FROM tickets t
       JOIN raffles r ON r.id = t.raffle_id
       LEFT JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC LIMIT 20`
    )
    .all();

  return res.render('admin/dashboard', { stats, recentTickets, brandName: 'RAYHAAN RAFFLES' });
});

app.get('/api/admin/raffles', (req, res) => {
  const raffles = db.prepare('SELECT * FROM raffles ORDER BY created_at DESC').all();
  res.json({ raffles, currency: 'AED' });
});

app.use((req, res) => res.status(404).render('not-found'));

app.listen(PORT, () => {
  console.log(`RAYHAAN RAFFLES app running on http://localhost:${PORT}`);
});
