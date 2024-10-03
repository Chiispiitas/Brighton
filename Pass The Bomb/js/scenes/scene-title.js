"use strict";
/* ==============================================
     Scene Title
     Made by: David Santana
============================================== */

/* ==============================================
     Add Button Listener
============================================== */
document.getElementById("btn-title-start-now").addEventListener( "click", function(){ 
     sceneLoad("scene-participants");
     if (!musicTitle.playing()) { musicTitle.play(); }
} );