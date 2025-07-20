require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const cors = require('cors');

// Enable CORS for all origins (or specify origin if you want to restrict)
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Mount central router
const mainRouter = require('./app/router');
app.use('/api', mainRouter);

// // Serve React static files
// app.use(express.static(path.join(__dirname, 'build')));

// // Fallback for React client-side routing (SPA)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
