// server.js – Local development entry point
require('dotenv').config(); // load .env variables
const app = require('./api/index.js'); // the exported Express app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
