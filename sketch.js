"option strict";

const NORTH = 1;
const EAST = 2;
const SOUTH = 4;
const WEST = 8;
const ISLAND = 16;
const PILL = 32;
const POWERUP = 64;
const BASE = 128;

let mapWidth = 27;
let mapHeight = 23;
let map;

let pilltile;
let poweruptill;
let walltiles = [];
let basetiles = [];
let pacmans = [];
let poweredpacmans = [];
let whiteghost;

let palette = {
    background: { r: 0, g: 0, b: 64 },
    walls: { r: 0, g: 128, b: 0 },
    pills: { r: 0, g: 128, b: 255 },
    base: { r: 128, g: 0, b: 0 },
    pacman: { r: 192, g: 192, b: 0 },
    powerup: { r: 64, g: 192, b: 255 }
};

let pillsound, explosionsound, powerupsound, capturesound;

let player;
let ghosts = [];

let framerateStack = [];
let showPaths = false;

function preload() {  /* P5 DEFINED FUNCTION */

    for (let i = 0; i < 16; i++) {
        walltiles.push(loadImage("gfx/" + i + ".png"));
    }

    pilltile = loadImage("gfx/pill.png");
    poweruptile = loadImage("gfx/powerup.png");

    for (let i = 97; i <= 104; i++) {
        basetiles.push(loadImage("gfx/" + String.fromCharCode(i) + ".png"));
    }

    for (let i = 0; i < 4; i++) {
        pacmans.push(loadImage("gfx/pacman" + i + ".png"));
        poweredpacmans.push(loadImage("gfx/pacman" + i + ".png"));
    }

    whiteghost = loadImage("gfx/ghost.png");

    soundFormats('wav');

    pillsound = loadSound("snd/pill.wav");
    explosionsound = loadSound("snd/explosion.wav");
    powerupsound = loadSound("snd/powerup.wav");
    capturesound = loadSound("snd/capture.wav");

}

