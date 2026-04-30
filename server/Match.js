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

//generate random id for player class instances
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

class Player {
    constructor(){
        // this.socket = null; // currently, the socket connection is stored outside of the Player class
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
        this.round = 1;
        this.maxRounds = 3; // best of 3   
        this.choices = {};
        this.scores = {};
    }
    
    async begin(){
        // signal to clients that the match has started
        // - show the player who they're facing
        //    - player1 needs to be sent player2's info and vice versa

        const player1_play = await awaitPlay(this.player1.socket);
        const player2_play = await awaitPlay(this.player2.socket);
        // set a timer and prepare default play for players who havent selected
        // - might need a separate classs for this because I hear making a timer is a pain in js.
        // await both responses
        // after timer ends, check player responses. If selected, evaluate, if not, set default.
        this.evaluate(player1_play, player2_play);
    }


    evaluate(player1_play, player2_play){

        if (player1_play === player2_play){
            this.begin();
            return;

        } else if ((player1_play === Play.ROCK && player2_play === Play.SCISSORS) ||
            (player1_play === Play.SCISSORS && player2_play === Play.PAPER) ||
            (player1_play === Play.PAPER && player2_play === Play.ROCK)){

            this.winner = this.player1
            this.winning_play = player1_play;

        } else {
            this.winner = this.player2;
            this.winning_play = player2_play;
        }
    }


    // This should probably be in the file that will use this class. (not within this class)
    // record(){
    //     // send necessary match data to the database
    // }

}


// this function recieves a message with the following json structure
// {
//      "play": "Rock" (or "Paper" or "Scissors")
// }
function awaitPlay(socket){

    return new Promise((resolve) => {
        const handler = (data) => {
            socket.off("message", handler);
            const str = data.toString();
            const json_obj = JSON.parse(str);
            
            resolve(json_obj.play);
        };

        socket.on("message", handler);
    });
}

module.exports = { Match, Player };