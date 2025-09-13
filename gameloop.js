let GAMELOOPJS_SPEED = 1000 / 60;
let GAMELOOPJS_SPACE_TIMEOUT = 100;
let GAMELOOPJS_INTERVALS = [];
const GAMELOOPJS_KEY = {};


document.addEventListener('keydown', e => {
    GAMELOOPJS_KEY[e.keyCode] = true;
    // Kein Scrollen In Game
    if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', e => {
    GAMELOOPJS_KEY[e.keyCode] = false;
    // Leertaste und Pfeiltasten nicht scrollen
    if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
});

// Game Intervall
function gameInterval(fun, time) {
    let interval = setInterval(fun, time);
    GAMELOOPJS_INTERVALS.push(interval);
    return interval;
}

// Spiel stoppen
function stopGame() {
    GAMELOOPJS_INTERVALS.forEach(clearInterval);
    GAMELOOPJS_INTERVALS = [];
}

// Bewegung Funktionen
function flyUp(gameObject, speed = 10, repeat = 200) {
    let i = 0;
    let interval = gameInterval(() => {
        if (app.stage.children.includes(gameObject)) {
            gameObject.y -= speed;
            i++;
            
            if (gameObject.y < -50 || i >= repeat) {
                app.stage.removeChild(gameObject);
                clearInterval(interval);
            }
        } else {
            clearInterval(interval);
        }
    }, GAMELOOPJS_SPEED);
    return interval;
}

function flyDown(gameObject, speed = 0.5, repeat = 2000) {
    let i = 0;
    let interval = gameInterval(() => {
        if (app.stage.children.includes(gameObject)) {
            gameObject.y += speed;
            i++;
            
            if (gameObject.y > app.screen.height + 50 || i >= repeat) {
                const ufoIndex = ufoList.indexOf(gameObject);
                if (ufoIndex > -1) {
                    ufoList.splice(ufoIndex, 1);
                }
                app.stage.removeChild(gameObject);
                clearInterval(interval);
            }
        } else {
            clearInterval(interval);
        }
    }, GAMELOOPJS_SPEED);
    return interval;
}

// Kollisionsabfrage
function isColliding(object1, object2) {
    if (!app.stage.children.includes(object1) || !app.stage.children.includes(object2)) {
        return false;
    }
    
    const bounds1 = object1.getBounds();
    const bounds2 = object2.getBounds();

    return bounds1.x < bounds2.x + bounds2.width
        && bounds1.x + bounds1.width > bounds2.x
        && bounds1.y < bounds2.y + bounds2.height
        && bounds1.y + bounds1.height > bounds2.y;
}

function waitForCollision(object1, object2) {
    return new Promise((resolve) => {
        let collisionInterval = gameInterval(() => {
            if (object2 instanceof Array) {
                object2.forEach((gameObject) => {
                    if (isColliding(object1, gameObject)) {
                        clearInterval(collisionInterval);
                        resolve([object1, gameObject]);
                    }
                });
            } else {
                if (isColliding(object1, object2)) {
                    clearInterval(collisionInterval);
                    resolve([object1, object2]);
                }
            }
        }, 16);
    });
}

// Hilfsfunktion für Zufallszahlen
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Haupt-Spielschleife
function GAMELOOPJS_START() {
    let spaceKeyLocked = false;
    gameInterval(() => {
        if (GAMELOOPJS_KEY[37]) leftKeyPressed();   // Links
        if (GAMELOOPJS_KEY[39]) rightKeyPressed();  // Rechts
        if (GAMELOOPJS_KEY[38]) upKeyPressed();     // Oben
        if (GAMELOOPJS_KEY[40]) downKeyPressed();   // Unten
        if (GAMELOOPJS_KEY[32]) {                   // Leertaste
            if (!spaceKeyLocked) {
                spaceKeyPressed();
                spaceKeyLocked = true;
                setTimeout(() => {
                    spaceKeyLocked = false;
                }, GAMELOOPJS_SPACE_TIMEOUT);
            }
        }
    }, GAMELOOPJS_SPEED);
}