function generateMap() {

    const traverse = (x, y, history = null) => {

        let final = history === null;

        if (history === null) {
            history = [];
            for (let i = 0; i < mapWidth; i++) {
                row = [];
                for (let j = 0; j < mapHeight; j++) {
                    row.push(false);
                }
                history.push(row);
            }
        }

        history[x][y] = true;

        if (x > 0 && map[x - 1][y] === 0 && !history[x - 1][y]) traverse(x - 1, y, history);
        if (y > 0 && map[x][y - 1] === 0 && !history[x][y - 1]) traverse(x, y - 1, history);
        if (x < mapWidth - 1 && map[x + 1][y] === 0 && !history[x + 1][y]) traverse(x + 1, y, history);
        if (y < mapHeight - 1 && map[x][y + 1] === 0 && !history[x][y + 1]) traverse(x, y + 1, history);

        if (final) {

            let traversedCount = 0;
            let totalCount = 0;
            for (let x = 0; x < mapWidth; x++) {
                for (let y = 0; y < mapHeight; y++) {
                    if (map[x][y] === 0) {
                        totalCount++;
                        if (history[x][y]) traversedCount++;
                    }
                }
            }

            return traversedCount / totalCount;

        }

    }

    // CLEAR MAP

    map = [];
    for (let i = 0; i < mapWidth; i++) {
        row = [];
        for (let j = 0; j < mapHeight; j++) {
            row.push(0);
        }
        map.push(row);
    }

    // MAP EDGES

    for (let x = 1; x < mapWidth - 1; x++) {
        map[x][0] = SOUTH | EAST | WEST;
        map[x][mapHeight - 1] = NORTH | EAST | WEST;
    }
    for (let y = 0; y < mapHeight - 1; y++) {
        map[0][y] = EAST | NORTH | SOUTH;
        map[mapWidth - 1][y] = WEST | NORTH | SOUTH;
    }

    // MAP CORNERS

    map[0][0] = EAST | SOUTH;
    map[mapWidth - 1][0] = WEST | SOUTH;
    map[0][mapHeight - 1] = EAST | NORTH;
    map[mapWidth - 1][mapHeight - 1] = WEST | NORTH;

    // ADD PILLARS EVERY 2 SPACES

    for (let x = 2; x < mapWidth - 2; x += 2) {
        for (let y = 2; y < mapHeight - 2; y += 2) {
            map[x][y] = NORTH | SOUTH | EAST | WEST;
        }
    }

    // ADD CENTRAL BASE

    let u = floor(mapWidth / 2);
    let v = floor(mapHeight / 2);
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            map[u + i][v + j] = BASE;
        }
    }

    // ADD RANDOMISED WALLS

    for (let i = 0; i < mapWidth * mapHeight; i++) {

        let x = floor(random(1, mapWidth / 2 - 1));
        let y = floor(random(1, mapHeight - 1));

        if (map[x][y] !== 0) continue;

        map[x][y] = NORTH | SOUTH | EAST | WEST;
        map[mapWidth - 1 - x][y] = map[x][y];

        let invalid = false;

        // ...INVALID IF CAUSES A DEAD END

        if (!invalid) {
            for (let u = -1; u <= 1; u++) {
                for (let v = -1; v <= 1; v++) {
                    if (map[x + u][y + v] !== 0) continue;
                    let directions = 0;
                    if (x + u < mapWidth - 1 && map[x + u + 1][y + v] === 0) directions++;
                    if (x + u > 0 && map[x + u - 1][y + v] === 0) directions++;
                    if (y + v < mapHeight - 1 && map[x + u][y + v + 1] === 0) directions++;
                    if (y + v > 0 && map[x + u][y + v - 1] === 0) directions++;
                    if (directions === 1) {
                        invalid = true;
                    }
                }
            }
        }

        // ...INVALID IF MAP NOT TRAVERSABLE ANY MORE

        if (!invalid) {
            let t = traverse(1, 1);
            if (t < 1) invalid = true;
        }

        // IF INVALID, RESET BEFORE TRYING AGAIN

        if (invalid) {
            map[x][y] = 0;
            map[mapWidth - 1 - x][y] = 0;
        }

    }

    // ADD PILLS, INCLUDING CENTRAL LOOP

    for (let i = 1; i < mapWidth - 1; i++) {
        for (let j = 1; j < mapHeight - 1; j++) {
            if (map[i][j] === 0 ||
                abs(u - i) === 2 && abs(v - j) <= 2 ||
                abs(u - i) <= 2 && abs(v - j) === 2) {
                map[i][j] = PILL;
            }
        }
    }

    // ADD POWERUPS

    for (let i = 1; i < mapWidth / 2; i += 12) {
        for (let j = 5; j < mapHeight / 2; j += 8) {
            if (map[i][j] === PILL) map[i][j] = POWERUP;
            if (map[i][mapHeight - j - 1] === PILL) map[i][mapHeight - j - 1] = POWERUP;
            if (map[mapWidth - i - 1][j] === PILL) map[mapWidth - i - 1][j] = POWERUP;
            if (map[mapWidth - i - 1][mapHeight - j - 1] === PILL) map[mapWidth - i - 1][mapHeight - j - 1] = POWERUP;
        }
    }


    // EDGE FIXES

    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            if (map[x][y] !== 0) {
                if (x < mapWidth - 1 && map[x + 1][y] % 16 === 0) map[x][y] = map[x][y] & ~EAST;
                if (x > 0 && map[x - 1][y] % 16 === 0) map[x][y] = map[x][y] & ~WEST;
                if (y < mapHeight - 1 && map[x][y + 1] % 16 === 0) map[x][y] = map[x][y] & ~SOUTH;
                if (y > 0 && map[x][y - 1] % 16 === 0) map[x][y] = map[x][y] & ~NORTH;
                if (map[x][y] === 0) map[x][y] = ISLAND;
            }
        }
    }

    // CREATE ISLANDS

    for (let x = 1; x < mapWidth - 1; x++) {
        for (let y = 1; y < mapHeight - 1; y++) {
            if (map[x][y] === PILL) {
                if (map[x + 1][y] === PILL && map[x][y + 1] === PILL && map[x - 1][y] === PILL && map[x][y - 1] === PILL &&
                    map[x + 1][y + 1] === PILL && map[x - 1][y + 1] === PILL && map[x - 1][y + 1] === PILL && map[x - 1][y - 1] === PILL) {
                    map[x][y] = ISLAND;
                }
            }
        }
    }

    // JOIN ISLANDS

    for (let x = 1; x < mapWidth - 1; x++) {
        for (let y = 1; y < mapHeight - 1; y++) {
            if (map[x][y] === PILL) {
                if (map[x + 1][y] === ISLAND && map[x][y + 1] === PILL && map[x - 1][y] === ISLAND && map[x][y - 1] === PILL &&
                    map[x + 1][y + 1] === PILL && map[x - 1][y + 1] === PILL && map[x - 1][y + 1] === PILL && map[x - 1][y - 1] === PILL) {
                    map[x][y] = EAST | WEST;
                    map[x + 1][y] = WEST;
                    map[x - 1][y] = EAST;
                }
                if (map[x + 1][y] === PILL && map[x][y + 1] === ISLAND && map[x - 1][y] === PILL && map[x][y - 1] === ISLAND &&
                    map[x + 1][y + 1] === PILL && map[x - 1][y + 1] === PILL && map[x - 1][y + 1] === PILL && map[x - 1][y - 1] === PILL) {
                    map[x][y] = NORTH | SOUTH;
                    map[x][y + 1] = NORTH;
                    map[x][y - 1] = SOUTH;
                }
            }
        }
    }

    player = {
        position: createVector(1, 1),
        target: createVector(2, 1),
        progress: 0,
        speed: 5,
        direction: EAST,
        nextDirection: EAST,
        directionChangeBehaviour: null,
        powerup: 0,
        path: [],
        destination: null,
        stuck: 0
    }
}

