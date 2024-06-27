const express = require('express');
const router = express.Router();
const pool = require('../db/dbConfig');

router.post('/create-room', async (req, res) => {
    const { roomName } = req.body;
    const result = await pool.query('INSERT INTO rooms(name) VALUES($1) RETURNING id', [roomName]);
    res.send({ roomId: result.rows[0].id });
});

router.post('/assign-user', async (req, res) => {
    const { username, roomId } = req.body;
    try {
        // Check if the user exists
        const userResult = await pool.query('SELECT * FROM "Users" WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(404).send({ message: 'User does not exist' });
        }

        // Assign user to the room
        await pool.query('INSERT INTO room_users(room_id, username) VALUES($1, $2)', [roomId, username]);
        res.send({ message: 'User assigned successfully' });
    } catch (error) {
        console.error('Error assigning user:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

router.get('/rooms', async (req, res) => {
    const rooms = await pool.query('SELECT * FROM rooms');
    res.send(rooms.rows);
});

router.get('/room-users/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const users = await pool.query('SELECT username FROM room_users WHERE room_id = $1', [roomId]);
    res.send(users.rows);
});

module.exports = router;
