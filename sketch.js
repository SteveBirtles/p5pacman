let MAP_WIDTH = 16;
let MAP_HEIGHT = 14;

const NORTH = 0b0001;
const EAST = 0b0010;
const SOUTH = 0b0100;
const WEST = 0b1000;

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
      row.push({
        value: 0b0000,
        r: 0,
        g: 0,
        b: 0,
        traversed: false
      });
    }
    map.push(row);
  }

  for (let i = 0; i < floor(MAP_WIDTH / 2); i += 2) {

    if (i < MAP_HEIGHT / 2) {
      for (let j = i + 1; j < floor(MAP_WIDTH) - i - 1; j++) {
        map[j][i] = { value: EAST | WEST, r: 255, g: 255, b: 255 };
        map[j][MAP_HEIGHT - i - 1] = { value: EAST | WEST, r: 255, g: 255, b: 255 };
      }
    }

    if (2 * i == (MAP_HEIGHT - 1)) {
      map[i][i] = { value: EAST, r: 255, g: 255, b: 255 };
      map[MAP_WIDTH - 1 - i][i] = { value: WEST, r: 255, g: 255, b: 255 };
      break;
    }

    if (i < floor(MAP_HEIGHT / 2)) {
      map[i][i] = { value: SOUTH | EAST, r: 255, g: 255, b: 255 };
      map[i][MAP_HEIGHT - 1 - i] = { value: NORTH | EAST, r: 255, g: 255, b: 255 };
      map[MAP_WIDTH - 1 - i][i] = { value: SOUTH | WEST, r: 255, g: 255, b: 255 };
      map[MAP_WIDTH - 1 - i][MAP_HEIGHT - 1 - i] = { value: NORTH | WEST, r: 255, g: 255, b: 255 };
    }

    for (let j = i + 1; j < MAP_HEIGHT - 1 - i; j++) {
      map[i][j] = { value: NORTH | SOUTH, r: 255, g: 255, b: 255 };
      map[MAP_WIDTH - 1 - i][j] = { value: NORTH | SOUTH, r: 255, g: 255, b: 255 };
    }

  }

}

function traverse(x, y, reset) {

  if (reset) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        map[x][y].traversed = false;
        if (map[x][y].value == 0) {
          map[x][y].r = 0;
          map[x][y].g = 0;
          map[x][y].b = 0;
        }
      }
    }
  }

  map[x][y].traversed = true;
  map[x][y].r = 0;
  map[x][y].g = 255;
  map[x][y].b = 0;

  if (x > 0 && map[x - 1][y].value == 0 && !map[x - 1][y].traversed) traverse(x - 1, y, false);
  if (y > 0 && map[x][y - 1].value == 0 && !map[x][y - 1].traversed) traverse(x, y - 1, false);
  if (x < MAP_WIDTH - 1 && map[x + 1][y].value == 0 && !map[x + 1][y].traversed) traverse(x + 1, y, false);
  if (y < MAP_HEIGHT - 1 && map[x][y + 1].value == 0 && !map[x][y + 1].traversed) traverse(x, y + 1, false);

  if (reset) {

    let traversedCount = 0;
    let totalCount = 0;
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        if (map[x][y].value == 0) {
          totalCount++;
          if (map[x][y].traversed) traversedCount++;
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
    generateMap();
    if (MAP_WIDTH < 3) MAP_WIDTH = 3;
  } else if (keyCode === RIGHT_ARROW) {
    MAP_WIDTH++;
    generateMap();
  } else if (keyCode === UP_ARROW) {
    MAP_HEIGHT--;
    generateMap();
    if (MAP_HEIGHT < 3) MAP_HEIGHT = 3;
  } else if (keyCode === DOWN_ARROW) {
    MAP_HEIGHT++;
    generateMap();
  } else if (keyCode === 32) {

    let before = 0;

    while (before < 1) {

      before = traverse(1, 1, true);

      let i = floor(random(1, MAP_WIDTH - 1));
      let j = floor(random(1, MAP_HEIGHT - 1));

      flip(i, j);
      flip(MAP_WIDTH - 1 - i, j);

      let after = traverse(1, 1, true);

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

  let size = 64;

  for (let i = 0; i < MAP_WIDTH; i++) {
    for (let j = 0; j < MAP_HEIGHT; j++) {

      tint(map[i][j].r, map[i][j].g, map[i][j].b);

      image(walltiles[map[i][j].value], i * size, j * size, size, size);

    }
  }

}
