// Warten bis gameloop.js geladen ist
if (typeof GAMELOOPJS_START === 'undefined') {
    console.error('gameloop.js muss zuerst geladen werden!');
    throw new Error('gameloop.js ist nicht verfügbar');
}

// Stetup PIXIE
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x000011
});

// Canvas in den Container einfügen
const gameContainer = document.getElementById('game-canvas-container');
if (gameContainer) {
    gameContainer.appendChild(app.view);
} else {
    document.body.appendChild(app.view);
}

// Spielvariablen
const ufoList = [];
let currentScore = 0;
let highScore = 0;

// Bilder-Pfade
const IMAGE_PATHS = {
    rocket: 'Ragnar.png',
    bullet: 'laser.png',
    ufo: 'UFO.png',
    bossUfo: 'UFOBOSS.png',
    explosion: 'explosion.png'
};

// Geladene Texturen
let textures = {};
let assetsLoaded = false;

// Highscore aus localStorage laden
try {
    if (localStorage.getItem('spaceShooterHighScore')) {
        highScore = parseInt(localStorage.getItem('spaceShooterHighScore'));
    }
} catch (e) {
    console.log('LocalStorage nicht verfügbar');
}

// Text für die Anzeige
const scoreStyle = new PIXI.TextStyle({
    fontFamily: 'Courier New',
    fontSize: 20,
    fill: 0x00ff88,
    stroke: 0x000000,
    strokeThickness: 2,
    fontWeight: 'bold'
});

// Score Anzeige erstellen
const scoreText = new PIXI.Text(`Score: ${currentScore}`, scoreStyle);
scoreText.x = 10;
scoreText.y = 10;
app.stage.addChild(scoreText);

// Highscore Anzeige erstellen
const highScoreText = new PIXI.Text(`High Score: ${highScore}`, scoreStyle);
highScoreText.x = 10;
highScoreText.y = 35;
app.stage.addChild(highScoreText);

// Punkteanzeige aktualisieren
function updateScore(points) {
    currentScore += points;
    scoreText.text = `Score: ${currentScore}`;
    
    if (currentScore > highScore) {
        highScore = currentScore;
        highScoreText.text = `High Score: ${highScore}`;
        
        try {
            localStorage.setItem('spaceShooterHighScore', highScore.toString());
        } catch (e) {
            console.log('LocalStorage nicht verfügbar');
        }
        
        highScoreText.style.fill = 0xffd700;
        setTimeout(() => {
            highScoreText.style.fill = 0x00ff88;
        }, 1000);
    }
}

function resetScore() {
    currentScore = 0;
    scoreText.text = `Score: ${currentScore}`;
}

//Nur echte Bilder laden
async function loadAssets() {
    console.log('Lade Bilder...');
    
    const loadPromises = Object.entries(IMAGE_PATHS).map(async ([key, path]) => {
        try {
            console.log(`Lade ${key} von ${path}...`);
            textures[key] = await PIXI.Texture.fromURL(path);
            console.log(`✓ ${key} erfolgreich geladen`);
            return true;
        } catch (error) {
            console.error(`✗ Fehler beim Laden von ${key}:`, error);
            throw new Error(`Bild ${key} konnte nicht geladen werden: ${path}`);
        }
    });
    
    try {
        await Promise.all(loadPromises);
        assetsLoaded = true;
        console.log('Alle Bilder erfolgreich geladen!');
        initGame();
    } catch (error) {
        console.error('Kritischer Fehler beim Laden der Bilder:', error);
        alert('Fehler: Bilder konnten nicht geladen werden. Überprüfe die Dateipfade in IMAGE_PATHS!');
        throw error;
    }
}

// Sprite Erstellungsfunktionen


//Raketen Sprite erstellen
function createRocketSprite() {
    if (!textures.rocket) {
        throw new Error('Raketen-Bild nicht geladen!');
    }
    const sprite = new PIXI.Sprite(textures.rocket);
    sprite.scale.set(0.2); // Größe anpassen
    sprite.anchor.set(0.5, 0.5);
    return sprite;
}
//Laser Sprite erstellen
function createBulletSprite() {
    if (!textures.bullet) {
        throw new Error('Laser-Bild nicht geladen!');
    }
    const sprite = new PIXI.Sprite(textures.bullet);
    sprite.scale.set(0.1); // Größe anpassen
    sprite.anchor.set(0.5, 1.1);
    return sprite;
}
//UFOs Sprite erstellen
function createUFOSprite(isLarge = false) {
    const texture = isLarge ? textures.bossUfo : textures.ufo;
    if (!texture) {
        throw new Error(`${isLarge ? 'Boss-UFO' : 'UFO'}-Bild nicht geladen!`);
    }
    const sprite = new PIXI.Sprite(texture);
    const scale = isLarge ? 0.4 : 0.3; // Größe anpassen 1. ist für Boss-UFO 2. für normales UFO
    sprite.scale.set(scale);
    sprite.anchor.set(0.5, 0.5);
    return sprite;
}

