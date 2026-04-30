// This is the main server file for the Rock-Paper-Scissors game. It handles user registration, login, matchmaking, and real-time communication using WebSockets. The server uses Express for handling HTTP requests and MySQL for storing user data. WebSocket connections are used for real-time gameplay interactions between matched players.
require('dotenv').config();
const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');
const { Player, Match } = require('./Match.js');
const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket
const wss = new WebSocketServer({server}); // WebSocket server for real-time communication

app.use(cors());
app.use(express.json());
const players = new Map(); // Map of WebSocket -> player info
const sessions = new Map(); // Map auth token -> Player instance
const queue = []; // Queue of waiting players for matchmaking
const lobbies = new Map(); // Map of lobby ID -> Match instance


// Function to find the best match for a player in the queue based on win/loss ratio 
function findBestMatch(ws) {
  const player = players.get(ws);
  if (!player) {
    console.log('[MATCHMAKING] No player object found for requesting socket. Skipping matchmaking.');
    return -1;
  }

  const myRatio = getRatio(player);
  let bestIndex = -1;
  let bestDiff = Infinity;

  for (let i = 0; i < queue.length; i++) {
    if (queue[i] === ws) continue; // skip self
    const candidate = players.get(queue[i]);
    console.log(queue[i], candidate ? candidate.username : 'unknown');
    if (!candidate) {
      console.log('[MATCHMAKING] Skipping queue member with no player object.');
      continue;
    }

    const candidateRatio = getRatio(candidate);
    const diff = Math.abs(candidateRatio - myRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return bestIndex;
}

// Function to calculate win/loss ratio for matchmaking
function getRatio(player) {
  if (!player || typeof player.wins !== 'number' || typeof player.losses !== 'number') {
    return 0;
  }

  return (player.wins + 1) / (player.losses + 1);
}
// Function to create a new lobby and start a match between two players
function createLobby(ws1, ws2) {
  const player1 = players.get(ws1);
  const player2 = players.get(ws2);
  if (!player1 || !player2) {
    console.error('[LOBBY] Cannot create lobby: missing player object for one of the sockets.');
    return;
  }

  const match = new Match(player1, player2);
  console.log('[LOBBY] Created match between', match.player1.username, 'and', match.player2.username);

  match.scores = {[player1.id]: 0, [player2.id]: 0};
  lobbies.set(match.id, match);

  ws1.send(JSON.stringify({
    type: 'MATCH_FOUND',
    matchId: match.id,
    round: match.round,
    maxRounds: match.maxRounds,
    opponent: { name: player2.username, hmp: player2.hand_most_played },
    scores: match.scores,
  }));

  ws2.send(JSON.stringify({
    type: 'MATCH_FOUND',
    matchId: match.id,
    round: match.round,
    maxRounds: match.maxRounds,
    opponent: { name: player1.username, hmp: player1.hand_most_played },
    scores: match.scores,
  }));

  player1.lobbyID = match.id;
  player2.lobbyID = match.id;
}


//session are to only use websockets after login instead of websockets on connection. Easier to get all their data then attach it before making the new player
function createSession(player) {
  const token = crypto.randomBytes(16).toString('hex');
  sessions.set(token, player);
  console.log('[SESSION] Created session for player:', player.username, 'id:', player.id);
  return token;
}

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.MYPASSWORD, //depending on who is running the SQL instance, we will need to make this that user's MySQL password
  database: 'RPS_DB' //db name changed from 'login_demo', database name is set to 'RPS_DB' in rpsdata.sql
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL');
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username already taken.' });
          }
          return res.status(500).json({ message: err.message });
        }

        res.json({ message: 'Registered successfully!' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('[LOGIN] Attempt:', username);

  if (!username || !password) {
    console.log('[LOGIN] Missing username or password');
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  db.query(
    'SELECT id, username, password, wins, losses, ties, hand_most_played FROM users WHERE username = ?',
    [username],
    async (err, results) => {
      if (err) {
        console.error('[LOGIN] DB error:', err.message);
        return res.status(500).json({ message: err.message });
      }

      if (results.length === 0) {
        console.log('[LOGIN] User not found:', username);
        return res.status(400).json({ message: 'Invalid username or password.' });
      }

      const user = results[0];
      console.log('[LOGIN] User found in DB, id:', user.id, 'username:', user.username);

      try {
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          console.log('[LOGIN] Password mismatch for:', username);
          return res.status(400).json({ message: 'Invalid username or password.' });
        }

        const player = new Player();
        player.id = user.id;
        player.username = user.username;
        player.wins = user.wins ?? 0;
        player.losses = user.losses ?? 0;
        player.ties = user.ties ?? 0;
        player.hand_most_played = user.hand_most_played ?? null;

        const token = createSession(player);
        console.log('[LOGIN] Session created. Token:', token.substring(0, 8) + '...');
        console.log('[LOGIN] Player object:', {
          id: player.id,
          username: player.username,
          wins: player.wins,
          losses: player.losses,
          ties: player.ties,
          hand_most_played: player.hand_most_played,
        });

        res.json({
          message: 'Login successful!',
          token,
          user: {
            id: player.id,
            username: player.username,
            wins: player.wins,
            losses: player.losses,
            ties: player.ties,
            hand_most_played: player.hand_most_played,
          },
        });

      } catch (error) {
        console.error('[LOGIN] Error during password check:', error);
        res.status(500).json({ message: error.message });
      }
    }
  );
});
/*
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

*/



