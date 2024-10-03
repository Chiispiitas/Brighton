"use strict";
/* ==============================================
     Database
     Made by: David Santana
============================================== */

var dictionary = defaultDictionary;
var letters = defaultLetters;
var participantsHash = {};
var participantsArray = [];
var participantsCounter = 0;
var usedWords = [];
var usedLetters = [];

/* ==============================================
     Participant Class
============================================== */
function Participant(name) {
     this.name = name;
     this.lives = 1; // change this
}
/* ==============================================
     Participant Hash to Array
============================================== */
function participantHashToArray() {
     for (let key in participantsHash) {
          participantsArray.push(new Participant(participantsHash[key]));
     }
}
/* ==============================================
     Count Element In Array
============================================== */
function countArray(array, element) {
     var count = 0;
     for(var i = 0; i < array.length; ++i){
         if(array[i] == element)
             count++;
     }
     return count;
}