let MAP_WIDTH = 27;
let MAP_HEIGHT = 23;

const NORTH = 0b000001;
const EAST = 0b000010;
const SOUTH = 0b000100;
const WEST = 0b001000;
const ISLAND = 0b010000;
const PILL = 0b0100000;
const BASE = 0b01000000;

let map;

let lastMap, lastU;

let pill;
let walltiles = [];
let basetiles = [];

let palette = [{ r: 0, g: 0, b: 64 }, { r: 0, g: 128, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 128, g: 0, b: 0 }];
let framerateStack = [];

p5.disableFriendlyErrors = true;

function preload() {

  for (let i = 0; i < 16; i++) {
    walltiles.push(loadImage(i + ".png"));
  }

  pill = loadImage("pill.png");

  basetiles.push(loadImage("a.png"));
  basetiles.push(loadImage("b.png"));
  basetiles.push(loadImage("c.png"));
  basetiles.push(loadImage("d.png"));
  basetiles.push(loadImage("e.png"));
  basetiles.push(loadImage("f.png"));
  basetiles.push(loadImage("g.png"));
  basetiles.push(loadImage("h.png"));  

}

function generateMap() {

  // CLEAR MAP

  map = [];
  for (let i = 0; i < MAP_WIDTH; i++) {
    row = [];
    for (let j = 0; j < MAP_HEIGHT; j++) {
      row.push(0);
    }
    map.push(row);
  }

  // MAP EDGES

  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    map[x][0] = SOUTH | EAST | WEST;
    map[x][MAP_HEIGHT - 1] = NORTH | EAST | WEST;
  }
  for (let y = 0; y < MAP_HEIGHT - 1; y++) {
    map[0][y] = EAST | NORTH | SOUTH;
    map[MAP_WIDTH - 1][y] = WEST | NORTH | SOUTH;
  }

  // MAP CORNERS

  map[0][0] = EAST | SOUTH;
  map[MAP_WIDTH - 1][0] = WEST | SOUTH;
  map[0][MAP_HEIGHT - 1] = EAST | NORTH;
  map[MAP_WIDTH - 1][MAP_HEIGHT - 1] = WEST | NORTH;

  // ADD PILLARS EVERY 2 SPACES

  for (let x = 2; x < MAP_WIDTH - 2; x += 2) {
    for (let y = 2; y < MAP_HEIGHT - 2; y += 2) {
      map[x][y] = NORTH | SOUTH | EAST | WEST;
    }
  }

  // ADD CENTRAL BASE

  let u = floor(MAP_WIDTH / 2);
  let v = floor(MAP_HEIGHT / 2);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      map[u + i][v + j] = BASE;
    }
  }

  // ADD RANDOMISED WALLS

  for (let i = 0; i < MAP_WIDTH * MAP_HEIGHT; i++) {

    let x = floor(random(1, MAP_WIDTH / 2 - 1));
    let y = floor(random(1, MAP_HEIGHT - 1));

    if (map[x][y] != 0) continue;

    map[x][y] = NORTH | SOUTH | EAST | WEST;
    map[MAP_WIDTH - 1 - x][y] = map[x][y];

    let invalid = false;

    // ...INVALID IF CAUSES A DEAD END

    if (!invalid) {
      for (let u = -1; u <= 1; u++) {
        for (let v = -1; v <= 1; v++) {
          if (map[x + u][y + v] != 0) continue;
          let directions = 0;
          if (x + u < MAP_WIDTH - 1 && map[x + u + 1][y + v] == 0) directions++;
          if (x + u > 0 && map[x + u - 1][y + v] == 0) directions++;
          if (y + v < MAP_HEIGHT - 1 && map[x + u][y + v + 1] == 0) directions++;
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

    if (invalid) {
      map[x][y] = 0;
      map[MAP_WIDTH - 1 - x][y] = 0;
    }

  }

  // ADD PILLS, INCLUDING CENTRAL LOOP

  for (let i = 1; i < MAP_WIDTH - 1; i++) {
    for (let j = 1; j < MAP_HEIGHT - 1; j++) {
      if (map[i][j] == 0 ||
        abs(u - i) == 2 && abs(v - j) <= 2 ||
        abs(u - i) <= 2 && abs(v - j) == 2) {
        map[i][j] = PILL;
      }
    }
  }

  // EDGE FIX

  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      if (map[x][y] != 0) {
        if (x < MAP_WIDTH - 1 && map[x + 1][y] % 16 == 0) map[x][y] = map[x][y] & ~EAST;
        if (x > 0 && map[x - 1][y] % 16 == 0) map[x][y] = map[x][y] & ~WEST;
        if (y < MAP_HEIGHT - 1 && map[x][y + 1] % 16 == 0) map[x][y] = map[x][y] & ~SOUTH;
        if (y > 0 && map[x][y - 1] % 16 == 0) map[x][y] = map[x][y] & ~NORTH;
        if (map[x][y] == 0) map[x][y] = ISLAND;
      }
    }
  }

  // CREATE ISLANDS

  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      if (map[x][y] == PILL) {
        if (map[x + 1][y] == PILL && map[x][y + 1] == PILL && map[x - 1][y] == PILL && map[x][y - 1] == PILL &&
          map[x + 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y + 1] == PILL && map[x - 1][y - 1] == PILL) {
          map[x][y] = ISLAND;
        }
      }
    }
  }

  // JOIN ISLANDS

  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
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

}



