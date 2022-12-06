const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

import { Input } from "/input.js";
var input = new Input(canvas);

var deltaTimeStr;
function update(deltaTime) {
  deltaTimeStr = deltaTime.toPrecision(5);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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
  input.update();

  // drawing
  draw();
}

start();