function recolour(image, rgb) {
    image.loadPixels();
    for (let i = 0; i < 4 * image.width * image.height; i += 4) {
        image.pixels[i] = image.pixels[i] * rgb.r / 256;
        image.pixels[i + 1] = image.pixels[i + 1] * rgb.g / 256;
        image.pixels[i + 2] = image.pixels[i + 2] * rgb.b / 256;
    }
    image.updatePixels();
}

function recolourGhost(entity) {

    let r, g, b;
    switch (entity.directionChangeBehaviour) {
        case 1: r = 0; g = 255; b = 255; break;
        case 2: r = 255; g = 128; b = 0; break;
        case 3: r = 255; g = 0; b = 255; break;
        case 4: r = 255; g = 0; b = 0; break;
        case 5: r = 128; g = 128; b = 255; break;
    }

    entity.image = createImage(whiteghost.width, whiteghost.height);
    entity.image.copy(whiteghost,
        0, 0, whiteghost.width, whiteghost.height,
        0, 0, whiteghost.width, whiteghost.height);

    recolour(entity.image, { r, g, b });

}

function generateGhosts() {

    ghosts = [];

    for (let z = 0; z < floor(mapWidth * mapHeight) / 100 + 1; z++) {

        let x, y;
        do {
            x = floor(random(1, mapWidth - 1));
            y = floor(random(1, mapHeight - 1));
        } while (map[x][y] !== PILL ||
            abs(x - player.position.x) < 4 &&
            abs(y - player.position.y) < 4);

        let d, dx, dy;
        do {
            switch (floor(random(0, 4))) {
                case 0: d = NORTH; dx = 0; dy = -1; break;
                case 1: d = EAST; dx = 1; dy = 0; break;
                case 2: d = SOUTH; dx = 0; dy = 1; break;
                case 3: d = WEST; dx = -1; dy = 0; break;
            }
        } while (map[x + dx][y + dy] !== PILL);

        let t = floor(random(1, 6));

        let newGhost = {
            image: null,
            position: createVector(x, y),
            target: createVector(x + dx, y + dy),
            progress: 0,
            speed: 2 + random(0, 2),
            direction: d,
            nextDirection: d,
            directionChangeBehaviour: t,
            powerup: 0,
            path: [],
            destination: null,
            stuck: 0
        };

        recolourGhost(newGhost);

        ghosts.push(newGhost);

    }

}

