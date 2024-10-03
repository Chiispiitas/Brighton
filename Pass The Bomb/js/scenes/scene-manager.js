"use strict";
/* ==============================================
     Scene Manager
     Made by: David Santana
============================================== */

var sceneCurrent = "scene-title";

/* ==============================================
     Load Scene
============================================== */
function sceneLoad(scene) {
     sceneHide();
     sceneShow(scene);
     sceneCurrent = scene;
}
/* ==============================================
     Show Scene
============================================== */
function sceneShow(scene) {
     let sceneElement = document.getElementById(scene);
     sceneElement.style.opacity = 1;
     sceneElement.style.visibility = "visible";
}
/* ==============================================
     Hide Scene
============================================== */
function sceneHide() {
     let sceneElement = document.getElementById(sceneCurrent);
     sceneElement.style.opacity = 0;
     sceneElement.style.visibility = "hidden";
}