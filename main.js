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
var playerAngle = 0;

// player animation queue stores n number of player position states and animates smoothly between them
const maxTransformStates = 1;
var transformStateQueue = [];
const timeToCompletePerAnimation = 0.5;
var currentTimeToCompleteTimer = 0.0;

/// TEXTURES
const spriteImg = document.getElementById("spriteImg");
const wallImg = document.getElementById("wallImg");
const imgLoaderCanvas = new OffscreenCanvas(wallImg.width, wallImg.height);
const imgLoaderCtx = imgLoaderCanvas.getContext("2d");
imgLoaderCtx.drawImage(wallImg, 0, 0);
const wallImgData = imgLoaderCtx.getImageData(0, 0, imgLoaderCanvas.width, imgLoaderCanvas.height).data;

/// ENTITY TEST
var spriteX = 7.5;
var spriteY = 3.5;
var spriteScreenX;
var spriteHeight;

/// OFFSCREEN CANVAS
const offscreenCanvas = new OffscreenCanvas(200, 150);
const offscreenCtx = offscreenCanvas.getContext("2d");

var imageData = offscreenCtx.createImageData(
  offscreenCanvas.width,
  offscreenCanvas.height
);
offscreenCtx.imageSmoothingEnabled = false;

// offscreen canvas pixel buffer
var data = imageData.data;

// 1d depth buffer
var zBuffer = new Float32Array(offscreenCanvas.width);

// list of rays for debug drawing
var rays = []; // contains rayDX, rayDY, and rayLength

