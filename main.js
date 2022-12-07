const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/// INPUT STUFF
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var upPressed = false;
var downPressed = false;
var leftPressed = false;
var rightPressed = false;

var upPressedOld = false;
var downPressedOld = false;
var leftPressedOld = false;
var rightPressedOld = false;

function keyDownHandler(e) {
  if (e.key == "ArrowUp") {
    upPressed = true;
  }
  if (e.key == "ArrowDown") {
    downPressed = true;
  }
  if (e.key == "ArrowLeft") {
    leftPressed = true;
  }
  if (e.key == "ArrowRight") {
    rightPressed = true;
  }
}

function keyUpHandler() {
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;
}

function isUpPressed() {
  return upPressed && !upPressedOld;
}

function isDownPressed() {
  return downPressed && !downPressedOld;
}

function isLeftPressed() {
  return leftPressed && !leftPressedOld;
}

function isRightPressed() {
  return rightPressed && !rightPressedOld;
}

function updateInput() {
  upPressedOld = upPressed;
  downPressedOld = downPressed;
  leftPressedOld = leftPressed;
  rightPressedOld = rightPressed;
}

/// MAP STUFF
var mapWidth = 10;
var mapHeight = 10;

// 10x10 map data as 1d string
var mapData = "1111111111";
   mapData += "1000000101";
   mapData += "1011110101";
   mapData += "1010000001";
   mapData += "1010111011";
   mapData += "1000100001";
   mapData += "1010001101";
   mapData += "1010111001";
   mapData += "1010000011";
   mapData += "1111111111";

/// PLAYER STUFF
var playerX = 1;
var playerY = 1;

/// GAME STUFF
var deltaTimeStr;
function update(deltaTime) {
  var newPlayerY;
  var newPlayerX;

  if (isUpPressed()) {
    newPlayerY = playerY - 1;
  }

  if (isDownPressed()) {
    newPlayerY = playerY + 1;
  }

  if (isLeftPressed()) {
    newPlayerX = playerX - 1;
  }

  if (isRightPressed()) {
    newPlayerX = playerX + 1;
  }

  // check X collision
  if (mapData[newPlayerX + mapWidth * playerY] == 0) {
    playerX = newPlayerX;
  }

  // check Y collision
  if (mapData[playerX + mapWidth * newPlayerY] == 0) {
    playerY = newPlayerY;
  }

  // get delta time for display
  deltaTimeStr = deltaTime.toPrecision(5);
}

ctx.imageSmoothingEnabled = false;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw map
  const tileSize = 32;
  for (var x = 0; x < mapWidth; x++) {
    for (var y = 0; y < mapHeight; y++) {
      if (mapData[x + mapWidth * y] == 1) {
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  // draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(playerX * tileSize, playerY * tileSize, tileSize, tileSize);

  // draw delta time
  ctx.fillStyle = "black";
  ctx.font = '14px monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = 'top';
  ctx.fillText("deltaTime: " + deltaTimeStr, 10, 10);
}

function start() {
  requestAnimationFrame(mainloop);
}

var lastTimestamp = 0;
function mainloop(timestamp) {
  requestAnimationFrame(mainloop);

  // calculate delta time
  var deltaTime = (timestamp - lastTimestamp) / 1000.0;
  lastTimestamp = timestamp;
  // at 75hz should be about 0.01333~

  // updating
  update(deltaTime);
  updateInput();

  // drawing
  draw();
}

start();