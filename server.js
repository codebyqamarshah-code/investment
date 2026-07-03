// server.js – Local development entry point
require('dotenv').config(); // load .env variables
const app = require('./api/index.js'); // the exported Express app
const server = app.server || app; // the HTTP Socket server wrapper

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
