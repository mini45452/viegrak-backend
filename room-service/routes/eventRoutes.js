const express = require('express');
const router = express.Router();
const pool = require('../db/dbConfig');
const jwt = require('jsonwebtoken');

// Middleware to verify the token and check for admin role
const verifyTokenAndAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ error: 'Authorization token is required.' });
  }

  const actualToken = token.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    const { roles } = decoded;

    if (roles !== 'admin') {
      return res.status(403).send({ error: 'Unauthorized: Only admins can perform this action.' });
    }

    req.user = decoded; // Attach decoded token to request
    next();
  } catch (error) {
    console.error('JWT error:', error);
    res.status(401).send({ error: 'Unauthorized: Invalid token.' });
  }
};

// Create event
router.post('/create-event', verifyTokenAndAdmin, async (req, res) => {
  const { name, thumbnail, description, start_time, end_time } = req.body;

  // Validate all required fields
  if (!name || !thumbnail || !description || !start_time || !end_time) {
    return res.status(400).send({ error: 'All fields (name, thumbnail, description, start_time, end_time) are required.' });
  }

  // Validate start_time and end_time
  if (new Date(start_time) >= new Date(end_time)) {
    return res.status(400).send({ error: 'The start time must be before the end time.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO events(name, thumbnail, description, start_time, end_time) VALUES($1, $2, $3, $4, $5) RETURNING id',
      [name, thumbnail, description, start_time, end_time]
    );

    res.send({ eventId: result.rows[0].id });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send({ error: 'Internal server error.' });
  }
});

// Update event
router.put('/update-event/:id', verifyTokenAndAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, thumbnail, description, start_time, end_time } = req.body;

  // Validate all required fields
  if (!name || !thumbnail || !description || !start_time || !end_time) {
    return res.status(400).send({ error: 'All fields (name, thumbnail, description, start_time, end_time) are required.' });
  }

  // Validate start_time and end_time
  if (new Date(start_time) >= new Date(end_time)) {
    return res.status(400).send({ error: 'The start time must be before the end time.' });
  }

  try {
    const result = await pool.query(
      'UPDATE events SET name=$1, thumbnail=$2, description=$3, start_time=$4, end_time=$5 WHERE id=$6 RETURNING id',
      [name, thumbnail, description, start_time, end_time, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'Event not found.' });
    }

    res.send({ eventId: result.rows[0].id });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send({ error: 'Internal server error.' });
  }
});

// Delete event
router.delete('/delete-event/:id', verifyTokenAndAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM events WHERE id=$1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'Event not found.' });
    }

    res.send({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send({ error: 'Internal server error.' });
  }
});


router.post('/register-user-to-event', async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    // Check if the user exists
    const userResult = await pool.query('SELECT * FROM "Users" WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ errorCode: 1, message: 'User does not exist' });
    }

    // Check if the user is already registered to the event
    const checkRegistration = await pool.query('SELECT * FROM event_users WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
    if (checkRegistration.rows.length > 0) {
      return res.status(400).json({ errorCode: 1, message: 'User already registered to event' });
    }

    // Register user to the event
    await pool.query('INSERT INTO event_users(user_id, event_id) VALUES($1, $2)', [userId, eventId]);
    res.json({ errorCode: 0, message: 'User registered to event successfully' });
  } catch (error) {
    console.error('Error registering user to event:', error);
    res.status(500).json({ errorCode: 1, message: 'Internal server error' });
  }
});

router.post('/unregister-user-from-event', async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    // Check if the user is currently registered to the event
    const checkRegistration = await pool.query('SELECT * FROM event_users WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
    if (checkRegistration.rows.length === 0) {
      return res.status(404).json({ errorCode: 1, message: 'User not registered to event' });
    }

    // Remove user from the event
    await pool.query('DELETE FROM event_users WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
    res.json({ errorCode: 0, message: 'User unregistered from event successfully' });
  } catch (error) {
    console.error('Error unregistering user from event:', error);
    res.status(500).json({ errorCode: 1, message: 'Internal server error' });
  }
});

router.get('/check-registration-status', async (req, res) => {
  const { userId, eventId } = req.query; // Use query parameters for a GET request
  try {
    // Check if the user is currently registered to the event
    const checkRegistration = await pool.query('SELECT * FROM event_users WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
    if (checkRegistration.rows.length > 0) {
      return res.json({ isRegistered: true, message: 'User is registered to the event.' });
    } else {
      return res.json({ isRegistered: false, message: 'User is not registered to the event.' });
    }
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({ errorCode: 1, message: 'Internal server error' });
  }
});

// Get list of events
router.get('/events', async (req, res) => {
  const events = await pool.query('SELECT * FROM events');
  res.send(events.rows);
});

router.get('/event-detail/:eventId', async (req, res) => {
  const { eventId } = req.params;
  try {
    const queryResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (queryResult.rows.length > 0) {
      res.json(queryResult.rows[0]);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});


// Get users by event ID
router.get('/event-users/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const users = await pool.query('SELECT username FROM event_users eu JOIN "Users" u ON eu.user_id = u.id WHERE eu.event_id = $1', [eventId]);
  res.send(users.rows);
});

module.exports = router;