function traverse(x, y, history = null) {

  let final = history === null;

  if (history == null) {
    history = [];
    for (let i = 0; i < MAP_WIDTH; i++) {
      row = [];
      for (let j = 0; j < MAP_HEIGHT; j++) {
        row.push(false);
      }
      history.push(row);
    }
  }

  history[x][y] = true;

  if (x > 0 && map[x - 1][y] == 0 && !history[x - 1][y]) traverse(x - 1, y, history);
  if (y > 0 && map[x][y - 1] == 0 && !history[x][y - 1]) traverse(x, y - 1, history);
  if (x < MAP_WIDTH - 1 && map[x + 1][y] == 0 && !history[x + 1][y]) traverse(x + 1, y, history);
  if (y < MAP_HEIGHT - 1 && map[x][y + 1] == 0 && !history[x][y + 1]) traverse(x, y + 1, history);

  if (final) {

    let traversedCount = 0;
    let totalCount = 0;
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        if (map[x][y] == 0) {
          totalCount++;
          if (history[x][y]) traversedCount++;
        }
      }
    }

    return traversedCount / totalCount;

  }

}


function windowResized() {

  resizeCanvas(windowWidth, windowHeight);

}

function setup() {

  createCanvas(windowWidth, windowHeight, P2D);

  for (let w of walltiles) {
    w.loadPixels();
    for (let i = 0; i < 4 * w.width * w.height; i += 4) {
      w.pixels[i] = w.pixels[i] * palette[1].r / 256;
      w.pixels[i + 1] = w.pixels[i + 1] * palette[1].g / 256;
      w.pixels[i + 2] = w.pixels[i + 2] * palette[1].b / 256;      
    }
    w.updatePixels();
  }

  pill.loadPixels();
  for (let i = 0; i < 4 * pill.width * pill.height; i += 4) {
    pill.pixels[i] = pill.pixels[i] * palette[2].r / 256;
    pill.pixels[i + 1] = pill.pixels[i + 1] * palette[2].g / 256;
    pill.pixels[i + 2] = pill.pixels[i + 2] * palette[2].b / 256;      
  }
  pill.updatePixels();

  for (let b of basetiles) {
    b.loadPixels();
    for (let i = 0; i < 4 * b.width * b.height; i += 4) {
      b.pixels[i] = b.pixels[i] * palette[3].r / 256;
      b.pixels[i + 1] = b.pixels[i + 1] * palette[3].g / 256;
      b.pixels[i + 2] = b.pixels[i + 2] * palette[3].b / 256;      
    }
    b.updatePixels();
  }



  generateMap();

}

function keyPressed() {

  if (keyCode === LEFT_ARROW) {
    MAP_WIDTH -= 4;
    if (MAP_WIDTH < 15) MAP_WIDTH = 15;
    generateMap();
  } else if (keyCode === RIGHT_ARROW) {
    MAP_WIDTH += 4;
    generateMap();
  } else if (keyCode === UP_ARROW) {
    MAP_HEIGHT -= 4;
    if (MAP_HEIGHT < 11) MAP_HEIGHT = 11;
    generateMap();
  } else if (keyCode === DOWN_ARROW) {
    MAP_HEIGHT += 4;
    generateMap();
  } else if (keyCode == 32) {
    generateMap();
  }

}



function draw() {

  if (framerateStack.length > 30) framerateStack.shift();
  framerateStack.push(frameRate());
  let averageFPS = 0;
  for (let f of framerateStack) averageFPS += f;
  averageFPS /= framerateStack.length;

  background(palette[0].r, palette[0].g, palette[0].b);

  let size = floor(min(windowWidth / MAP_WIDTH, windowHeight / (MAP_HEIGHT + 1)));
  let xOffset = windowWidth / 2 - (MAP_WIDTH / 2) * size;
  let yOffset = windowHeight / 2 - ((MAP_HEIGHT - 1) / 2) * size;

  for (let i = 0; i < MAP_WIDTH; i++) {
    for (let j = 0; j < MAP_HEIGHT; j++) {

      if (map[i][j] == ISLAND) {

        image(walltiles[0], i * size + xOffset, j * size + yOffset, size, size);

      } else if (map[i][j] > 0 && map[i][j] < 16) {

        image(walltiles[map[i][j]], i * size + xOffset, j * size + yOffset, size, size);

      } else if (map[i][j] == PILL) {

        image(pill, i * size + xOffset, j * size + yOffset, size, size);

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

  textAlign(LEFT, TOP);
  textSize(18);
  fill(255, 255, 255);
  text(floor(averageFPS) + " FPS", 10, 10);

}
