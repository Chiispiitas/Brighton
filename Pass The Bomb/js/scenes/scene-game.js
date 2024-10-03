"use strict";
/* ==============================================
     Scene Skill
     Made by: David Santana
============================================== */

const textYoureUp = document.getElementById("text-youre-up");
const containerLetters = document.getElementById("container-letters");
const rangeTime = document.getElementById("range-time");
const inputWord = document.getElementById("input-word");
const listPlayers = document.getElementById("list-players");
const overlay = document.getElementById("screen-overlay");
var gameActive = false;
var gamePaused = false;
var roundBaseTime = 3000;
var roundMaxTime = 0;
var roundTime = 0;
var roundStreak = 0;
var rounds = 0;
var currentParticipantIndex = -1;
var currentParticipantName = "";
var lettersString = "";
var lettersPool = [];
var typedLetters = {};

/* ==============================================
     Add Button Listeners
============================================== */
document.getElementById("listener-game").addEventListener( "click", function(){ 
     toggleGamePause(); 
});
/* ==============================================
     Add Input Listener
============================================== */
inputWord.addEventListener("keydown", function(event) {
     if (event.code === "Enter") {
          if (validateInputWord()) {
               usedWords.push(inputWord.value.toLowerCase());
               inputWord.value = "";
               soundBell.play();
               nextRound(); 
          }
          else {
               soundBuzzer.play();
               inputWord.value = "";
               drawInput();
          }
     }
     else {
          let pitch = inputWord.value.length + 1;
          if (pitch > 20) { pitch = 20; }
          eval(`soundKey${pitch}.play()`);
          drawInput();
     }
});
/* ==============================================
     Start Game
============================================== */
function startGame() {
     musicGame.play();
     gameActive = true;
     currentParticipantIndex = -1;
     roundStreak = 0;
     nextRound();
}
/* ==============================================
     Create Players List
============================================== */
function createPlayersList() {
     listPlayers.innerHTML = "";
     participantsArray.forEach(i => {
          listPlayers.innerHTML += generatePlayerElement(i);
     });
}
/* ==============================================
     Generate Player Element
============================================== */
function generatePlayerElement(participant) {
     let content = participant.name;
     if (participant.lives == 3) {
          content += " 💙💙💙";
     }
     else if (participant.lives == 2) {
          content += " 💙💙🤍";
     }
     else if (participant.lives == 1) {
          content += " 💙🤍🤍";
     }
     else {
          content += " 🤍🤍🤍";
     }
     if (participant == participantsArray[currentParticipantIndex]) {
          return `<p class="current-participant">${content}</p>`;
     }
     else {
          return `<p>${content}</p>`;
     }
}
/* ==============================================
     Validate Input Word
============================================== */
function validateInputWord() {
     let word = inputWord.value.toLowerCase();
     return (word.match(getValidationRegex()) && !usedWords.includes(word) && dictionary.includes(word));
}
/* ==============================================
     Get Validation Regex
============================================== */
function getValidationRegex() {
     return new RegExp(`[${lettersString}]`, "gi");
}
/* ==============================================
     Draw Input
============================================== */
function drawInput() {
     setTimeout(function() {
          let untypedLetters = getUntypedLetters();
          let requiredLetters = lettersString.split("");
          containerLetters.innerHTML = "";
          inputWord.value.split("").forEach(i => {
               if (requiredLetters.includes(i) && (countArray(untypedLetters, i) < countArray(requiredLetters, i))) {
                    addItemLetter(i, "item-required-letter typed");
                    requiredLetters.splice(requiredLetters.indexOf(i), 1);
               }
               else {
                    addItemLetter(i, "item-letter");
               }  
          })
          untypedLetters.forEach(i => {
               addItemLetter(i, "item-required-letter");
          })
     }, 1)
}
/* ==============================================
     Add Item Letter
============================================== */
function addItemLetter(word, type) {
     let resizeLength = inputWord.value.length - 17;
     if (resizeLength < 0) {
          var style = `width: 1.6rem; height: 2.8rem; font-size: 1.6rem;`
     }
     else {
          let width = 1.6 - ((0.08 - (0.00147 * resizeLength)) * resizeLength);
          let height = 2.8 - (0.01 * resizeLength);
          let fontSize = 1.6 - ((0.08 - (0.00147 * resizeLength)) * resizeLength);
          var style = `width: ${width}rem; height: ${height}rem; font-size: ${fontSize}rem;`
     }
     containerLetters.innerHTML += `<div class="${type}" style="${style}">${word}</div>`;
}
/* ==============================================
     Get Untyped Letters
============================================== */
function getUntypedLetters() {
     let result = [];
     let count = 1;
     typedLetters = {};
     lettersString.split("").forEach(i => {
          count = (typedLetters[i]) ? typedLetters[i] : 1;
          if (countArray(inputWord.value.split(""), i) < count) { result.push(i); }
          if (typedLetters[i]) { typedLetters[i] += 1 } else { typedLetters[i] = 2 }
     })
     return result;
}
/* ==============================================
     Update Game
============================================== */
var updateGame = setInterval(function() { 
     if (!gameActive) { return; }
     updateGameGraphics();
     updateGameClock();
     updateInput();
}, 1);
/* ==============================================
     Update Input
============================================== */
function updateInput() {
     inputWord.value = inputWord.value.replace(" ", "").toLowerCase();
     inputWord.focus();
}
/* ==============================================
     Update Game Graphics
============================================== */
function updateGameGraphics() {
     rangeTime.style.width = `${(roundMaxTime - roundTime) / roundMaxTime * 200}%`;
     rangeTime.style.backgroundColor = getRangeTimeColor();
}
/* ==============================================
     Get Range Time Color
============================================== */
function getRangeTimeColor() {
     let progress = (roundMaxTime - roundTime) / roundMaxTime * 100;
     if (gamePaused) {
          return "rgb(200, 200, 200)" // Gray
     }
     else if (progress > 40) { 
          return "rgb(111, 224, 111)" // Green
     } 
     else {
          return "rgb(255, 226, 62)" // Yellow
     }
}
/* ==============================================
     Animation Explosion
============================================== */
const delay = ms => new Promise(res => setTimeout(res, ms));
const animationExplosion = async () => {
    overlay.classList.remove("explosion");
    await delay(1);
    overlay.classList.add("explosion");
};
/* ==============================================
     Update Game Clock
============================================== */
function updateGameClock() {
     if (gamePaused) { return; }
     roundTime += 1
     if (roundTime == roundMaxTime) { loseRound(); }
}
/* ==============================================
     Next Round
============================================== */
function nextRound() {
     getDifficulty();
     getMusic();
     getRoundMaxTime();
     roundTime = 0;
     rounds += 1;
     roundStreak += 1;
     advanceParticipant();
     updateTextYoureUp();
     generateLetters();
     createPlayersList();
     //toggleGamePause();
}
/* ==============================================
     Get Difficulty
============================================== */
function getDifficulty() {
     /*if (rounds > 25) {
          roundBaseTime = 1800;
          lettersPool = letters.hard;
     }
     else if (rounds > 15) {
          roundBaseTime = 2400;
          lettersPool = letters.medium;
     }
     else {
          roundBaseTime = 3000;
          lettersPool = letters.easy;
     }*/

     roundBaseTime = 3000;
     lettersPool = letters.easy;
}
/* ==============================================
     Get Music
============================================== */
function getMusic() {
     if (rounds == 26) {
          musicGame.rate(1.25);
     }
     else if (rounds == 16) {
          musicGame.rate(1.1);
     }
}
/* ==============================================
     Get Round Maximum Time
============================================== */
function getRoundMaxTime() {
     roundMaxTime = roundBaseTime - (100 * roundStreak);
     if (roundMaxTime < 400) { roundMaxTime = 400; }
}
/* ==============================================
     Advance Participant Index
============================================== */
function advanceParticipant() {
     currentParticipantIndex += 1
     if (currentParticipantIndex > participantsArray.length - 1) { currentParticipantIndex = 0; }
     currentParticipantName = participantsArray[currentParticipantIndex].name + "!";
     if (participantsArray[currentParticipantIndex].lives == 0) { advanceParticipant(); }
}
/* ==============================================
     Update Text You're Up
============================================== */
function updateTextYoureUp() {
     textYoureUp.textContent = currentParticipantName;
}
/* ==============================================
     Generate Letters
============================================== */
function generateLetters() {
     containerLetters.innerHTML = "";
     lettersString = lettersPool[Math.floor(Math.random() * lettersPool.length)];
     if (usedLetters.at(-1) == lettersString || countArray(usedLetters, lettersString) > 5) { 
          generateLetters();
     }
     else {
          usedLetters.push(lettersString);
          drawInput();
     }
}
/* ==============================================
     Lose Round
============================================== */
function loseRound() {
     roundStreak = 0;
     getDifficulty();
     getMusic();
     animationExplosion();
     getRoundMaxTime();
     roundTime = 0;
     rounds += 1;
     loseParticipant();
     advanceParticipant();
     updateTextYoureUp();
     generateLetters();
     inputWord.value = ""
     createPlayersList();
     //toggleGamePause();
}
/* ==============================================
     Lose Participant
============================================== */
function loseParticipant() {
     participantsArray[currentParticipantIndex].lives -= 1;
     if (participantsArray[currentParticipantIndex].lives == 0) { soundExplosion.play(); }
     if (countEliminated() == participantsArray.length - 1) {
          advanceParticipant();
          gameActive = false;
          musicGame.stop();
          let winner = participantsArray[currentParticipantIndex]
          document.getElementById("text-winner").textContent = `${winner.name} wins!`;
          sceneLoad("scene-results");
     }
}
/* ==============================================
     Get Winner
============================================== */
function getWinner() {
     participantsArray.forEach(i => {
          if (i.lives != 0) { return i; }
     });
}
/* ==============================================
     Count Eliminated Players
============================================== */
function countEliminated() {
     let count = 0;
     participantsArray.forEach(i => {
          if (i.lives == 0) { count += 1; }
     });
     return count;
}
/* ==============================================
     Toggle Game Pause
============================================== */
function toggleGamePause() {
     gamePaused = !gamePaused;
     inputWord.disabled = !inputWord.disabled;
}