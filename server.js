const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));

app.get('/', (req, res) => res.send('Babariya Parivar Backend Running ✅'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});