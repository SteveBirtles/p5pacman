let MAP_WIDTH = 16;
let MAP_HEIGHT = 14;

const NORTH = 0b00001;
const EAST = 0b00010;
const SOUTH = 0b00100;
const WEST = 0b01000;
const PILL = 0b10000;

let map;

let walltiles = [];

function preload() {

  for (let i = 0; i < 16; i++) {
    walltiles.push(loadImage(i + ".png"));
  }

  generateMap();

}

function generateMap() {

  map = [];
  for (let i = 0; i < MAP_WIDTH; i++) {
    row = [];
    for (let j = 0; j < MAP_HEIGHT; j++) {
      row.push(0);
    }
    map.push(row);
  }

  for (let i = 0; i < floor(MAP_WIDTH / 2) - 1; i += 2) {
    if (i < MAP_HEIGHT / 2 - 1) {
      for (let j = i + 1; j < floor(MAP_WIDTH) - i - 1; j++) {
        map[j][i] = EAST | WEST;
        map[j][MAP_HEIGHT - i - 1] = EAST | WEST;
      }
      map[i][i] = SOUTH | EAST;
      map[i][MAP_HEIGHT - 1 - i] = NORTH | EAST;
      map[MAP_WIDTH - 1 - i][i] = SOUTH | WEST;
      map[MAP_WIDTH - 1 - i][MAP_HEIGHT - 1 - i] = NORTH | WEST;
    }
    for (let j = i + 1; j < MAP_HEIGHT - 1 - i; j++) {
      map[i][j] = NORTH | SOUTH;
      map[MAP_WIDTH - 1 - i][j] = NORTH | SOUTH;
    }
  }

  let centreI = 0;
  let centreJ = 0;

  

  for (let i = 0; i < MAP_WIDTH; i++) {
    for (let j = 0; j < MAP_HEIGHT; j++) {
      if (map[i][j] != 0) continue;
      map[i][j] = PILL;
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

  if (x > 0 && map[x - 1][y].value == 0 && !history[x - 1][y]) traverse(x - 1, y, false);
  if (y > 0 && map[x][y - 1].value == 0 && !history[x][y - 1]) traverse(x, y - 1, false);
  if (x < MAP_WIDTH - 1 && map[x + 1][y].value == 0 && !history[x + 1][y]) traverse(x + 1, y, false);
  if (y < MAP_HEIGHT - 1 && map[x][y + 1].value == 0 && !history[x][y + 1]) traverse(x, y + 1, false);

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

    return (traversedCount / totalCount);

  }

}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  createCanvas(windowWidth, windowHeight, P2D);
}

function keyPressed() {

  if (keyCode === LEFT_ARROW) {
    MAP_WIDTH--;
    if (MAP_WIDTH < 8) MAP_WIDTH = 8;
    generateMap();
  } else if (keyCode === RIGHT_ARROW) {
    MAP_WIDTH++;
    generateMap();
  } else if (keyCode === UP_ARROW) {
    MAP_HEIGHT--;
    if (MAP_HEIGHT < 8) MAP_HEIGHT = 8;
    generateMap();
  } else if (keyCode === DOWN_ARROW) {
    MAP_HEIGHT++;
    generateMap();
  } else if (keyCode === 32) {

    let before = 0;

    while (before < 1) {

      before = traverse(1, 1);

      let i = floor(random(1, MAP_WIDTH - 1));
      let j = floor(random(1, MAP_HEIGHT - 1));

      flip(i, j);
      flip(MAP_WIDTH - 1 - i, j);

      let after = traverse(1, 1);

      if (after < before) {
        flip(i, j);
        flip(MAP_WIDTH - 1 - i, j);
      }

    }

  }


}

function flip(i, j) {

  if (map[i][j].value == 0) {

    if (map[i][j - 1].value == 0 && map[i][j + 1].value == 0 &&
      map[i - 1][j].value != 0 && map[i + 1][j].value != 0) {

      map[i][j] = { value: EAST | WEST, r: 255, g: 0, b: 0 };
      map[i - 1][j] = { value: map[i - 1][j].value | EAST, r: 255, g: 0, b: 0 };
      map[i + 1][j] = { value: map[i + 1][j].value | WEST, r: 255, g: 0, b: 0 };

    } else if (map[i][j - 1].value != 0 && map[i][j + 1].value != 0 &&
      map[i - 1][j].value == 0 && map[i + 1][j].value == 0) {

      map[i][j] = { value: NORTH | SOUTH, r: 255, g: 0, b: 0 };
      map[i][j - 1] = { value: map[i][j - 1].value | SOUTH, r: 255, g: 0, b: 0 };
      map[i][j + 1] = { value: map[i][j + 1].value | NORTH, r: 255, g: 0, b: 0 };

    }


  } else {

    if (map[i][j - 1].value == 0 && map[i][j + 1].value == 0 &&
      map[i - 1][j].value != 0 && map[i + 1][j].value != 0) {

      map[i][j] = { value: 0, r: 255, g: 255, b: 0 };
      map[i - 1][j] = { value: map[i - 1][j].value & ~EAST, r: 255, g: 255, b: 0 };
      map[i + 1][j] = { value: map[i + 1][j].value & ~WEST, r: 255, g: 255, b: 0 };

    } else if (map[i][j - 1].value != 0 && map[i][j + 1].value != 0 &&
      map[i - 1][j].value == 0 && map[i + 1][j].value == 0) {

      map[i][j] = { value: 0, r: 255, g: 255, b: 0 };
      map[i][j - 1] = { value: map[i][j - 1].value & ~SOUTH, r: 255, g: 255, b: 0 };
      map[i][j + 1] = { value: map[i][j + 1].value & ~NORTH, r: 255, g: 255, b: 0 };

    }

  }

}

function draw() {

  background(0, 0, 64);

  let size = 32;
  textSize(14);
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);

  for (let i = 0; i < MAP_WIDTH; i++) {
    text(i, (i + 1.5) * size, size/2)
    for (let j = 0; j < MAP_HEIGHT; j++) {
      if (i == 0) text(j, size/2, (j + 1.5) * size);

      tint(0, 255, 0);

      if (map[i][j] > 0) {
        image(walltiles[map[i][j] % 16], (i + 1) * size, (j + 1) * size, size, size);
      }

    }
  }

}
