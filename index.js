require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');


// Enable CORS for all origins (or specify origin if you want to restrict)
app.use(cors({ origin: 'http://45.139.10.210:3000', credentials: true }));
const port = process.env.PORT || 4000;

// Middleware to parse JSON
app.use(express.json());

// Mount central router
const mainRouter = require('./app/router');
app.use('/api', mainRouter);

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${port}`);
});
