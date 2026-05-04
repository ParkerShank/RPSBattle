// Match.js
// Created: 4/24/2026
// Last Edited: 4/25/2026
// Authors: John Wesley Thompson and Parker Shanklin

// This file contains the Match class, which handles a single RPS game logic and data.

const Play = Object.freeze({
    ROCK: "Rock",
    PAPER: "Paper",
    SCISSORS: "Scissors"
});

function isValidPlay(play) {
    return typeof play === 'string' && Object.values(Play).includes(play);
}

//generate random id for player class instances
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

class Player {
    constructor(socket){
        this.ws = socket;
        this.id = generateId();
        this.username = null;
        this.wins = 0;
        this.losses = 0;
        this.hmp = 0; //Hands most played, possible to show to opponent before match starts. This is just for fun, not sure if we will actually use it.
        this.lobbyID = null; // the lobby the player is currently in, if any
    }
}

class Match {
    constructor(player1, player2){
        this.id = generateId();
        this.player1 = player1;
        this.player2 = player2;
        this.winner = null;
        this.round = 0;
        this.maxRounds = 3; // best of 3   
        this.lastChoices = {
            [player1.id]: null,
            [player2.id]: null
        };
        this.scores = {
            [player1.id]: 0,
            [player2.id]: 0
        };
        this.roundTimer = null;
        this.roundTimeLimit = 3000; // 3 sec
    }

    startRound(onTimeout){
        this.choices = {};

        this.roundTimer = setTimeout(() => {
            const play1 = this.choices[this.player1.id];
            const play2 = this.choices[this.player2.id];

            onTimeout({
                play1: play1 ?? null,
                play2: play2 ?? null
            });
        }, this.roundTimeLimit);
    }

    submitPlay(player, play){
        if (!isValidPlay(play)){
            return {error: true, message: "Invalid play."};
        }

        if (this.choices[player.id]){
            return { error: true, message: 'Already played this round' };
        }

        this.choices[player.id] = play;

        const play1 = this.choices[this.player1.id];
        const play2 = this.choices[this.player2.id];

        if (play1 && play2){
            clearTimeout(this.roundTimer);

            const result = this.evaluate(play1, play2);

            this.choices = {};
            this.round++;

            return {
                complete: true,
                play1,
                play2,
                result,
                scores: this.scores
            };
        }

        return {complete: false};
    }

    broadcast(payload){
        const msg = JSON.stringify(payload);
    
        if (this.player1.ws?.readyState === 1) {
            this.player1.ws.send(msg);
        }
    
        if (this.player2.ws?.readyState === 1) {
            this.player2.ws.send(msg);
        }
    }

    // returns false if its a tie and true otherwise
    evaluate(player1_play, player2_play){
        if (!player1_play || !player2_play) {
            return { error: true, message: 'Both player plays must be provided.' };
        }

        if (!isValidPlay(player1_play) || !isValidPlay(player2_play)) {
            return { error: true, message: 'One or both plays are invalid.' };
        }

        if (player1_play === player2_play){
            return false;
        }

        if ((player1_play === Play.ROCK && player2_play === Play.SCISSORS) ||
            (player1_play === Play.SCISSORS && player2_play === Play.PAPER) ||
            (player1_play === Play.PAPER && player2_play === Play.ROCK))
        {
            this.scores[this.player1.id]++;

        } else {
            this.scores[this.player2.id]++;
        }

        return true;
    }


    // This should probably be in the file that will use this class. (not within this class)
    // record(){
    //     // send necessary match data to the database
    // }

}

module.exports = { Match, Player };