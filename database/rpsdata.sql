<<<<<<< HEAD
CREATE DATABASE IF NOT EXISTS RPS_PROJ;
USE RPS_PROJ;

CREATE TABLE users (
    username VARCHAR(100) UNIQUE PRIMARY KEY,
    password VARCHAR(100),
    wins INT DEFAULT 0,
    losses INT DEFAULT 0
);

CREATE TABLE games (
    match_id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    winner VARCHAR(100) REFERENCES users(username),
    loser VARCHAR(100) REFERENCES users(username)
);

CREATE TABLE rounds (
    round_id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    match_id INT REFERENCES games(match_id),
    round_win VARCHAR(50) REFERENCES users(username),
    round_lose VARCHAR(50) REFERENCES users(username),
    round_number INT,
    win_hand VARCHAR(10),
    lose_hand VARCHAR(10)
);
=======
CREATE DATABASE IF NOT EXISTS RPS_DB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE RPS_DB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  wins INT UNSIGNED NOT NULL DEFAULT 0,
  losses INT UNSIGNED NOT NULL DEFAULT 0,
  ties INT UNSIGNED NOT NULL DEFAULT 0,
  hand_most_played ENUM('Rock', 'Paper', 'Scissors') NULL,
  rocks INT UNSIGNED NOT NULL DEFAULT 0,
  papers INT UNSIGNED NOT NULL DEFAULT 0,
  scissors INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player1_id INT UNSIGNED NULL,
  player2_id INT UNSIGNED NULL,
  winner_id INT UNSIGNED NULL,
  ties INT UNSIGNED NOT NULL DEFAULT 0,
  winning_hand ENUM('Rock', 'Paper', 'Scissors') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  CONSTRAINT fk_games_player1
    FOREIGN KEY (player1_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_games_player2
    FOREIGN KEY (player2_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_games_winner
    FOREIGN KEY (winner_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS game_rounds (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNSIGNED NOT NULL,
  round_number INT UNSIGNED NOT NULL,
  player1_play ENUM('Rock', 'Paper', 'Scissors') NULL,
  player2_play ENUM('Rock', 'Paper', 'Scissors') NULL,
  winner_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_rounds_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_game_rounds_winner
    FOREIGN KEY (winner_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT uq_game_round UNIQUE (game_id, round_number)
);



SELECT * FROM users;
>>>>>>> fbb63cb22d0ba96fea256fa625a441b1ef5a7a66
