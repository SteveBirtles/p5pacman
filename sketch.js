let MAP_WIDTH = 25;
let MAP_HEIGHT = 21;

const NORTH = 0b00001;
const EAST = 0b00010;
const SOUTH = 0b00100;
const WEST = 0b01000;
const PILL = 0b10000;

let map;
let colours;

let walltiles = [];

function preload() {

  for (let i = 0; i < 16; i++) {
    walltiles.push(loadImage(i + ".png"));
  }

  generateMap();

}

let u, v;

function generateMap() {

  u = 2;
  v = 1;

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

  for (let i = 0; i < MAP_WIDTH / 2 - 1; i += 2) {
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




}

function magic(i, j) {
  if (map[i][j] % 16 != 0) {

    if (random(6) < 3) {

      if (i > j && map[i - 1][j] % 16 == 0 &&
        map[i][j + 1] % 16 != 0 && map[i][j - 1] % 16 != 0 &&
        map[i][j + 2] % 16 != 0 && map[i][j - 2] % 16 != 0) {

        map[i][j] = 0;
        map[i][j + 1] = map[i][j + 1] & ~NORTH; //colours[i][j + 1].r = 255; colours[i][j + 1].g = 0; colours[i][j + 1].b = 0;
        map[i][j - 1] = map[i][j - 1] & ~SOUTH; //colours[i][j - 1].r = 255; colours[i][j - 1].g = 128; colours[i][j - 1].b = 0;

        map[MAP_WIDTH - 1 - i][j] = 0;
        map[MAP_WIDTH - 1 - i][j + 1] = map[MAP_WIDTH - 1 - i][j + 1] & ~NORTH;
        map[MAP_WIDTH - 1 - i][j - 1] = map[MAP_WIDTH - 1 - i][j - 1] & ~SOUTH;

      } else if (map[i][j - 1] % 16 == 0 &&
        map[i + 1][j] % 16 != 0 && map[i - 1][j] % 16 != 0 &&
        map[i + 2][j] % 16 != 0 && map[i - 2][j] % 16 != 0) {

        map[i][j] = 0;
        map[i + 1][j] = map[i + 1][j] & ~WEST;
        map[i - 1][j] = map[i - 1][j] & ~EAST;

        map[MAP_WIDTH - 1 - i][j] = 0;
        map[MAP_WIDTH - 1 - (i + 1)][j] = map[MAP_WIDTH - 1 - (i + 1)][j] & ~EAST;
        map[MAP_WIDTH - 1 - (i - 1)][j] = map[MAP_WIDTH - 1 - (i - 1)][j] & ~WEST;


      }

    } else {

      if (map[i - 1][j - 1] % 16 == 0 && map[i - 1][j + 1] % 16 == 0 &&
        map[i][j + 1] % 16 != 0 && map[i][j - 1] % 16 != 0 &&
        map[i][j + 2] % 16 != 0 && map[i][j - 2] % 16 != 0 &&
        map[i - 2][j] % 16 != 0) {


        map[i][j] = ((map[i][j] | WEST) & ~NORTH) & ~SOUTH; //colours[i][j].r = 255; colours[i][j].g = 0; colours[i][j].b = 255;

        map[i][j - 1] = 0;
        map[i][j + 1] = 0;

        map[i - 1][j] = EAST | WEST; //colours[i - 1][j].r = 255; colours[i - 1][j].g = 255; colours[i - 1][j].b = 0;
        map[i - 2][j] = map[i - 2][j] | EAST; //colours[i - 2][j].r = 0; colours[i - 2][j].g = 255; colours[i - 2][j].b = 0;

        map[i][j + 2] = map[i][j + 2] & ~NORTH; //colours[i][j + 2].r = 255; colours[i][j + 2].g = 0; colours[i][j + 2].b = 255
        map[i][j - 2] = map[i][j - 2] & ~SOUTH; //colours[i][j - 2].r = 255; colours[i][j - 2].g = 0; colours[i][j - 2].b = 255;

        if (map[i][j - 2] == 0 && map[i + 1][j - 2] % 16 == 0) {
          map[i][j - 2] = EAST; colours[i][j - 2].r = 255; colours[i][j - 2].g = 0; colours[i][j - 2].b = 255;
          map[i + 1][j - 2] = EAST | WEST;
          map[i + 2][j - 2] = map[i + 2][j - 2] | WEST;
        }

        map[MAP_WIDTH - 1 - i][j] = ((map[MAP_WIDTH - 1 - i][j] | EAST) & ~NORTH) & ~SOUTH;

        map[MAP_WIDTH - 1 - i][j - 1] = 0;
        map[MAP_WIDTH - 1 - i][j + 1] = 0;

        map[MAP_WIDTH - 1 - (i - 1)][j] = EAST | WEST;
        map[MAP_WIDTH - 1 - (i - 2)][j] = map[MAP_WIDTH - 1 - (i - 2)][j] | WEST;

        map[MAP_WIDTH - 1 - i][j + 2] = map[MAP_WIDTH - 1 - i][j + 2] & ~NORTH;
        map[MAP_WIDTH - 1 - i][j - 2] = map[MAP_WIDTH - 1 - i][j - 2] & ~SOUTH;

        if (map[MAP_WIDTH - 1 - i][j - 2] == 0 && map[MAP_WIDTH - 1 - (i + 1)][j - 2] % 16 == 0) {
          map[MAP_WIDTH - 1 - i][j - 2] = WEST; colours[MAP_WIDTH - 1 - i][j - 2].r = 255; colours[MAP_WIDTH - 1 - i][j - 2].g = 0; colours[MAP_WIDTH - 1 - i][j - 2].b = 255;
          map[MAP_WIDTH - 1 - (i + 1)][j - 2] = EAST | WEST;
          map[MAP_WIDTH - 1 - (i + 2)][j - 2] = map[MAP_WIDTH - 1 - (i + 2)][j - 2] | EAST;
        }

      } else if (map[i - 1][j - 1] % 16 == 0 && map[i + 1][j - 1] % 16 == 0 &&
        map[i + 1][j] % 16 != 0 && map[i - 1][j] % 16 != 0 &&
        map[i + 2][j] % 16 != 0 && map[i - 2][j] % 16 != 0 &&
        map[i][j - 2] % 16 != 0) {

        map[i][j] = ((map[i][j] | NORTH) & ~EAST) & ~WEST; colours[i][j].r = 255; colours[i][j].g = 255; colours[i][j].b = 255;

        map[i - 1][j] = 0; colours[i - 1][j].r = 0; colours[i - 1][j].g = 0; colours[i - 1][j].b = 255;
        map[i + 1][j] = 0; colours[i + 1][j].r = 0; colours[i + 1][j].g = 0; colours[i + 1][j].b = 255;

        map[i][j - 1] = NORTH | SOUTH; colours[i][j - 1].r = 255; colours[i][j - 1].g = 0; colours[i][j - 1].b = 0;
        map[i][j - 2] = map[i][j - 2] | SOUTH; colours[i][j - 2].r = 255; colours[i][j - 2].g = 0; colours[i][j - 2].b = 0;

        map[i + 2][j] = map[i + 2][j] & ~WEST; colours[i + 2][j].r = 255; colours[i + 2][j].g = 0; colours[i + 2][j].b = 0;
        map[i - 2][j] = map[i - 2][j] & ~EAST; colours[i - 2][j].r = 255; colours[i - 2][j].g = 0; colours[i - 2][j].b = 0;

        if (map[i - 2][j] == 0 && map[i - 2][j + 1] % 16 == 0) {
          map[i - 2][j] = SOUTH; colours[i - 2][j].r = 255; colours[i - 2][j].g = 255; colours[i - 2][j].b = 0;
          map[i - 2][j + 1] = SOUTH | NORTH; colours[i - 2][j + 1].r = 255; colours[i - 2][j + 1].g = 255; colours[i - 2][j + 1].b = 0;
          map[i - 2][j + 2] = map[i - 2][j + 2] | NORTH; colours[i - 2][j + 2].r = 255; colours[i - 2][j + 2].g = 255; colours[i - 2][j + 2].b = 0;
        }

        map[MAP_WIDTH - 1 - i][j] = ((map[MAP_WIDTH - 1 - i][j] | NORTH) & ~EAST) & ~WEST; //colours[i][j].r = 255; colours[i][j].g = 255; colours[i][j].b = 255;

        map[MAP_WIDTH - 1 - (i - 1)][j] = 0; //colours[i - 1][j].r = 0; colours[i - 1][j].g = 0; colours[i - 1][j].b = 255;
        map[MAP_WIDTH - 1 - (i + 1)][j] = 0; //colours[i + 1][j].r = 0; colours[i + 1][j].g = 0; colours[i + 1][j].b = 255;

        map[MAP_WIDTH - 1 - i][j - 1] = NORTH | SOUTH; //colours[i][j - 1].r = 255; colours[i][j - 1].g = 0; colours[i][j - 1].b = 0;
        map[MAP_WIDTH - 1 - i][j - 2] = map[MAP_WIDTH - 1 - i][j - 2] | SOUTH; //colours[i][j - 2].r = 255; colours[i][j - 2].g = 0; colours[i][j - 2].b = 0;

        map[MAP_WIDTH - 1 - (i + 2)][j] = map[MAP_WIDTH - 1 - (i + 2)][j] & ~EAST; //colours[i + 2][j].r = 255; colours[i + 2][j].g = 0; colours[i + 2][j].b = 0;
        map[MAP_WIDTH - 1 - (i - 2)][j] = map[MAP_WIDTH - 1 - (i - 2)][j] & ~WEST; //colours[i - 2][j].r = 255; colours[i - 2][j].g = 0; colours[i - 2][j].b = 0;

        if (map[MAP_WIDTH - 1 - (i - 2)][j] == 0 && map[MAP_WIDTH - 1 - (i - 2)][j + 1] % 16 == 0) {
          map[MAP_WIDTH - 1 - (i - 2)][j] = SOUTH; //colours[i - 2][j].r = 255; //colours[i - 2][j].g = 255; colours[i - 2][j].b = 0;
          map[MAP_WIDTH - 1 - (i - 2)][j + 1] = SOUTH | NORTH; //colours[i - 2)][j + 1].r = 255; //colours[i - 2][j + 1].g = 255; colours[i - 2][j + 1].b = 0;
          map[MAP_WIDTH - 1 - (i - 2)][j + 2] = map[MAP_WIDTH - 1 - (i - 2)][j + 2] | NORTH; //colours[i - 2][j + 2].r = 255; colours[i - 2][j + 2].g = 255; colours[i - 2][j + 2].b = 0;
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

  if (x > 0 && map[x - 1][y].value == 0 && !history[x - 1][y]) traverse(x - 1, y, history);
  if (y > 0 && map[x][y - 1].value == 0 && !history[x][y - 1]) traverse(x, y - 1, history);
  if (x < MAP_WIDTH - 1 && map[x + 1][y].value == 0 && !history[x + 1][y]) traverse(x + 1, y, history);
  if (y < MAP_HEIGHT - 1 && map[x][y + 1].value == 0 && !history[x][y + 1]) traverse(x, y + 1, history);

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
  } else if (keyCode == 32) {

    while (u < MAP_WIDTH / 2 - 2) {
      v++;
      if (v >= MAP_HEIGHT - 2) {
        u++;
        v = 2;
      }

      colours[u][v].r = 0; colours[u][v].g = 0; colours[u][v].b = 255;
      magic(u, v);
    }

    let centre = floor((min(MAP_WIDTH, MAP_HEIGHT) - 3) / 4) * 2;

    for (let i = 0; i < MAP_WIDTH; i++) {
      for (let j = 0; j < MAP_HEIGHT; j++) {
        if (map[i][j] != 0) continue;
        if (i < centre || j < centre || i > MAP_WIDTH - 1 - centre || j > MAP_HEIGHT - 1 - centre) map[i][j] = PILL;
      }
    }

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
