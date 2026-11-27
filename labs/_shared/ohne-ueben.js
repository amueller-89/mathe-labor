/* =============================================================
   OHNE ÜBEN (geteilt): für Labore mit "ueben": false im Steckbrief.
   Ersetzt trainer.js und profi.js: kein Rechentrainer, kein Profi-Tab.
   Stellt nur bereit, was app.js und die Admin-Anbindung erwarten.
   ============================================================= */
const KEY = LAB.id + "-labor-v1";
const prog = { c: [], f: [], unl: 0, lvl: 0, won: false }, pro = { i: 0, score: 0, errs: [], answered: false };
const PRO = [];
let task = null;
function renderLevels() {}
function newTask() {}
function drawTrain() {}
function renderPro() {}
function drawPro() {}
function updProTab() {}
const proVisible = () => false, proLocked = () => false;
