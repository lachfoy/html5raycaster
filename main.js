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
var playerX = 5;
var playerY = 3;
var playerDX = 1;
var playerDY = 0;
var cameraPlaneX = 0;
var cameraPlaneY = 0.66; // 2 * atan(0.66 / 1.0) = 66 degrees

/// TEXTURE
// generate xor texture to use
var textureSize = 64;
var textureData = [];
for(var x = 0; x < textureSize; x++) {
  for(var y = 0; y < textureSize; y++) {
    var c = x ^ y;
    textureData.push(c * 4); // r
    textureData.push(c * 4); // g
    textureData.push(c * 4); // b
    textureData.push(255); // a
  }
}

/// ENTITY TEST
var objectX = 8;
var objectY = 3;

/// OFFSCREEN CANVAS
const offscreenCanvas = new OffscreenCanvas(400, 300);
const offscreenCtx = offscreenCanvas.getContext("2d");

var imageData = offscreenCtx.createImageData(
  offscreenCanvas.width,
  offscreenCanvas.height
);

var data = imageData.data;

// list of rays for debug drawing
var rays = []; // contains rayDX, rayDY, and rayLength

/// GAME STUFF
var deltaTimeStr;
function update(deltaTime) {
  /// PLAYER MOVEMENT
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
    
    // also rotate the camera plane
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

    // also rotate the camera plane
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

  // clear buffer before drawing rays
  for (var i = 0; i < data.length; i +=4 ) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  // cast ray
  var rayStepSize = 0.01; // smaller step size is more accurate, but greatly decreases performance

  // clear ray list
  rays = [];
  for (var x = 0; x < offscreenCanvas.width; x++) {
    var rayPosX = playerX;
    var rayPosY = playerY;
    var cameraX = 2 * x / offscreenCanvas.width - 1;
    var rayDX = playerDX + cameraPlaneX * cameraX;
    var rayDY = playerDY + cameraPlaneY * cameraX;
    var rayLength = 0;
  
    // while the ray has not hit anything, continue to step it forwards
    var hit = false;
    while (!hit) {
      var rayPosXOld = rayPosX;
      var rayPosYOld = rayPosY;
      var rayLengthOld = rayLength;
      rayPosX += rayStepSize * rayDX;
      rayPosY += rayStepSize * rayDY;
      rayLength += rayStepSize;
  
      // check whether the ray position is overlapping with a map tile
      // rounding is entirely necessary!!!
      if (mapData[Math.round(rayPosX) + Math.round(rayPosY) * mapWidth] == 1) {
        rayPosX = rayPosXOld;
        rayPosY = rayPosYOld;
        rayLength = rayLengthOld;
        hit = true;
      }
    }

    // push the ray for debug drawing
    rays.push({rayDX, rayDY, rayLength});

    // calculate the start and end point for drawing a vertical line
    var lineHeight = Math.round(offscreenCanvas.height / 1 / rayLength);
    var drawStart = Math.round(-lineHeight / 2 + offscreenCanvas.height / 2);
    if (drawStart < 0) drawStart = 0; // clamp
    var drawEnd = Math.round(lineHeight / 2 + offscreenCanvas.height / 2);
    if (drawEnd > offscreenCanvas.height) drawEnd = offscreenCanvas.height; // clamp

    // TEXTURE
    var wallX; // where along the wall was hit
    wallX = playerY + rayLength * rayDY;
    wallX -= Math.floor(wallX);
    var texX = Math.round(wallX * textureSize);
    texX = textureSize - texX - 1;

    // draw lines
    // for shading, scale 0 to some max ray length
    var maxDistance = 6; // like a fog intensity value
    var shading = 255 * rayLength / maxDistance;
    for (var y = drawStart; y < drawEnd; y++) {
      var i = (x + offscreenCanvas.width * y) * 4;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 255 - shading;
      data[i + 3] = 255;
    }
  }

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
    playerX * tileSize + tileSize / 2 + playerDX * tileSize / 2 - cameraPlaneX * tileSize / 4,
    playerY * tileSize + tileSize / 2 + playerDY * tileSize / 2 - cameraPlaneY * tileSize / 4 + 30
  );
  ctx.lineTo(
    playerX * tileSize + tileSize / 2 + playerDX * tileSize / 2 + cameraPlaneX * tileSize / 4,
    playerY * tileSize + tileSize / 2 + playerDY * tileSize / 2 + cameraPlaneY * tileSize / 4 + 30
  );
  ctx.stroke();

  // line for raycasts
  ctx.strokeStyle = "red";
  for (var i = 0; i < rays.length; i++)
  {
    ctx.beginPath();
    ctx.moveTo(playerX * tileSize + tileSize / 2, playerY * tileSize + tileSize / 2 + 30);
    ctx.lineTo(
      playerX * tileSize + tileSize / 2 + rays[i].rayDX * tileSize * rays[i].rayLength,
      playerY * tileSize + tileSize / 2 + rays[i].rayDY * tileSize * rays[i].rayLength + 30
    );
    ctx.stroke();
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