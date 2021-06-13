"option strict";

const NORTH = 0b1;
const EAST = 0b10;
const SOUTH = 0b100;
const WEST = 0b1000;
const ISLAND = 0b10000;
const PILL = 0b100000;
const BASE = 0b1000000;

let mapWidth = 27;
let mapHeight = 23;
let map;
let entityMap;

let pilltile;
let walltiles = [];
let basetiles = [];
let pacmans = [];
let whiteghost;

let palette = {
  background: { r: 0, g: 0, b: 64 },
  walls: { r: 0, g: 128, b: 0 },
  pills: { r: 0, g: 255, b: 255 },
  base: { r: 128, g: 0, b: 0 },
  pacman: { r: 255, g: 255, b: 0 }
};

let player;
let ghosts = [];

let framerateStack = [];

function preload() {

  for (let i = 0; i < 16; i++) {
    walltiles.push(loadImage("gfx/" + i + ".png"));
  }

  pilltile = loadImage("gfx/pill.png");

  for (let i = 97; i <= 104; i++) {
    basetiles.push(loadImage("gfx/" + String.fromCharCode(i) + ".png"));
  }

  for (let i = 0; i < 4; i++) {
    pacmans.push(loadImage("gfx/pacman" + i + ".png"));
  }

  whiteghost = loadImage("gfx/ghost.png");

}