function windowResized() {  /* P5 DEFINED FUNCTION */

    resizeCanvas(windowWidth, windowHeight);

}

function setup() {  /* P5 DEFINED FUNCTION */

    p5.disableFriendlyErrors = true;
    createCanvas(windowWidth, windowHeight, P2D);
    frameRate(60);

    for (let w of walltiles) recolour(w, palette.walls);
    recolour(pilltile, palette.pills);
    recolour(poweruptile, palette.powerup);
    for (let b of basetiles) recolour(b, palette.base);
    for (let p of pacmans) recolour(p, palette.pacman);

    generateMap();
    generateGhosts();

}

function keyPressed() {  /* P5 DEFINED FUNCTION */

    if (keyIsDown(CONTROL)) {
        if (keyCode === LEFT_ARROW) {
            mapWidth -= 4;
            if (mapWidth < 15) mapWidth = 15;
            generateMap();
            generateGhosts();
        } else if (keyCode === RIGHT_ARROW) {
            mapWidth += 4;
            generateMap();
            generateGhosts();
        } else if (keyCode === UP_ARROW) {
            mapHeight -= 4;
            if (mapHeight < 11) mapHeight = 11;
            generateMap();
            generateGhosts();
        } else if (keyCode === DOWN_ARROW) {
            mapHeight += 4;
            generateMap();
            generateGhosts();
        } else if (keyCode === 32) {
            generateMap();
            generateGhosts();
        }
    }

    if (keyCode === 80) showPaths = !showPaths;

}

function draw() {  /* P5 DEFINED FUNCTION */

    /* PRE-FRAME */

    if (framerateStack.length > 30) framerateStack.shift();
    framerateStack.push(frameRate());
    let averageFPS = 0;
    for (let f of framerateStack) averageFPS += f;
    averageFPS /= framerateStack.length;

    /* INPUTS */

    inputs();

    /* PROCESSES */

    processes();

    /* OUTPUTS */

    outputs();

    /* POST-FRAME */

    textAlign(LEFT, TOP);
    textSize(18);
    fill(255, 255, 255);
    text(floor(averageFPS) + " FPS", 10, 10);

}

function inputs() {

    if (player === null) return;

    if (!keyIsDown(CONTROL)) {
        if (player.target.x > 0 && player.target.x < mapWidth - 1 && player.target.y > 0 && player.target.y < mapHeight - 1) {
            if (keyIsDown(LEFT_ARROW) && (map[player.target.x - 1][player.target.y] === 0 || map[player.target.x - 1][player.target.y] === PILL)) {
                player.nextDirection = WEST;
            } else if (keyIsDown(RIGHT_ARROW) && (map[player.target.x + 1][player.target.y] === 0 || map[player.target.x + 1][player.target.y] === PILL)) {
                player.nextDirection = EAST;
            } else if (keyIsDown(UP_ARROW) && (map[player.target.x][player.target.y - 1] === 0 || map[player.target.x][player.target.y - 1] === PILL)) {
                player.nextDirection = NORTH;
            } else if (keyIsDown(DOWN_ARROW) && (map[player.target.x][player.target.y + 1] === 0 || map[player.target.x][player.target.y + 1] === PILL)) {
                player.nextDirection = SOUTH;
            }
        }
    }

}

