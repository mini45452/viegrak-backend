const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 37105;
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT
});

// Update the endpoint to send a message to an event
app.post('/send-message', async (req, res) => {
  const { username, eventId, message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (username, event_id, message) VALUES ($1, $2, $3) RETURNING *',
      [username, eventId, message]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Update the endpoint to get messages for an event
app.get('/event-messages/:eventId', async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Message-service listening at http://localhost:${port}`);
});