function generateMap() {

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

    if (map[x][y] != 0) continue;

    map[x][y] = NORTH | SOUTH | EAST | WEST;
    map[mapWidth - 1 - x][y] = map[x][y];

    let invalid = false;

    // ...INVALID IF CAUSES A DEAD END

    if (!invalid) {
      for (let u = -1; u <= 1; u++) {
        for (let v = -1; v <= 1; v++) {
          if (map[x + u][y + v] != 0) continue;
          let directions = 0;
          if (x + u < mapWidth - 1 && map[x + u + 1][y + v] == 0) directions++;
          if (x + u > 0 && map[x + u - 1][y + v] == 0) directions++;
          if (y + v < mapHeight - 1 && map[x + u][y + v + 1] == 0) directions++;
          if (y + v > 0 && map[x + u][y + v - 1] == 0) directions++;
          if (directions == 1) {
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
      if (map[i][j] == 0 ||
        abs(u - i) == 2 && abs(v - j) <= 2 ||
        abs(u - i) <= 2 && abs(v - j) == 2) {
        map[i][j] = PILL;
      }
    }
  }

  // EDGE FIXES

  for (let x = 0; x < mapWidth; x++) {
    for (let y = 0; y < mapHeight; y++) {
      if (map[x][y] != 0) {
        if (x < mapWidth - 1 && map[x + 1][y] % 16 == 0) map[x][y] = map[x][y] & ~EAST;
        if (x > 0 && map[x - 1][y] % 16 == 0) map[x][y] = map[x][y] & ~WEST;
        if (y < mapHeight - 1 && map[x][y + 1] % 16 == 0) map[x][y] = map[x][y] & ~SOUTH;
        if (y > 0 && map[x][y - 1] % 16 == 0) map[x][y] = map[x][y] & ~NORTH;
        if (map[x][y] == 0) map[x][y] = ISLAND;
      }
    }
  }

  // CREATE ISLANDS

  for (let x = 1; x < mapWidth - 1; x++) {
    for (let y = 1; y < mapHeight - 1; y++) {
      if (map[x][y] == PILL) {
        if (map[x + 1][y] == PILL && map[x][y + 1] == PILL && map[x - 1][y] == PILL && map[x][y - 1] == PILL &&
          map[x + 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y - 1] == PILL) {
          map[x][y] = ISLAND;
        }
      }
    }
  }

  // JOIN ISLANDS

  for (let x = 1; x < mapWidth - 1; x++) {
    for (let y = 1; y < mapHeight - 1; y++) {
      if (map[x][y] == PILL) {
        if (map[x + 1][y] == ISLAND && map[x][y + 1] == PILL && map[x - 1][y] == ISLAND && map[x][y - 1] == PILL &&
          map[x + 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y - 1] == PILL) {
          map[x][y] = EAST | WEST;
          map[x + 1][y] = WEST;
          map[x - 1][y] = EAST;
        }
        if (map[x + 1][y] == PILL && map[x][y + 1] == ISLAND && map[x - 1][y] == PILL && map[x][y - 1] == ISLAND &&
          map[x + 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y - 1] == PILL) {
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
    directionChangeBehaviour: null
  }
}

function traverse(x, y, history = null) {

  let final = history === null;

  if (history == null) {
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

  if (x > 0 && map[x - 1][y] == 0 && !history[x - 1][y]) traverse(x - 1, y, history);
  if (y > 0 && map[x][y - 1] == 0 && !history[x][y - 1]) traverse(x, y - 1, history);
  if (x < mapWidth - 1 && map[x + 1][y] == 0 && !history[x + 1][y]) traverse(x + 1, y, history);
  if (y < mapHeight - 1 && map[x][y + 1] == 0 && !history[x][y + 1]) traverse(x, y + 1, history);

  if (final) {

    let traversedCount = 0;
    let totalCount = 0;
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        if (map[x][y] == 0) {
          totalCount++;
          if (history[x][y]) traversedCount++;
        }
      }
    }

    return traversedCount / totalCount;

  }

}

function generateGhosts() {

  ghosts = [];

  for (let z = 0; z < floor(mapWidth * mapHeight) / 40 + 1; z++) {

    let x, y;
    do {
      x = floor(random(1, mapWidth - 1));
      y = floor(random(1, mapHeight - 1));
    } while (map[x][y] != PILL ||
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
    } while (map[x + dx][y + dy] != PILL);

    let t = floor(random(1, 4));

    let r, g, b;
    switch (t) {
      case 1: r = 0; g = 255; b = 255; break;
      case 2: r = 255; g = 128; b = 0; break;
      case 3: r = 255; g = 0; b = 255; break;
    }

    let img = createImage(whiteghost.width, whiteghost.height);
    img.copy(whiteghost,
      0, 0, whiteghost.width, whiteghost.height,
      0, 0, whiteghost.width, whiteghost.height);
    img.loadPixels();
    for (let i = 0; i < 4 * img.width * img.height; i += 4) {
      img.pixels[i] = whiteghost.pixels[i] * r / 256;
      img.pixels[i + 1] = whiteghost.pixels[i + 1] * g / 256;
      img.pixels[i + 2] = whiteghost.pixels[i + 2] * b / 256;
    }
    img.updatePixels();

    ghosts.push({
      image: img,
      position: createVector(x, y),
      target: createVector(x + dx, y + dy),
      progress: 0,
      speed: 3,
      direction: d,
      nextDirection: d,
      directionChangeBehaviour: t
    });

  }

}

function windowResized() {

  resizeCanvas(windowWidth, windowHeight);

}

function setup() {

  p5.disableFriendlyErrors = true;

  createCanvas(windowWidth, windowHeight, P2D);

  frameRate(60);

  for (let w of walltiles) {
    w.loadPixels();
    for (let i = 0; i < 4 * w.width * w.height; i += 4) {
      w.pixels[i] = w.pixels[i] * palette.walls.r / 256;
      w.pixels[i + 1] = w.pixels[i + 1] * palette.walls.g / 256;
      w.pixels[i + 2] = w.pixels[i + 2] * palette.walls.b / 256;
    }
    w.updatePixels();
  }

  pilltile.loadPixels();
  for (let i = 0; i < 4 * pilltile.width * pilltile.height; i += 4) {
    pilltile.pixels[i] = pilltile.pixels[i] * palette.pills.r / 256;
    pilltile.pixels[i + 1] = pilltile.pixels[i + 1] * palette.pills.g / 256;
    pilltile.pixels[i + 2] = pilltile.pixels[i + 2] * palette.pills.b / 256;
  }
  pilltile.updatePixels();

  for (let b of basetiles) {
    b.loadPixels();
    for (let i = 0; i < 4 * b.width * b.height; i += 4) {
      b.pixels[i] = b.pixels[i] * palette.base.r / 256;
      b.pixels[i + 1] = b.pixels[i + 1] * palette.base.g / 256;
      b.pixels[i + 2] = b.pixels[i + 2] * palette.base.b / 256;
    }
    b.updatePixels();
  }

  for (let p of pacmans) {
    p.loadPixels();
    for (let i = 0; i < 4 * p.width * p.height; i += 4) {
      p.pixels[i] = p.pixels[i] * palette.pacman.r / 256;
      p.pixels[i + 1] = p.pixels[i + 1] * palette.pacman.g / 256;
      p.pixels[i + 2] = p.pixels[i + 2] * palette.pacman.b / 256;
    }
    p.updatePixels();
  }

  generateMap();
  generateGhosts();

}


function keyPressed() {

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
    } else if (keyCode == 32) {
      generateMap();
      generateGhosts();
    }
  }

}

function processEntity(entity) {

  entity.progress += entity.speed * (deltaTime / 1000);
  if (entity.progress >= 1) {
    entity.progress -= 1;
    entity.position.x = entity.target.x;
    entity.position.y = entity.target.y;

    if (entity.target.x > 0 && entity.target.x < mapWidth - 1 && entity.target.y > 0 && entity.target.y < mapHeight - 1) {

      if (entity === player && map[entity.target.x][entity.target.y] == PILL) {
        map[entity.target.x][entity.target.y] = 0;
      }

      let directionChange = false;

      let northClear = (map[entity.target.x][entity.target.y - 1] == 0 || map[entity.target.x][entity.target.y - 1] == PILL) &&
        !entityMap[entity.target.x][entity.target.y - 1];
      let eastClear = (map[entity.target.x + 1][entity.target.y] == 0 || map[entity.target.x + 1][entity.target.y] == PILL) &&
        !entityMap[entity.target.x + 1][entity.target.y];
      let southClear = (map[entity.target.x][entity.target.y + 1] == 0 || map[entity.target.x][entity.target.y + 1] == PILL) &&
        !entityMap[entity.target.x][entity.target.y + 1];
      let westClear = (map[entity.target.x - 1][entity.target.y] == 0 || map[entity.target.x - 1][entity.target.y] == PILL) &&
        !entityMap[entity.target.x - 1][entity.target.y];

      if (entity.directionChangeBehaviour != null && (entity.nextDirection == NORTH & !northClear ||
        entity.nextDirection == EAST & !eastClear ||
        entity.nextDirection == SOUTH & !southClear ||
        entity.nextDirection == WEST & !westClear)) {
        directionChange = true;
      }

      if (entity.directionChangeBehaviour == 2 || entity.directionChangeBehaviour == 3) {
        let paths = (northClear ? 1 : 0) + (eastClear ? 1 : 0) + (southClear ? 1 : 0) + (westClear ? 1 : 0);
        if (paths > 2) {
          directionChange = true;
        }
      }

      if (directionChange && entity.directionChangeBehaviour !== null) {
        if (entity.directionChangeBehaviour <= 3) {

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

            if (entity.directionChangeBehaviour == 3) {
              if (tries <= 15) {
                oneeighty =
                  d == NORTH && entity.nextDirection == SOUTH ||
                  d == EAST && entity.nextDirection == WEST ||
                  d == SOUTH && entity.nextDirection == NORTH ||
                  d == WEST && entity.nextDirection == EAST;
              } else {
                oneeighty = false;
              }
            }

          } while (oneeighty || !(map[entity.position.x + dx][entity.position.y + dy] == PILL ||
            map[entity.position.x + dx][entity.position.y + dy] == 0) || entityMap[entity.target.x + dx][entity.target.y + dy]);

          entity.progress = 0;
          entity.nextDirection = d;
        }
      }

      if (entity.nextDirection == NORTH) {
        if (northClear) {
          entity.target.y--;
          entity.direction = entity.nextDirection;
        } else {
          entity.progress = 1;
          entity.nextDirection = entity.direction;
        }
      } else if (entity.nextDirection == EAST) {
        if (eastClear) {
          entity.target.x++;
          entity.direction = entity.nextDirection;
        } else {
          entity.progress = 1;
          entity.nextDirection = entity.direction;
        }
      } else if (entity.nextDirection == SOUTH) {
        if (southClear) {
          entity.target.y++;
          entity.direction = entity.nextDirection;
        } else {
          entity.progress = 1;
          entity.nextDirection = entity.direction;
        }
      } else if (entity.nextDirection == WEST) {
        if (westClear) {
          entity.target.x--;
          entity.direction = entity.nextDirection;
        } else {
          entity.progress = 1;
          entity.nextDirection = entity.direction;
        }
      }

    }

  }
}




function draw() {

  if (framerateStack.length > 30) framerateStack.shift();
  framerateStack.push(frameRate());
  let averageFPS = 0;
  for (let f of framerateStack) averageFPS += f;
  averageFPS /= framerateStack.length;

  /* INPUTS */

  if (!keyIsDown(CONTROL)) {
    if (player.target.x > 0 && player.target.x < mapWidth - 1 && player.target.y > 0 && player.target.y < mapHeight - 1) {
      if (keyIsDown(LEFT_ARROW) && (map[player.target.x - 1][player.target.y] == 0 || map[player.target.x - 1][player.target.y] == PILL)) {
        player.nextDirection = WEST;
      } else if (keyIsDown(RIGHT_ARROW) && (map[player.target.x + 1][player.target.y] == 0 || map[player.target.x + 1][player.target.y] == PILL)) {
        player.nextDirection = EAST;
      } else if (keyIsDown(UP_ARROW) && (map[player.target.x][player.target.y - 1] == 0 || map[player.target.x][player.target.y - 1] == PILL)) {
        player.nextDirection = NORTH;
      } else if (keyIsDown(DOWN_ARROW) && (map[player.target.x][player.target.y + 1] == 0 || map[player.target.x][player.target.y + 1] == PILL)) {
        player.nextDirection = SOUTH;
      }
    }
  }

  /* PROCESSES */

  entityMap = [];
  for (let i = 0; i < mapWidth; i++) {
    row = [];
    for (let j = 0; j < mapHeight; j++) {
      row.push(0);
    }
    entityMap.push(row);
  }

  processEntity(player);

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

  /* OUTPUTS */

  background(palette.background.r, palette.background.g, palette.background.b);

  let size = floor(min(windowWidth / mapWidth, windowHeight / (mapHeight + 1)));
  let xOffset = windowWidth / 2 - (mapWidth / 2) * size;
  let yOffset = windowHeight / 2 - ((mapHeight - 1) / 2) * size;

  for (let i = 0; i < mapWidth; i++) {
    for (let j = 0; j < mapHeight; j++) {

      if (map[i][j] == ISLAND) {

        image(walltiles[0], i * size + xOffset, j * size + yOffset, size, size);

      } else if (map[i][j] > 0 && map[i][j] < 16) {

        image(walltiles[map[i][j]], i * size + xOffset, j * size + yOffset, size, size);

      } else if (map[i][j] == PILL) {

        image(pilltile, i * size + xOffset, j * size + yOffset, size, size);

      } else if (map[i][j] == BASE) {

        let b = null;
        if (map[i - 1][j] != BASE && map[i][j - 1] != BASE) b = 0;
        else if (map[i + 1][j] != BASE && map[i][j - 1] != BASE) b = 2;
        else if (map[i + 1][j] != BASE && map[i][j + 1] != BASE) b = 4;
        else if (map[i - 1][j] != BASE && map[i][j + 1] != BASE) b = 6;
        else if (map[i][j - 1] != BASE) b = 1;
        else if (map[i + 1][j] != BASE) b = 3;
        else if (map[i][j + 1] != BASE) b = 5;
        else if (map[i - 1][j] != BASE) b = 7;
        if (b != null) {
          image(basetiles[b], i * size + xOffset, j * size + yOffset, size, size);
        }

      }

    }
  }

  let pacmanFrame = floor(2 + 2 * sin(frameCount / 3));

  let pacmanPosition = p5.Vector.lerp(player.position, player.target, player.progress);

  push();
  imageMode(CENTER);
  translate((pacmanPosition.x + 0.5) * size + xOffset, (pacmanPosition.y + 0.5) * size + yOffset);
  if (player.direction == NORTH) {
    rotate(HALF_PI);
  } else if (player.direction == EAST) {
    rotate(PI);
  } else if (player.direction == SOUTH) {
    rotate(PI + HALF_PI);
  }
  image(pacmans[pacmanFrame], 0, 0, size, size);
  pop();

  for (let ghost of ghosts) {
    
    push();
    imageMode(CENTER);
    
    let ghostPosition = p5.Vector.lerp(ghost.position, ghost.target, ghost.progress);
    translate((ghostPosition.x + 0.5) * size + xOffset, (ghostPosition.y + 0.5) * size + yOffset);
    image(ghost.image, 0, 0, size, size);
    
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

    pop();
    
  }

  textAlign(LEFT, TOP);
  textSize(18);
  fill(255, 255, 255);
  text(floor(averageFPS) + " FPS", 10, 10);

}
