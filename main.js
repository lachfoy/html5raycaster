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
  if (e.key == "ArrowUp" || e.key == "w") {
    upPressed = true;
  }
  if (e.key == "ArrowDown" || e.key == "s") {
    downPressed = true;
  }
  if (e.key == "ArrowLeft" || e.key == "a") {
    leftPressed = true;
  }
  if (e.key == "ArrowRight" || e.key == "d") {
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
var playerDX = 1;
var playerDY = 0;
var cameraPlaneX = 0;
var cameraPlaneY = 1;

/// OFFSCREEN CANVAS
const offscreenCanvas = new OffscreenCanvas(32, 32);
const offscreenCtx = offscreenCanvas.getContext("2d");

var xorAnimationCounter = 0;

var imageData = offscreenCtx.createImageData(
  offscreenCanvas.width,
  offscreenCanvas.height
);

var data = imageData.data;

/// GAME STUFF
var deltaTimeStr;
function update(deltaTime) {
  var newPlayerX;
  var newPlayerY;

  if (isUpPressed()) {
    // move forward
    newPlayerX = playerX + playerDX;
    newPlayerY = playerY + playerDY;
  }

  if (isDownPressed()) {
    // move backwards
    newPlayerX = playerX - playerDX;
    newPlayerY = playerY - playerDY;
  }

  if (isLeftPressed()) {
    // rotate 90 degrees counter-clockwise
    var oldPlayerDX = playerDX;
    var oldPlayerDY = playerDY;
    playerDX = oldPlayerDY;
    playerDY = -oldPlayerDX;
    
    var oldCameraPlaneX = cameraPlaneX;
    var oldCameraPlaneY = cameraPlaneY;
    cameraPlaneX = oldCameraPlaneY;
    cameraPlaneY = -oldCameraPlaneX;
  }

  if (isRightPressed()) {
    // rotate 90 degrees clockwise
    var oldPlayerDX = playerDX;
    var oldPlayerDY = playerDY;
    playerDX = -oldPlayerDY;
    playerDY = oldPlayerDX;

    var oldCameraPlaneX = cameraPlaneX;
    var oldCameraPlaneY = cameraPlaneY;
    cameraPlaneX = -oldCameraPlaneY;
    cameraPlaneY = oldCameraPlaneX;
  }

  // check X collision
  if (mapData[newPlayerX + mapWidth * playerY] == 0) {
    playerX = newPlayerX;
  }

  // check Y collision
  if (mapData[playerX + mapWidth * newPlayerY] == 0) {
    playerY = newPlayerY;
  }

  // animation thing, delete this later
  xorAnimationCounter++;

  // get delta time for display
  deltaTimeStr = deltaTime.toPrecision(5);
}

ctx.imageSmoothingEnabled = false;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw map
  const tileSize = 28;
  ctx.strokeStyle = "black";
  for (var x = 0; x < mapWidth; x++) {
    for (var y = 0; y < mapHeight; y++) {
      if (mapData[x + mapWidth * y] == 1) {
        ctx.strokeRect(x * tileSize, y * tileSize + 30, tileSize, tileSize);
      }
    }
  }

  // draw player
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(
    playerX * tileSize + tileSize / 2,
    playerY * tileSize + tileSize / 2 + 30, tileSize / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.closePath();

  // line for direction
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(playerX * tileSize + tileSize / 2, playerY * tileSize + tileSize / 2 + 30);
  ctx.lineTo(
    playerX * tileSize + tileSize / 2 + playerDX * tileSize / 2,
    playerY * tileSize + tileSize / 2 + playerDY * tileSize / 2 + 30
  );
  ctx.stroke();

  // line for camera plane
  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(
    playerX * tileSize + tileSize / 2 + playerDX * tileSize / 2 - cameraPlaneX * tileSize / 2,
    playerY * tileSize + tileSize / 2 + playerDY * tileSize / 2 - cameraPlaneY * tileSize / 2 + 30
  );
  ctx.lineTo(
    playerX * tileSize + tileSize / 2 + playerDX * tileSize / 2 + cameraPlaneX * tileSize / 2,
    playerY * tileSize + tileSize / 2 + playerDY * tileSize / 2 + cameraPlaneY * tileSize / 2 + 30
  );
  ctx.stroke();

  // draw xor texture to image data
  for (var x = 0; x < offscreenCanvas.width; x++) {
    for (var y = 0; y < offscreenCanvas.height; y++) {
      var c = x ^ y;
      var i = (x + offscreenCanvas.width * y) * 4;
      data[i] = xorAnimationCounter % 255;
      data[i + 1] = xorAnimationCounter % 255 - c * 8;
      data[i + 2] = c % 128 * 8;
      data[i + 3] = 255;
    }
  }

  // copy the image data to the offscreen canvas
  offscreenCtx.putImageData(imageData, 0, 0);

  // draw offscreen canvas on main canvas
  ctx.drawImage(offscreenCanvas, 288, 0, 512, 384);

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