// Match.js
// Created: 4/24/2026
// Last Edited: 5/4/2026
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
        this.inProgress = false;
        this.maxRounds = 3; // best of 3   
        this.lastChoices = {
            [player1.id]: null,
            [player2.id]: null
        };
        this.scores = {
            [player1.id]: 0,
            [player2.id]: 0
        };
        this.roundHistory = [];
        this.roundTimer = null;
        this.forceBackTimer = null;
        this.roundTimeLimit = 5000; // 5 sec
    }

    startRound(onTimeout){
        this.choices = {};

        this.roundTimer = setTimeout(() => {
            const play1 = this.choices[this.player1.id];
            const play2 = this.choices[this.player2.id];

            onTimeout({

                play1: play1 ?? Play.ROCK,
                play2: play2 ?? Play.PAPER
            });
        }, this.roundTimeLimit);
    }

    submitPlay(player, play){
        console.log(this.round);
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

    getWinnerId(forceWinnerId = null){
        if (forceWinnerId !== null) {
            return forceWinnerId;
        }

        const player1Score = this.scores[this.player1.id] ?? 0;
        const player2Score = this.scores[this.player2.id] ?? 0;

        if (player1Score > player2Score) return this.player1.id;
        if (player2Score > player1Score) return this.player2.id;
        return null;
    }

    endMatch(options = {}){
        const {
            reason = 'completed',
            forceWinnerId = null,
            forceBackAfterMs = 30000,
            onEnd = null
        } = options;

        if (!this.inProgress) {
            return;
        }

        this.inProgress = false;
        clearTimeout(this.roundTimer);
        clearTimeout(this.forceBackTimer);
        this.choices = {};

        const winnerId = this.getWinnerId(forceWinnerId);
        this.winner = winnerId;
        this.player1.lobbyID = null;
        this.player2.lobbyID = null;

        const resultMessage = winnerId === null
            ? 'Match ended in a tie.'
            : winnerId === this.player1.id
                ? `${this.player1.username || 'Player 1'} won the match.`
                : `${this.player2.username || 'Player 2'} won the match.`;

        this.broadcast({
            type: 'MATCH_ENDED',
            matchId: this.id,
            scores: this.scores,
            winnerId,
            player1Id: this.player1.id,
            player2Id: this.player2.id,
            resultMessage,
            round: this.round,
            reason,
            forceBackAfterMs
        });

        if (typeof onEnd === 'function') {
            onEnd(this);
        }

        if (forceBackAfterMs > 0) {
            this.forceBackTimer = setTimeout(() => {
                this.broadcast({
                    type: 'FORCE_BACK_TO_DASHBOARD',
                    matchId: this.id
                });
            }, forceBackAfterMs);
        }
    }
}

module.exports = { Match, Player };