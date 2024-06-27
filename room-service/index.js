const express = require('express');
const roomRoutes = require('./routes/roomRoutes');
const eventRoutes = require('./routes/eventRoutes');
const app = express();
const cors = require('cors');

app.use(express.json({ limit: '50mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded payloads

// app.use(express.json());

app.use(cors());

app.use('/api', roomRoutes);
app.use('/api', eventRoutes);

const PORT = process.env.PORT || 37104;
app.listen(PORT, () => console.log(`Room service running on port ${PORT}`));
