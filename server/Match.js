// Match.js
// Created: 4/24/2026
// Last Edited: 4/24/2026
// Author: John Wesley Thompson

// This file contains the Match class, which handles a single RPS game logic and data.

const Play = Object.freeze({
    ROCK: "Rock",
    PAPER: "Paper",
    SCISSORS: "Scissors"
});

class Player {
    constructor(){
        this.id = null;
        this.name = null;
        this.play = null;
    }
}

class Match {
    constructor(player1, player2){
        this.player1 = player1;
        this.player2 = player2;
        this.winner = null;
        this.winning_play = null;
        this.losing_play = null;
    }

    begin(){
        // signal to clients that the match has started
        // - show the player who they're facing
        //    - player1 needs to be sent player2's info and vice versa

        // set a timer and prepare default play for players who havent selected
        // - might need a separate classs for this because i hear making a timer is a pain in js.
        // await both responses
        // after timer ends, check player responses. If selected, evaluate, if not, set default.
    }

    evaluate(player1_play, player2_play){

        if (player1_play === player2_play){
            this.begin();
            return;
        }
        if ((player1_play === Play.ROCK && player2_play === Play.SCISSORS) ||
            (player1_play === Play.SCISSORS && player2_play === Play.PAPER) ||
            (player1_play === Play.PAPER && player2_play === Play.ROCK)){

            this.winner = this.player1
            this.winning_play = player1_play;
        } else {
            this.winner = this.player2;
            this.winning_play = player2_play;
        }

    }

    record(){
        // send necessary match data to the database
    }

}

export { Match, Player };