//Explosion Sprite erstellen

function createExplosionSprite() {
    if (!textures.explosion) {
        throw new Error('Explosions-Bild nicht geladen!');
    }
    const sprite = new PIXI.Sprite(textures.explosion);
    sprite.scale.set(0.3); // Größe anpassen
    sprite.anchor.set(0.3, 0.3);
    return sprite;
}

// Spielfunktionen
let rocket;

// Spiel initialisieren
function initGame() {
    console.log('Initialisiere Spiel...');
    
    // Rakete erstellen
    rocket = createRocketSprite();
    rocket.x = 400; // Mitte des Bildschirms
    rocket.y = 500;
    app.stage.addChild(rocket);
    
    console.log('Spiel initialisiert - starte Gameloop...');
    startGameLogic();
}

// Spieler Bewegung
function leftKeyPressed() {
    if (!rocket) return;
    rocket.x -= 10;
    if (rocket.x < 25) rocket.x = 25;
}

function rightKeyPressed() {
    if (!rocket) return;
    rocket.x += 10;
    if (rocket.x > app.screen.width - 25) rocket.x = app.screen.width - 25;
}

function upKeyPressed() {
    if (!rocket) return;
    rocket.y -= 10;
    if (rocket.y < 25) rocket.y = 25;
}

function downKeyPressed() {
    if (!rocket) return;
    rocket.y += 10;
    if (rocket.y > app.screen.height - 25) rocket.y = app.screen.height - 25;
}

// Schuss abgeben
function spaceKeyPressed() {
    if (!rocket) return;
    
    const bullet = createBulletSprite();
    bullet.x = rocket.x;
    bullet.y = rocket.y - 30;
    app.stage.addChild(bullet);
    flyUp(bullet, 15, 100);
    
    waitForCollision(bullet, ufoList).then(function([bullet, ufo]) {
        if (app.stage.children.includes(bullet) && app.stage.children.includes(ufo)) {
            updateScore(ufo.scoreValue || 10);
            
            const ufoIndex = ufoList.indexOf(ufo);
            if (ufoIndex > -1) {
                ufoList.splice(ufoIndex, 1);
            }
            
            app.stage.removeChild(bullet);
            app.stage.removeChild(ufo);
            
            // Explosion 
            const explosion = createExplosionSprite();
            explosion.x = ufo.x;
            explosion.y = ufo.y;
            app.stage.addChild(explosion);
            
            setTimeout(() => {
                if (app.stage.children.includes(explosion)) {
                    app.stage.removeChild(explosion);
                }
            }, 500);
        }
    });
}

// Spiellogik starten
function startGameLogic() {
    console.log('Starte Spiel-Logik...');
    
    // Normale UFOs
    gameInterval(function() {
        const ufo = createUFOSprite(false);
        ufo.x = random(25, 775);
        ufo.y = -50;
        ufo.scoreValue = 10;
        app.stage.addChild(ufo);
        ufoList.push(ufo);
        flyDown(ufo, 2);
        
        waitForCollision(rocket, ufo).then(function() {
            stopGame();
            alert(`Game Over! Dein Score: ${currentScore}\nHighscore: ${highScore}`);
            location.reload();
        });
    }, 3000);

    // Boss UFOs
    gameInterval(function() {
        const ufo = createUFOSprite(true);
        ufo.x = random(50, 750);
        ufo.y = -50;
        ufo.scoreValue = 50;
        app.stage.addChild(ufo);
        ufoList.push(ufo);
        flyDown(ufo, 1.5);
        
        waitForCollision(rocket, ufo).then(function() {
            stopGame();
            alert(`Game Over! Dein Score: ${currentScore}\nHighscore: ${highScore}`);
            location.reload();
        });
    }, 8000);

    // Spiel starten
    GAMELOOPJS_START();
}

// Assets laden und Spiel starten
console.log('app.js geladen - starte Asset-Loading...');
loadAssets();