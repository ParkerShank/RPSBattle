const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket
const wss = new WebSocketServer({server}); // WebSocket server for real-time communication

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', //depending on who is running the SQL instance, we will need to make this that user's MySQL password
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

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  db.query(
    'SELECT id, username, password FROM users WHERE username = ?',
    [username],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid username or password.' });
      }

      const user = results[0];

      try {
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(400).json({ message: 'Invalid username or password.' });
        }

        res.json({
          message: 'Login successful!',
          user: {
            id: user.id,
            username: user.username
          }
        });
      } catch (error) {
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


//PARKER CODE BELOW
// WebSocket server for real-time communication
//generate random id for player
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const players = new Map(); // Map of WebSocket -> player info
wss.on('connection', (ws) => {
  console.log('New client connected');
  //player info: { id, username, wins, losses }
  players.set(ws,{
    id: generateId(),
    username: null,
    wins: 0,
    losses: 0
  })
  console.log('Client connected, total players:', players.size);
  // get player info for this connection
  const player = players.get(ws);
  console.log(player.id)

  // Listen for messages from the client
  ws.on('message', (raw) => {
    // Expecting messages in format: { type: 'REGISTER', name: 'player1' }
    const data = JSON.parse(raw);
    console.log('Received message:', data);
    // Handle different message types
    switch (data.type) {
      // For example, handle player registration
      case 'REGISTER':{
        // Update player info with username
        const player = players.get(ws);
        player.username = data.name;
        console.log('Player registered with username:', player.username);
        // Send back confirmation to client
        ws.send(JSON.stringify({ type: 'REGISTERED', id: player.id, username: player.username }));
        break;
      }
    }
    // Log all players for debugging
    for (const account of players.values()) {
      console.log('Player:', account.id, 'Username:', account.username);
    }
  })
  // Handle client disconnect
  ws.on('close', () => {
    // Remove player from map
    players.delete(ws);
    console.log('Client disconnected, total players:', players.size, 'removing player with id:', player.id);
    
  })

})
// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));