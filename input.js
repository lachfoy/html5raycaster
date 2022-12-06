// input
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.mouseDownOld = false;
    document.addEventListener("mousemove", this.mouseMoveHandler.bind(this));
    document.addEventListener("mousedown", this.mouseDownHandler.bind(this));
    document.addEventListener("mouseup", this.mouseUpHandler.bind(this));
  }

  mouseMoveHandler(e) {
    var rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }
  
  mouseDownHandler(e) {
    e.preventDefault();
    if (e.button == 0) {
      this.mouseDown = true;
    }
  }
  
  mouseUpHandler(e) {
    e.preventDefault();
    this.mouseDown = false;
  }
  
  isMousePressed() {
    return !this.mouseDownOld && this.mouseDown; 
  }

  update() {
    this.mouseDownOld = this.mouseDown;
  }
}