let MAP_WIDTH = 27;
let MAP_HEIGHT = 23;

const NORTH = 0b00001;
const EAST = 0b00010;
const SOUTH = 0b00100;
const WEST = 0b01000;
const PILL = 0b10000;

let map;
let colours;

let lastMap, lastU;

let walltiles = [];

function preload() {

  for (let i = 0; i < 16; i++) {
    walltiles.push(loadImage(i + ".png"));
  }

  generateMap();

}

function generateMap() {

  map = [];
  colours = [];
  for (let i = 0; i < MAP_WIDTH; i++) {
    row = [];
    crow = [];
    for (let j = 0; j < MAP_HEIGHT; j++) {
      row.push(0);
      crow.push({ r: 0, g: 128, b: 0 });
    }
    map.push(row);
    colours.push(crow);
  }

  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    map[x][0] = SOUTH | EAST | WEST;
    map[x][MAP_HEIGHT - 1] = NORTH | EAST | WEST;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[0][y] = EAST | NORTH | SOUTH;
    map[MAP_WIDTH - 1][y] = WEST | NORTH | SOUTH;
  }

  map[0][0] = EAST | SOUTH;
  map[MAP_WIDTH - 1][0] = WEST | SOUTH;
  map[0][MAP_HEIGHT - 1] = EAST | NORTH;
  map[MAP_WIDTH - 1][MAP_HEIGHT - 1] = WEST | NORTH;

  for (let x = 2; x < MAP_WIDTH - 2; x += 2) {
    for (let y = 2; y < MAP_HEIGHT - 2; y += 2) {
      map[x][y] = NORTH | SOUTH | EAST | WEST;
    }
  }

  for (let i = 0; i < MAP_WIDTH * MAP_HEIGHT; i++) {

    let x = floor(random(0, MAP_WIDTH / 2 - 2)) + 1;
    let y = floor(random(0, MAP_HEIGHT - 2)) + 1;

    if (map[x][y] != 0) continue;

    map[x][y] = NORTH | SOUTH | EAST | WEST;

    let invalid = false;

    for (let u = -1; u <= 1; u++) {
      for (let v = -1; v <= 1; v++) {
        if (map[x + u][y + v] != 0) continue;
        let directions = 0;
        if (x + u < MAP_WIDTH - 1 && map[x + u + 1][y + v] == 0) directions++;
        if (x + u > 0 && map[x + u - 1][y + v] == 0) directions++;
        if (y + v < MAP_HEIGHT - 1 && map[x + u][y + v + 1] == 0) directions++;
        if (y + v > 0 && map[x + u][y + v - 1] == 0) directions++;
        if (directions == 1) {
          map[x][y] = 0;
          invalid = true;
        }
      }
    }

    if (!invalid) {
      if (map[x + 1][y] != 0 && map[x + 1][y + 1] != 0 && map[x][y + 1] != 0 ||
        map[x - 1][y] != 0 && map[x - 1][y + 1] != 0 && map[x][y + 1] != 0 ||
        map[x - 1][y] != 0 && map[x - 1][y - 1] != 0 && map[x][y - 1] != 0 ||
        map[x + 1][y] != 0 && map[x + 1][y - 1] != 0 && map[x][y - 1] != 0) invalid = true;
    }

    if (!invalid) {
      let t = traverse(1, 1);
      if (t < 1) invalid = true;
    }

    if (invalid) {
      map[x][y] = 0;
    }

    map[MAP_WIDTH - 1 - x][y] = map[x][y];

  }

  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      if (map[x][y] % 16 != 0) {
        if (x < MAP_WIDTH - 1 && map[x + 1][y] % 16 == 0) map[x][y] = map[x][y] & ~EAST;
        if (x > 0 && map[x - 1][y] % 16 == 0) map[x][y] = map[x][y] & ~WEST;
        if (y < MAP_HEIGHT - 1 && map[x][y + 1] % 16 == 0) map[x][y] = map[x][y] & ~SOUTH;
        if (y > 0 && map[x][y - 1] % 16 == 0) map[x][y] = map[x][y] & ~NORTH;
      }
    }
  }

  let infiniteCheck = 0;

  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      if (map[x][y] % 16 == 0) {
        if (infiniteCheck < 100 &&
          map[x + 1][y] % 16 == 0 && map[x][y + 1] % 16 == 0 && map[x - 1][y] % 16 == 0 && map[x][y - 1] % 16 == 0 &&
          map[x + 1][y + 1] % 16 == 0 && map[x - 1][y + 1] % 16 == 0 && map[x - 1][y + 1] % 16 == 0 && map[x - 1][y - 1] % 16 == 0) {

          if (x < MAP_WIDTH / 2) {
            map[x][y] = EAST;
            map[x + 1][y] = EAST | WEST;
            map[x + 2][y] = ((map[x + 2][y] & ~NORTH) & ~SOUTH) | WEST;
            map[x + 2][y - 1] = PILL;
            map[x + 2][y + 1] = PILL;
            map[x + 2][y - 2] = map[x + 2][y - 2] & ~SOUTH;
            map[x + 2][y + 2] = map[x + 2][y + 2] & ~NORTH;
          } else {
            map[x][y] = WEST;
            map[x - 1][y] = EAST | WEST;
            map[x - 2][y] = ((map[x - 2][y] & ~NORTH) & ~SOUTH) | EAST;
            map[x - 2][y - 1] = PILL;
            map[x - 2][y + 1] = PILL;
            map[x - 2][y - 2] = map[x - 2][y - 2] & ~SOUTH;
            map[x - 2][y + 2] = map[x - 2][y + 2] & ~NORTH;
          }

          x = 1;
          y = 1;
          infiniteCheck++;

        } else {

          map[x][y] = PILL;

        }
      }
    }

  }

  let u = floor(MAP_WIDTH / 2);
  let v = floor(MAP_HEIGHT / 2);

  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (abs(i) == 2 || abs(j) == 2) {
        map[u + i][v + j] = PILL;
      } else {
        map[u + i][v + j] = 0;
      }
      
      map[u + i + 1][v + j] = map[u + i + 1][v + j] & ~WEST;
      map[u + i - 1][v + j] = map[u + i - 1][v + j] & ~EAST;
      map[u + i][v + j + 1] = map[u + i][v + j + 1] & ~NORTH;
      map[u + i][v + j - 1] = map[u + i][v + j - 1] & ~SOUTH;
    }
  }

  if (map[u - 1][v - 3] == 0 && map[u + 1][v - 3] == 0) {
    map[u - 1][v - 3] = EAST;
    map[u][v - 3] = EAST | WEST;
    map[u + 1][v - 3] = WEST;
  }

  if (map[u - 1][v + 3] == 0 && map[u + 1][v + 3] == 0) {
    map[u - 1][v + 3] = EAST;
    map[u][v + 3] = EAST | WEST;
    map[u + 1][v + 3] = WEST;
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
}

function keyPressed() {

  if (keyCode === LEFT_ARROW) {
    MAP_WIDTH -= 4;
    if (MAP_WIDTH < 11) MAP_WIDTH = 11;
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

  background(0, 0, 64);

  let size = floor(min(windowWidth / MAP_WIDTH, windowHeight / (MAP_HEIGHT + 1)));
  let xOffset = windowWidth / 2 - (MAP_WIDTH / 2) * size;
  let yOffset = windowHeight / 2 - ((MAP_HEIGHT - 1) / 2) * size;

  //textSize(14);
  //fill(255, 255, 255);
  //textAlign(CENTER, CENTER);

  for (let i = 0; i < MAP_WIDTH; i++) {
    //text(i, (i + 1.5) * size, size / 2)
    for (let j = 0; j < MAP_HEIGHT; j++) {
      //if (i == 0) text(j, size / 2, (j + 1.5) * size);

      tint(colours[i][j].r, colours[i][j].g, colours[i][j].b);

      if (map[i][j] > 0) {
        image(walltiles[map[i][j] % 16], i * size + xOffset, j * size + yOffset, size, size);
      } 

    }
  }

}
