require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');


// Enable CORS for all origins (or specify origin if you want to restrict)
const allowedOrigins = [
  'http://185.243.48.94:3000',
  'http://alterbit.ir',
  'http://www.alterbit.ir'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const port = process.env.PORT || 2087;

// Middleware to parse JSON
app.use(express.json());

// Mount central router
const mainRouter = require('./app/router');
app.use('/api', mainRouter);
// Health check route
app.get('/api/ping', (req, res) => res.send('pong'));
// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${port}`);
});