function processes() {

    let entityMap = [];
    for (let i = 0; i < mapWidth; i++) {
        row = [];
        for (let j = 0; j < mapHeight; j++) {
            row.push(0);
        }
        entityMap.push(row);
    }

    const processEntity = (entity) => {

        entity.progress += entity.speed * (deltaTime / 1000);

        if (entity === player && entity.progress >= 0.5) {

            if (map[entity.target.x][entity.target.y] === PILL) {
                pillsound.play();
                map[entity.target.x][entity.target.y] = 0;
            }

            if (map[entity.target.x][entity.target.y] === POWERUP) {
                map[entity.target.x][entity.target.y] = 0;
                powerupsound.play();
                player.powerup = 5;
            }

        }

        let directionChange = false;

        if (entity !== player && (entity.directionChangeBehaviour === 5 || entity.directionChangeBehaviour === 6) && entity.destination !== null) {

            if (entity.stuck > 30) {

                entity.destination = null;
                entity.stuck = 0;
                directionChange = true;

            } else if (entity.target.x === entity.destination.x && entity.target.y === entity.destination.y) {

                if (entity.directionChangeBehaviour === 6) {

                    entity.directionChangeBehaviour = floor(random(1, 6));
                    entity.speed = 2 + random(0, 2);

                    recolourGhost(entity);

                }
                entity.destination = null;
                entity.progress = 1;
                entity.path = [];
                directionChange = true;

            }

        }

        if (entity.progress >= 1) {
            entity.progress -= 1;
            entity.position.x = entity.target.x;
            entity.position.y = entity.target.y;

            if (entity.target.x > 0 && entity.target.x < mapWidth - 1 && entity.target.y > 0 && entity.target.y < mapHeight - 1) {

                const solid = (x) => !(x === 0 || x === PILL || x === POWERUP || x === BASE && entity !== player);

                let northClear = !solid(map[entity.target.x][entity.target.y - 1]) &&
                    (entity === player || !entityMap[entity.target.x][entity.target.y - 1] || entity.directionChangeBehaviour === 6);
                let eastClear = !solid(map[entity.target.x + 1][entity.target.y]) &&
                    (entity === player || !entityMap[entity.target.x + 1][entity.target.y] || entity.directionChangeBehaviour === 6);
                let southClear = !solid(map[entity.target.x][entity.target.y + 1]) &&
                    (entity === player || !entityMap[entity.target.x][entity.target.y + 1] || entity.directionChangeBehaviour === 6);
                let westClear = !solid(map[entity.target.x - 1][entity.target.y]) &&
                    (entity === player || !entityMap[entity.target.x - 1][entity.target.y] || entity.directionChangeBehaviour === 6);

                if (entity.directionChangeBehaviour !== null &&
                    (entity.nextDirection === NORTH & !northClear ||
                        entity.nextDirection === EAST & !eastClear ||
                        entity.nextDirection === SOUTH & !southClear ||
                        entity.nextDirection === WEST & !westClear)) {
                    directionChange = true;
                }

                if (entity.directionChangeBehaviour > 1) {
                    let paths = (northClear ? 1 : 0) + (eastClear ? 1 : 0) + (southClear ? 1 : 0) + (westClear ? 1 : 0);
                    if (paths > 2) directionChange = true;
                }

                if (entity.directionChangeBehaviour <= 3 && directionChange && entity.directionChangeBehaviour !== null) {

                    let d, dx, dy, oneeighty = false, tries = 0;
                    do {

                        tries++;

                        if (tries >= 30) {
                            northClear = false;
                            eastClear = false;
                            southClear = false;
                            westClear = false;
                            break;
                        }

                        switch (floor(random(0, 4))) {
                            case 0: d = NORTH; dx = 0; dy = -1; break;
                            case 1: d = EAST; dx = 1; dy = 0; break;
                            case 2: d = SOUTH; dx = 0; dy = 1; break;
                            case 3: d = WEST; dx = -1; dy = 0; break;
                        }

                        if (entity.directionChangeBehaviour === 3) {
                            if (tries <= 15) {
                                oneeighty =
                                    d === NORTH && entity.nextDirection === SOUTH ||
                                    d === EAST && entity.nextDirection === WEST ||
                                    d === SOUTH && entity.nextDirection === NORTH ||
                                    d === WEST && entity.nextDirection === EAST;
                            } else {
                                oneeighty = false;
                            }
                        }

                    } while (oneeighty || !(map[entity.position.x + dx][entity.position.y + dy] === PILL ||
                        map[entity.position.x + dx][entity.position.y + dy] === 0) || entityMap[entity.target.x + dx][entity.target.y + dy]);

                    entity.progress = 0;
                    entity.nextDirection = d;
                }

                if (entity.directionChangeBehaviour === 4) {
                    if (player === null) {
                        entity.directionChangeBehaviour = 3;
                        entity.path = [];
                    } else {
                        entity.destination = createVector(player.target.x, player.target.y);
                    }
                }

                if ((entity.directionChangeBehaviour === 5 || entity.directionChangeBehaviour === 6) && entity.destination === null) {
                    let powerups = [];
                    for (let x = 0; x < mapWidth; x++) {
                        for (let y = 0; y < mapHeight; y++) {
                            if (map[x][y] === POWERUP) {
                                powerups.push({ x, y });
                            }
                        }
                    }
                    if (powerups.length < 2) {
                        entity.directionChangeBehaviour = 1;
                    } else {
                        let r = floor(random(0, powerups.length));
                        entity.destination = createVector(powerups[r].x, powerups[r].y);
                    }
                }

                if (directionChange && (entity.directionChangeBehaviour === 4 || entity.directionChangeBehaviour === 5 || entity.directionChangeBehaviour === 6)) {

                    if (entity.destination !== null) {

                        let current = {
                            x: entity.position.x,
                            y: entity.position.y,
                            h: abs(entity.destination.x - entity.position.x) + abs(entity.destination.y - entity.position.y),
                            g: 0,
                            from: null,
                            processed: false,
                            final: true
                        };
                        entity.path = [current];

                        let maxPathLength = 1000;

                        while (!(current.x === entity.destination.x && current.y === entity.destination.y)
                            && entity.path.length < maxPathLength) {

                            let dx, dy;
                            for (let d = 0; d < 4; d++) {
                                switch (d) {
                                    case 0: dx = 1; dy = 0; break;
                                    case 1: dx = 0; dy = 1; break;
                                    case 2: dx = -1; dy = 0; break;
                                    case 3: dx = 0; dy = -1; break;
                                }

                                if (current.x + dx > 0 && current.x + dx < mapWidth - 1 &&
                                    current.y + dy > 0 && current.y + dy < mapHeight - 1 &&
                                    !solid(map[current.x + dx][current.y + dy])
                                    && (!(entityMap[current.x + dx][current.y + dy] && entity.directionChangeBehaviour === 4) ||
                                        current.x + dx === entity.destination.x && current.y + dy === entity.destination.y)) {

                                    let newNode = {
                                        x: current.x + dx,
                                        y: current.y + dy,
                                        h: abs(entity.destination.x - (current.x + dx)) + abs(entity.destination.y - (current.y + dy)),
                                        g: current.g + 1,
                                        from: current,
                                        processed: false,
                                        final: false
                                    };

                                    let duplicate = false
                                    for (let node of entity.path) {
                                        if (node.x === newNode.x && node.y === newNode.y) {
                                            if (!node.processed && newNode.g < node.g) {
                                                node.g = newNode.g;
                                                node.from = current;
                                            }
                                            duplicate = true;
                                            break;
                                        }
                                    }

                                    if (!duplicate) {
                                        entity.path.push(newNode);
                                    }

                                }

                            }

                            current.processed = true;

                            let best = mapWidth + mapHeight;
                            let last = current;

                            for (let node of entity.path) {
                                if (node.processed) continue;
                                if (node.h + node.g < best) {
                                    best = node.h + node.g;
                                    current = node;
                                }
                            }

                            if (current === last) {
                                break;
                            }

                        }

                        current.final = true;
                        if (entity.path.length > 1) {
                            while (current.from.from !== null) {
                                current = current.from;
                                current.final = true;
                            }
                        }

                        entity.nextDirection = null;
                        if (current.x < entity.position.x) entity.nextDirection = WEST;
                        else if (current.x > entity.position.x) entity.nextDirection = EAST;
                        else if (current.y < entity.position.y) entity.nextDirection = NORTH;
                        else if (current.y > entity.position.y) entity.nextDirection = SOUTH;


                    }
                }

                if (entity.nextDirection === NORTH) {
                    if (northClear) {
                        entity.stuck = 0;
                        entity.target.y--;
                        entity.direction = entity.nextDirection;
                    } else {
                        entity.stuck++;
                        entity.progress = 1;
                        entity.nextDirection = entity.direction;
                    }
                } else if (entity.nextDirection === EAST) {
                    if (eastClear) {
                        entity.stuck = 0;
                        entity.target.x++;
                        entity.direction = entity.nextDirection;
                    } else {
                        entity.stuck++;
                        entity.progress = 1;
                        entity.nextDirection = entity.direction;
                    }
                } else if (entity.nextDirection === SOUTH) {
                    if (southClear) {
                        entity.stuck = 0;
                        entity.target.y++;
                        entity.direction = entity.nextDirection;
                    } else {
                        entity.stuck++;
                        entity.progress = 1;
                        entity.nextDirection = entity.direction;
                    }
                } else if (entity.nextDirection === WEST) {
                    if (westClear) {
                        entity.stuck = 0;
                        entity.target.x--;
                        entity.direction = entity.nextDirection;
                    } else {
                        entity.stuck++;
                        entity.progress = 1;
                        entity.nextDirection = entity.direction;
                    }
                }
            }
        }
    }

    for (let ghost of ghosts) {
        entityMap[ghost.position.x][ghost.position.y] = true;
        entityMap[ghost.target.x][ghost.target.y] = true;
    }

    for (let ghost of ghosts) {
        entityMap[ghost.position.x][ghost.position.y] = false;
        entityMap[ghost.target.x][ghost.target.y] = false;
        processEntity(ghost);
        entityMap[ghost.position.x][ghost.position.y] = true;
        entityMap[ghost.target.x][ghost.target.y] = true;
    }

    if (player !== null) {

        if (player.powerup > 0) player.powerup -= deltaTime / 1000;
        if (player.powerup < 0) player.powerup = 0;

        processEntity(player);

        if (entityMap[player.target.x][player.target.y]) {

            for (let ghost of ghosts) {
                if (ghost.directionChangeBehaviour === 6) continue;
                if (ghost.target.x === player.target.x && ghost.target.y === player.target.y) {
                    if (player.powerup > 0) {
                        ghost.directionChangeBehaviour = 6;
                        ghost.speed *= 2;
                        ghost.destination = createVector(floor(mapWidth / 2), floor(mapHeight / 2));
                        capturesound.play();
                    } else {
                        player = null;
                        explosionsound.play();
                    }
                    break;
                }

            }
        }

    }
}