/// GAME STUFF
var deltaTimeStr;
function update(deltaTime) {
  /// PLAYER MOVEMENT
  // player can ONLY move if the animation queue has a free spot. otherwise the animation queue has to "catch up"
  if (transformStateQueue.length < maxTransformStates) {
    // get an "empty" state struct to fill
    var newTransformState = {
      playerX,
      playerY,
      playerAngle
    };

    var transformStateChanged = false; // set this to true whenever the player requests a new state

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
      newTransformState.playerAngle = playerAngle - 1.5708; // approx 90 degrees in radians
      transformStateChanged = true;
    }

    if (isRightPressed()) {
      // rotate 90 degrees clockwise
      newTransformState.playerAngle = playerAngle + 1.5708; // approx 90 degrees in radians
      transformStateChanged = true;
    }

    // check X collision
    if (mapData[Math.floor(newPlayerX) + mapWidth * Math.floor(playerY)] == 0) {
      //playerX = newPlayerX;
      newTransformState.playerX = newPlayerX;
      transformStateChanged = true;
    }

    // check Y collision
    if (mapData[Math.floor(playerX) + mapWidth * Math.floor(newPlayerY)] == 0) {
      //playerY = newPlayerY;
      newTransformState.playerY = newPlayerY;
      transformStateChanged = true;
    }
    
    // helper, not used
    const stateAlreadyExists = (transformState) => {
      transformStateQueue.forEach(state => {
        if (transformState.playerX == state.playerX &&
          transformState.playerY == state.playerY) {
          return true;
        }
      });
      return false;
    }

    // only push to the queue if the state has changed
    if (transformStateChanged) {
      transformStateQueue.push(newTransformState);
    }
  }

  /// PLAYER VIEW ANIMATION
  // if there are any states to animate
  if (transformStateQueue.length > 0) {
    if (currentTimeToCompleteTimer < timeToCompletePerAnimation) {
      // completion scaled to a 0 to 1 range
      var currentCompletion = currentTimeToCompleteTimer / timeToCompletePerAnimation;

      // lerp from current position to the first position state in the queue
      playerX += (transformStateQueue[0].playerX - playerX) * currentCompletion;
      playerY += (transformStateQueue[0].playerY - playerY) * currentCompletion;

      // lerp from current angle to first angle in queue
      playerAngle += (transformStateQueue[0].playerAngle - playerAngle) * currentCompletion;

      // apply rotations
      playerDX = Math.cos(playerAngle);
      playerDY = Math.sin(playerAngle);

      // also rotate the camera plane (perpendicularly)
      cameraPlaneX = Math.sin(-playerAngle) * 0.66; // make sure to resize the camera back to its original fov
      cameraPlaneY = Math.cos(playerAngle) * 0.66; // make sure to resize the camera back to its original fov
  
      currentTimeToCompleteTimer += deltaTime;
    } else {
      transformStateQueue.shift(); // remove the first item on the queue
      currentTimeToCompleteTimer = 0.0; // reset the timer to 0
    }
  }

  // draw a blank background
  // also serves to overwrite the previous data
  var bigIntColor = parseInt("000000", 16);
  for (var i = 0; i < data.length; i +=4 ) {
    data[i] = (bigIntColor >> 16) & 255;
    data[i + 1] = (bigIntColor >> 8) & 255;
    data[i + 2] = bigIntColor & 255;
    data[i + 3] = 255;
  }


  // clear ray list, debug only
  rays = [];

  // cast ray
  for (var x = 0; x < offscreenCanvas.width; x++) {
    // calculcate camera space
    var cameraX = 2 * x / offscreenCanvas.width - 1;
    var rayDX = playerDX + cameraPlaneX * cameraX;
    var rayDY = playerDY + cameraPlaneY * cameraX;

    // what index of the map we are in
    var mapPosX = Math.floor(playerX);
    var mapPosY = Math.floor(playerY);

    // dda step values
    // https://lodev.org/cgtutor/images/raycastdelta.gif
    var sideDistX;
    var sideDistY;
    
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

    // push the ray for debug drawing
    rays.push({ rayDX, rayDY, cameraPlaneDist });

    // calculate the start and end point for drawing a vertical line
    var lineHeight = Math.floor(offscreenCanvas.height / cameraPlaneDist);
    var drawStart = Math.round(-lineHeight / 2 + offscreenCanvas.height / 2);
    if (drawStart < 0) drawStart = 0; // clamp
    var drawEnd = Math.round(lineHeight / 2 + offscreenCanvas.height / 2);
    if (drawEnd > offscreenCanvas.height) drawEnd = offscreenCanvas.height; // clamp

    // texture mapping
    var wallX; // where along the wall was hit
    if (side == 0) {
      wallX = playerY + cameraPlaneDist * rayDY;
    } else {
      wallX = playerX + cameraPlaneDist * rayDX;
    }
    wallX -= Math.floor(wallX);

    var texX = Math.floor(wallX * wallImg.width);
    if (side == 0 && rayDX > 0) {
      texX = wallImg.width - texX - 1;
    }

    if (side == 1 && rayDY < 0) {
      texX = wallImg.width - texX - 1;
    }

    var textureStep = 1.0 * wallImg.width / lineHeight;
    var texPos = (drawStart - offscreenCanvas.height / 2 + lineHeight / 2) * textureStep;

    // linear fog caluclation
    var fogStart = 4;
    var fogFinish = 8;
    var fogFactor = (fogFinish - cameraPlaneDist) / (fogFinish - fogStart);
    var fogColorR = 0;
    var fogColorG = 0;
    var fogColorB = 0;

    // draw lines
    for (var y = drawStart; y < drawEnd; y++) {
      // get the texture color
      var texY = Math.floor(texPos);
      texPos += textureStep;
      var textureIndex = (texX + wallImg.width * texY) * 4;
      var textureColorR = wallImgData[textureIndex];
      var textureColorG = wallImgData[textureIndex + 1];
      var textureColorB = wallImgData[textureIndex + 2];

      // darken the color on Y facing walls
      if (side == 1) {
        textureColorR /= 2;
        textureColorG /= 2;
        textureColorB /= 2;
      }

      // apply fog
      var finalR = (1 - fogFactor) * fogColorR + fogFactor * textureColorR;
      var finalG = (1 - fogFactor) * fogColorG + fogFactor * textureColorG;
      var finalB = (1 - fogFactor) * fogColorB + fogFactor * textureColorB;

      // draw the pixel
      var i = (x + offscreenCanvas.width * y) * 4;
      data[i] = finalR;
      data[i + 1] = finalG;
      data[i + 2] = finalB;
      data[i + 3] = 255;
    }

    // write to the z buffer
    zBuffer[x] = cameraPlaneDist;
  }

  // for distance sorting, not used currently
  var spriteDistance = (
    (playerX - spriteX) * (playerX - spriteX) +
    (playerY - spriteY) * (playerY - spriteY)
  );

  // translation
  var spriteXTranslated = spriteX - playerX;
  var spriteYTranslated = spriteY - playerY;

  // inverse camera matrix
  var invDet = 1.0 / (cameraPlaneX * playerDY - playerDX * cameraPlaneY);

  var spriteTransformX = invDet * (playerDY * spriteXTranslated - playerDX * spriteYTranslated);
  var spriteTransformY = invDet * (-cameraPlaneY * spriteXTranslated + cameraPlaneX * spriteYTranslated); // depth

  spriteScreenX = Math.floor((offscreenCanvas.width / 2) * (1 + spriteTransformX / spriteTransformY));
  spriteHeight = Math.abs(Math.floor(offscreenCanvas.height / spriteTransformY));

  // get delta time for display
  deltaTimeStr = deltaTime.toPrecision(5);
}

