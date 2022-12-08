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
var playerX = 5.5;
var playerY = 3.5;
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
  if (mapData[Math.floor(newPlayerX) + mapWidth * Math.floor(playerY)] == 0) {
    playerX = newPlayerX;
  }

  // check Y collision
  if (mapData[Math.floor(playerX) + mapWidth * Math.floor(newPlayerY)] == 0) {
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
  // clear ray list
  rays = [];
  for (var x = 0; x < offscreenCanvas.width; x++) {
    // calculcate camera space
    var cameraX = 2 * x / offscreenCanvas.width - 1;
    var rayDX = playerDX + cameraPlaneX * cameraX;
    var rayDY = playerDY + cameraPlaneY * cameraX;

    // what index of the map we are in
    var mapPosX = Math.floor(playerX);
    var mapPosY = Math.floor(playerY);

    var rayLength = 0;

    // dda step values
    // https://lodev.org/cgtutor/images/raycastdelta.gif
    var sideDistX;
    var sideDistY;
    
    //var deltaDistX = Math.sqrt(1 + (rayDY * rayDY) / (rayDX * rayDX));
    //var deltaDistY = Math.sqrt(1 + (rayDX * rayDX) / (rayDY * rayDY));
    var deltaDistX = Math.abs(1 / rayDX);
    var deltaDistY = Math.abs(1 / rayDY);

    var cameraPlaneDist;

    // direction of step
    var stepDX;
    var stepDY;
  
    // while the ray has not hit anything, continue to step it forwards
    var hit = false;
    var side; // Y facing wall or X facing wall

    // calculate step direction and initial side dist
    if (rayDX < 0) {
      stepDX = -1;
      sideDistX = (playerX - mapPosX) * deltaDistX;
    } else {
      stepDX = 1;
      sideDistX = (mapPosX + 1.0 - playerX) * deltaDistX;
    }

    if (rayDY < 0) {
      stepDY = -1;
      sideDistY = (playerY - mapPosY) * deltaDistY;
    } else {
      stepDY = 1;
      sideDistY = (mapPosY + 1.0 - playerY) * deltaDistY;
    }

    // step through dda
    while (!hit) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapPosX += stepDX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapPosY += stepDY;
        side = 1;
      }

      // check if we are inside a map wall tile
      if (mapData[mapPosX + mapPosY * mapWidth] == 1) {
        hit = true;
      }
    }

    if (side == 0) {
      cameraPlaneDist = (sideDistX - deltaDistX);
    } else {
      cameraPlaneDist = (sideDistY - deltaDistY);
    }

    var rayLength;
    if (side == 0) {
      rayLength = -(deltaDistX - sideDistX);
    } else {
      rayLength = -(deltaDistY - sideDistY);
    }

    // push the ray for debug drawing
    rays.push({rayDX, rayDY, rayLength: cameraPlaneDist});

    // calculate the start and end point for drawing a vertical line
    var lineHeight = Math.floor(offscreenCanvas.height / cameraPlaneDist);
    var drawStart = Math.round(-lineHeight / 2 + offscreenCanvas.height / 2);
    if (drawStart < 0) drawStart = 0; // clamp
    var drawEnd = Math.round(lineHeight / 2 + offscreenCanvas.height / 2);
    if (drawEnd > offscreenCanvas.height) drawEnd = offscreenCanvas.height; // clamp

    // TEXTURE
    var wallX; // where along the wall was hit
    if (side == 0) {
      wallX = playerY + cameraPlaneDist * rayDY;
    } else {
      wallX = playerX + cameraPlaneDist * rayDX;
    }
    wallX -= Math.floor(wallX);

    var texX = Math.floor(wallX * textureSize);
    if (side == 0 && rayDX > 0) {
      texX = textureSize - texX - 1;
    }

    if (side == 1 && rayDY < 0) {
      texX = textureSize - texX - 1;
    }

    var textureStep = 1.0 * textureSize / lineHeight;
    var texPos = (drawStart - offscreenCanvas.height / 2 + lineHeight / 2) * textureStep;

    // draw lines
    // for shading, scale 0 to some max ray length
    var maxDistance = 3; // like a fog intensity value
    var shading = 255 * cameraPlaneDist / maxDistance;
    for (var y = drawStart; y < drawEnd; y++) {
      var texY = Math.floor(texPos);
      texPos += textureStep;

      var textureIndex = (texX + textureSize * texY) * 4;

      var r = textureData[textureIndex];
      var g = textureData[textureIndex];
      var b = textureData[textureIndex];

      var i = (x + offscreenCanvas.width * y) * 4;

      data[i] = r - r * cameraPlaneDist / maxDistance;
      data[i + 1] = g - g * cameraPlaneDist / maxDistance;
      data[i + 2] = b - b * cameraPlaneDist / maxDistance;
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
    playerX * tileSize,
    playerY * tileSize + 30, tileSize / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.closePath();

  // line for direction
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(playerX * tileSize, playerY * tileSize + 30);
  ctx.lineTo(
    playerX * tileSize + playerDX * tileSize / 2,
    playerY * tileSize + playerDY * tileSize / 2 + 30
  );
  ctx.stroke();

  // line for camera plane
  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(
    playerX * tileSize + playerDX * tileSize / 2 - cameraPlaneX * tileSize / 4,
    playerY * tileSize + playerDY * tileSize / 2 - cameraPlaneY * tileSize / 4 + 30
  );
  ctx.lineTo(
    playerX * tileSize + playerDX * tileSize / 2 + cameraPlaneX * tileSize / 4,
    playerY * tileSize + playerDY * tileSize / 2 + cameraPlaneY * tileSize / 4 + 30
  );
  ctx.stroke();

  // line for raycasts
  ctx.strokeStyle = "red";
  for (var i = 0; i < rays.length; i++)
  {
    ctx.beginPath();
    ctx.moveTo(playerX * tileSize, playerY * tileSize + 30);
    ctx.lineTo(
      playerX * tileSize + rays[i].rayDX * tileSize * rays[i].rayLength,
      playerY * tileSize + rays[i].rayDY * tileSize * rays[i].rayLength + 30
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