const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

/**
 * GET /api/token?room=interview-room&username=candidate
 * Returns a signed LiveKit JWT that the frontend uses to join the room.
 */
app.get('/api/token', async (req, res) => {
  const room = req.query.room || 'interview-room';
  const username = req.query.username || 'candidate';

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    return res.status(500).json({ error: 'LIVEKIT_API_KEY / LIVEKIT_API_SECRET not set in .env' });
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: username, ttl: '2h' }
  );

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,      // candidate can speak
    canSubscribe: true,    // candidate can hear agent
  });

  const token = await at.toJwt();

  res.json({
    token,
    url: process.env.LIVEKIT_URL,
    room,
  });
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n✅ Token server running at http://localhost:${PORT}`);
  console.log(`   LiveKit URL: ${process.env.LIVEKIT_URL}\n`);
});