// WebSocket server for real-time communication

// once data is fetched from DB we will use a token to verify the user and then attach their player data to their websocket connection. This way we can easily access their info when they send messages and we know who they are without having to send their token every time. We will also need to handle the case where a user tries to connect without logging in first, in which case we can just close the connection or send an error message.
wss.on('connection', (ws) => {
  console.log('[WS] New client connected. Total connections:', wss.clients.size);
  //on getting a message
  ws.on('message', (raw) => {
    let data;
    //ensures package is good
    try {
      data = JSON.parse(raw);
      console.log('[WS] Received message:', JSON.stringify(data).substring(0, 100));
    } catch (err) {
      console.error('[WS] JSON parse error:', err);
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON format.' }));
      return;
    }
    //check if the websocket connection is associated with a player (authenticated)
    if (!players.has(ws)) {
      if (data.type === 'AUTH' && data.token) {
        console.log('[WS] AUTH attempt with token:', data.token.substring(0, 8) + '...');
        const player = sessions.get(data.token);

        if (!player) {
          console.error('[WS] Auth failed - invalid token:', data.token.substring(0, 8) + '...');
          ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid auth token.' }));
          ws.close();
          return;
        }
        // Associate this WebSocket connection with the authenticated player
        players.set(ws, player);
        console.log('[WS] Auth success. Player:', player.username, 'id:', player.id);
        console.log('[WS] Active players map size:', players.size);
        // Send auth success message with player info
        ws.send(JSON.stringify({
          type: 'AUTH_SUCCESS',
          user: {
            id: player.id,
            username: player.username,
            wins: player.wins,
            losses: player.losses,
            ties: player.ties,
            hand_most_played: player.hand_most_played,
          },
        }));
        return;
      }

      console.log('[WS] Auth required but no token provided. Sending AUTH_REQUIRED.');
      ws.send(JSON.stringify({ type: 'AUTH_REQUIRED', message: 'Please authenticate first.' }));
      return;
    }

    const player = players.get(ws);
    const ration = (player.wins + 1) / (player.losses + 1);
    console.log('[WS] Message from', player.username, '- type:', data.type);
    // handle different message types (e.g., REGISTER, PLAY) and update player state or match state accordingly
    switch (data.type) {
      case 'REGISTER': {
        player.username = data.name;
        console.log('[WS] Player', player.id, 'registered as:', player.username);
        ws.send(JSON.stringify({ type: 'REGISTERED', id: player.id, username: player.username }));
        break;
      }
      case 'PLAY': {
        player.lastPlay = data.play;
        console.log('[WS] Player', player.username, 'played:', player.lastPlay);
        ws.send(JSON.stringify({ type: 'PLAY_RECEIVED', play: player.lastPlay }));
        break;
      }
      case 'JOIN_QUEUE': {
        // we can add some basic matchmaking logic here to pair players based on their win/loss ratio or other criteria. For now, we'll just add them to a queue and log it.
        console.log('[WS] JOIN_QUEUE from', player.username, 'id:', player.id);
        // Check if player is already in the queue to prevent duplicates
        if (!queue.includes(ws)) {
          // Add the player's WebSocket connection to the matchmaking queue
          queue.push(ws);
          // Log the current queue size after adding the player
          console.log('[QUEUE] Added socket to queue. Queue size:', queue.length);
        } else {
          // Log that the socket is already in the queue and skip adding it again
          console.log('[QUEUE] Socket already in queue, skipping add. Queue size:', queue.length);
        }

        const matchIndex = findBestMatch(ws);

        if (matchIndex !== -1) {
          const opponentWs = queue[matchIndex];

          const myIndex = queue.indexOf(ws);
          const indices = [myIndex, matchIndex].sort((a, b) => b - a);
          indices.forEach(i => queue.splice(i, 1));

          createLobby(ws, opponentWs);
        } else {
          ws.send(JSON.stringify({ type:'IN_QUEUE' }));
        }
        break;
      }
      case 'LEAVE_QUEUE': {
        const index = queue.indexOf(ws);
        if (index !== -1) {
          queue.splice(index, 1);
        }
        ws.send(JSON.stringify({type:'LEFT_QUEUE'}));
        break;
      }
      default: {
        console.log('[WS] Unknown message type:', data.type);
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Unknown message type.' }));
      }
    }
  });

  ws.on('close', () => {
    const player = players.get(ws);
    const index = queue.indexOf(ws);
    // If the player was in the matchmaking queue, remove them
    if (index !== -1) {
      queue.splice(index, 1);
    }

    if (player) {
      // clean up any lobbies the player was in and notify opponents if they disconnect in the middle of a match
      if (player.lobbyID) {
        const lobby = lobbies.get(player.lobbyID);
        if (lobby) {
          const opponentWs = lobby.player1 === ws ? lobby.player2.socket : lobby.player1.socket;
          opponentWs.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
          // Clean up lobby and reset opponent's lobbyId
          const opponent = players.get(opponentWs);
          if (opponent) opponent.lobbyID = null;
          lobbies.delete(player.lobbyID);
        }
      }

      players.delete(ws);
      console.log('[WS] Client disconnected. Player:', player.username || 'unknown', '| Active players:', players.size);
    } else {
      console.log('[WS] Client disconnected before authentication or without player object. Active players:', players.size);
      players.delete(ws);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));