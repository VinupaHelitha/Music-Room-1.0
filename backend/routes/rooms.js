import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/init.js';

const router = express.Router();

// Create a new music room
router.post('/create', async (req, res) => {
  try {
    const { roomName, isPublic, allowAudio } = req.body;
    const userId = req.user.userId;
    const db = getDatabase();
    const roomId = uuidv4();

    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query(
      `INSERT INTO rooms (id, name, creator_id, is_public, allow_audio, room_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [roomId, roomName, userId, isPublic || false, allowAudio || false, roomCode]
    );

    res.status(201).json({
      roomId,
      roomName,
      roomCode,
      creatorId: userId,
      isPublic: isPublic || false,
      allowAudio: allowAudio || false
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room details
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const db = getDatabase();

    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    const room = roomResult.rows[0];

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const membersResult = await db.query('SELECT user_id FROM room_members WHERE room_id = $1', [roomId]);
    room.memberCount = membersResult.rowCount;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    room.shareLink = `${baseUrl}/join/${room.room_code}`;

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get room by code (for join link)
router.get('/code/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const db = getDatabase();

    const result = await db.query('SELECT id, name, is_public, room_code FROM rooms WHERE room_code = $1', [roomCode]);
    const room = result.rows[0];

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room by code error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Toggle audio playback for the room
router.post('/:roomId/toggle-audio', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { allowAudio } = req.body;
    const db = getDatabase();

    const result = await db.query('UPDATE rooms SET allow_audio = $1 WHERE id = $2', [allowAudio ? true : false, roomId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room audio updated', allowAudio });
  } catch (error) {
    console.error('Toggle audio error:', error);
    res.status(500).json({ error: 'Failed to toggle room audio' });
  }
});

// Get user's rooms
router.get('/user/my-rooms', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    const result = await db.query('SELECT * FROM rooms WHERE creator_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Join room
router.post('/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();

    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    const room = roomResult.rows[0];

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const membershipResult = await db.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);
    if (membershipResult.rowCount === 0) {
      await db.query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)', [roomId, userId]);
      return res.json({ message: 'Successfully joined room', roomId });
    }

    res.json({ message: 'Already in room', roomId });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Leave room
router.post('/:roomId/leave', async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();

    await db.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);
    res.json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

export default router;
