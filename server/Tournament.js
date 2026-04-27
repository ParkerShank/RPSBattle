// Tournament.js
// Created: 4/24/2026
// Last Edited: 4/24/2026
// Author: John Wesley Thompson


import { Match, Player } from "./Match";

class Tournament {
    constructor(player_list){
        this.player_list = [...player_list];
        this.player_count = player_list.length;
        this.match_list = [];
        this.winner = null;
        this.round = 0;
    }

    begin(){
        
        while (this.player_list.length != 1){
            // throw error (for now) if the player count is not a power of 2
            // put each remaining player into a match
            while (this.player_list.length != 0){
                this.match_list.push(
                    new Match(this.player_list.shift(),
                            this.player_list.shift()
                ));
            }
            // start every match in the list
            for (const match of this.match_list){
                match.begin();
            }

            // set new remaining player values
            for (const match of this.match_list){
                this.player_list.push(match.winner);
            }
            this.match_list = [];
        }

        this.winner = this.player_list[0];
    }
}

// player queue
// - player connections
// 

// player structure
// 