function outputs() {

    const size = floor(min(windowWidth / mapWidth, windowHeight / (mapHeight + 1)));
    const xOffset = windowWidth / 2 - (mapWidth / 2) * size;
    const yOffset = windowHeight / 2 - ((mapHeight - 1) / 2) * size;

    background(palette.background.r, palette.background.g, palette.background.b);

    for (let i = 0; i < mapWidth; i++) {
        for (let j = 0; j < mapHeight; j++) {

            if (map[i][j] === ISLAND) {

                image(walltiles[0], i * size + xOffset, j * size + yOffset, size, size);

            } else if (map[i][j] > 0 && map[i][j] < 16) {

                image(walltiles[map[i][j]], i * size + xOffset, j * size + yOffset, size, size);

            } else if (map[i][j] === PILL) {

                image(pilltile, i * size + xOffset, j * size + yOffset, size, size);

            } else if (map[i][j] === POWERUP) {

                image(poweruptile, i * size + xOffset, j * size + yOffset, size, size);

            } else if (map[i][j] === BASE) {

                let b = null;
                if (map[i - 1][j] !== BASE && map[i][j - 1] !== BASE) b = 0;
                else if (map[i + 1][j] !== BASE && map[i][j - 1] !== BASE) b = 2;
                else if (map[i + 1][j] !== BASE && map[i][j + 1] !== BASE) b = 4;
                else if (map[i - 1][j] !== BASE && map[i][j + 1] !== BASE) b = 6;
                else if (map[i][j - 1] !== BASE) b = 1;
                else if (map[i + 1][j] !== BASE) b = 3;
                else if (map[i][j + 1] !== BASE) b = 5;
                else if (map[i - 1][j] !== BASE) b = 7;
                if (b !== null) {
                    image(basetiles[b], i * size + xOffset, j * size + yOffset, size, size);
                }

            }

        }
    }

    if (player !== null) {

        let pacmanFrame = floor(2 + 2 * sin(frameCount / 3));
        let pacmanPosition = p5.Vector.lerp(player.position, player.target, player.progress);

        push();
        imageMode(CENTER);
        translate((pacmanPosition.x + 0.5) * size + xOffset, (pacmanPosition.y + 0.5) * size + yOffset);
        if (player.direction === NORTH) {
            rotate(HALF_PI);
        } else if (player.direction === EAST) {
            rotate(PI);
        } else if (player.direction === SOUTH) {
            rotate(PI + HALF_PI);
        }
        if (player.powerup > 2 || player.powerup > 0 && floor(player.powerup * 6) % 2 === 0) {
            image(poweredpacmans[pacmanFrame], 0, 0, size, size);
        } else {
            image(pacmans[pacmanFrame], 0, 0, size, size);
        }
        pop();

    }

    for (let ghost of ghosts) {

        push();
        imageMode(CENTER);

        let ghostPosition = p5.Vector.lerp(ghost.position, ghost.target, ghost.progress);
        translate((ghostPosition.x + 0.5) * size + xOffset, (ghostPosition.y + 0.5) * size + yOffset);
        if (ghost.directionChangeBehaviour === 6) {
            image(whiteghost, 0, 0, size, size);
        } else {
            image(ghost.image, 0, 0, size, size);
        }

        if (ghost.directionChangeBehaviour !== 6) {
            let ghostEyes;
            switch (ghost.direction) {
                case NORTH: ghostEyes = createVector(0, -size / 8); break;
                case EAST: ghostEyes = createVector(size / 8, 0); break;
                case SOUTH: ghostEyes = createVector(0, size / 8); break;
                case WEST: ghostEyes = createVector(-size / 8, 0); break;
            }
            fill(255, 255, 255);
            ellipse(-size / 5, -size / 8, size / 3, size / 2);
            ellipse(size / 5, -size / 8, size / 3, size / 2);
            fill(0, 0, 0);
            ellipse(-size / 5 + ghostEyes.x, -size / 8 + ghostEyes.y, size / 6, size / 4);
            ellipse(size / 5 + ghostEyes.x, -size / 8 + ghostEyes.y, size / 6, size / 4);
        }

        if (showPaths) {
            textAlign(CENTER, CENTER);
            textSize(14);
            if (ghost.path !== null) {
                let n = 0;
                for (let node of ghost.path) {
                    n++;
                    if (node.final) {
                        fill(128, 255, 128, 128);
                    } else {
                        fill(255, 0, 0, 128);
                    }
                    circle((node.x - ghostPosition.x) * size, (node.y - ghostPosition.y) * size, size);
                    fill(0, 0, 0, 255);
                    text(n, (node.x - ghostPosition.x) * size, (node.y - ghostPosition.y) * size);
                }
            }
        }

        pop();

    }

}
