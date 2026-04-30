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