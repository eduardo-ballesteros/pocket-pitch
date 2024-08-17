require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateInfoRouter = require('./routes/generate-info');

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly!' });
});

app.use('/api', generateInfoRouter);

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Tavily Key: ${process.env.TAVILY_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`Perplexity Key: ${process.env.PERPLEXITY_API_KEY ? 'Set' : 'Not set'}`);
});