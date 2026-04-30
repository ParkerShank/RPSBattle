const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket
const wss = new WebSocketServer({server}); // WebSocket server for real-time communication

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'RPS_PROJ'
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
    'SELECT username, password FROM users WHERE username = ?',
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
            username: user.username
          }
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );
});

app.post('/api/update_stats', (req, res) => {
  const {winner, loser} = req.body;

  db.query(
    'UPDATE users SET wins = wins + 1 WHERE username = ?',
    [winner],
    (err) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      db.query(
        'UPDATE users SET losses = losses + 1 WHERE username = ?',
        [loser],
        (err) => {
          if (err) {
            return res.status(500).json({message: err.message})
          }

          res.json({message: 'Stats updated!'});
        }
      );
    }
  );
});

app.post('/api/game_start', (req, res) => {
  db.query(
    'INSERT INTO games (winner, loser) VALUES (NULL, NULL)',
    (err, result) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      res.json({message: 'Game created!', match_id: result.insertId});
    }
  );
});

app.post('/api/game_update', (req, res) => {
  const { winner, loser, match_id } = req.body;

  db.query(
    'UPDATE games SET winner = ?, loser = ? WHERE match_id = ?',
    [winner, loser, match_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      res.json({message: 'Game updated!'});
    }
  );
});

app.post('/api/round_insert', (req, res) => {
  const {match_id, round_win, round_lose, round_number, win_hand, lose_hand} = req.body;

  db.query(
    'INSERT INTO rounds (match_id, round_win, round_lose, round_number, win_hand, lose_hand) VALUES (?, ?, ?, ?, ?, ?)',
    [match_id, round_win, round_lose, round_number, win_hand, lose_hand],
    (err) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      res.json({message: 'Round inserted!'});
    }
  );
});

app.get('/api/leaderboard', (req,res) => {
  db.query(
    'SELECT username, wins FROM users ORDER BY wins DESC;',
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: err.message})
      }

      res.json(results);
    }
  );
});

app.get('/api/history', (req, res) => {
  db.query(
    'SELECT * FROM games',
    (err, results) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      res.json(results);
    }
  );
});

app.get('/api/history/match/:match_id', (req,res) => {
  const { match_id } = req.params

  db.query(
    'SELECT g.match_id, g.winner, g.loser, r.round_number, r.round_win, r.round_lose, r.win_hand, r.lose_hand FROM rounds as r JOIN games as g ON r.match_id = g.match_id WHERE r.match_id = ?',
    [match_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      res.json(results);
    }
  );
});

app.get('/api/history/:username', (req,res) => {
  const { username } = req.params

  db.query(
    'SELECT * FROM games WHERE winner = ? OR loser = ?',
    [username, username],
    (err, results) => {
      if (err) {
        return res.status(500).json({message: err.message})
      }

      res.json(results);
    }
  );
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});



wss.on('connection', (ws) => {
  console.log('New client connected');


  ws.on('message', (data) => {console.log('Received message:', data.toString())
  ws.send('Hello back')
  })

  ws.on('close', () => {
    console.log('Client disconnected');
  })


})

server.listen(3001)