ctx.imageSmoothingEnabled = false;
function draw() {
  // copy the image data to the offscreen canvas
  offscreenCtx.putImageData(imageData, 0, 0);

  // test drawing sprite onto the offscreen canvas
  // offscreenCtx.drawImage(
  //   spriteImg,
  //   spriteScreenX - spriteHeight / 2,
  //   offscreenCanvas.height / 2 - spriteHeight / 2,
  //   spriteHeight, spriteHeight
  // );

  const tileSize = 16;
  const xOffset = canvas.width - mapWidth * tileSize;
  const yOffset = canvas.height - mapHeight * tileSize;

  // draw offscreen canvas on main canvas
  ctx.drawImage(offscreenCanvas, 0, 0, xOffset, yOffset);

  // draw mini-map
  if (1) {
    ctx.fillStyle = "white";
    ctx.fillRect(xOffset, 0, mapWidth * tileSize, mapHeight * tileSize);
    ctx.fillStyle = "black";
    for (var x = 0; x < mapWidth; x++) {
      for (var y = 0; y < mapHeight; y++) {
        if (mapData[x + mapWidth * y] == 1) {
          ctx.fillRect(x * tileSize + xOffset, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // minimap lines for raycasts
    ctx.strokeStyle = "#ff000011";
    for (var i = 0; i < rays.length; i++)
    {
      ctx.beginPath();
      ctx.moveTo(playerX * tileSize + xOffset, playerY * tileSize);
      ctx.lineTo(
        playerX * tileSize + rays[i].rayDX * tileSize * rays[i].cameraPlaneDist + xOffset,
        playerY * tileSize + rays[i].rayDY * tileSize * rays[i].cameraPlaneDist
      );
      ctx.stroke();
    }

    // mini-map draw player
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(
      playerX * tileSize + xOffset,
      playerY * tileSize,
      tileSize / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.closePath();

    // mini-map line for direction
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(playerX * tileSize + xOffset, playerY * tileSize);
    ctx.lineTo(
      playerX * tileSize + playerDX * tileSize / 2 + xOffset,
      playerY * tileSize + playerDY * tileSize / 2
    );
    ctx.stroke();

    // mini-map line for camera plane
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(
      playerX * tileSize + playerDX * tileSize / 2 - cameraPlaneX * tileSize / 2 + xOffset,
      playerY * tileSize + playerDY * tileSize / 2 - cameraPlaneY * tileSize / 2
    );
    ctx.lineTo(
      playerX * tileSize + playerDX * tileSize / 2 + cameraPlaneX * tileSize / 2 + xOffset,
      playerY * tileSize + playerDY * tileSize / 2 + cameraPlaneY * tileSize / 2
    );
    ctx.stroke();

    // mini-map draw sprite
    // ctx.fillStyle = "purple";
    // ctx.beginPath();
    // ctx.arc(
    //   spriteX * tileSize + xOffset,
    //   spriteY * tileSize,
    //   tileSize / 4,
    //   0,
    //   Math.PI * 2
    // );
    // ctx.fill();
    // ctx.closePath();
  }

  // draw delta time
  ctx.fillStyle = "red";
  ctx.font = '12px monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = 'top';
  ctx.fillText("" + deltaTimeStr, 10, 10);
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