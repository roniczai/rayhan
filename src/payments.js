const Razorpay = require('razorpay');
const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

const INDIA_CODES = new Set(['IN']);

function selectGateway(countryCode) {
  return INDIA_CODES.has((countryCode || '').toUpperCase()) ? 'razorpay' : 'stripe';
}

async function createGatewayOrder({ gateway, amountAed, ticketId, customerEmail }) {
  const amountMinor = Math.round(amountAed * 100);

  if (gateway === 'razorpay') {
    if (!razorpay) {
      return { provider: 'razorpay', orderId: `offline-rzp-${ticketId}`, raw: { configured: false } };
    }
    const order = await razorpay.orders.create({
      amount: amountMinor,
      currency: 'AED',
      receipt: `ticket_${ticketId}`,
      notes: { ticketId: String(ticketId), brand: 'RAYHAAN RAFFLES' }
    });
    return { provider: 'razorpay', orderId: order.id, raw: order };
  }

  if (!stripe) {
    return { provider: 'stripe', orderId: `offline-stripe-${ticketId}`, raw: { configured: false } };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: 'aed',
    receipt_email: customerEmail,
    metadata: {
      ticketId: String(ticketId),
      brand: 'RAYHAAN RAFFLES'
    },
    automatic_payment_methods: { enabled: true }
  });

  return {
    provider: 'stripe',
    orderId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    raw: paymentIntent
  };
}

module.exports = {
  selectGateway,
  createGatewayOrder
};
