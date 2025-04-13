import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartPreview extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.myX = x;
    this.myY = y;
    this.width = width;
    this.height = height;

    this.brushSize = 10;
    this.color = "rgba(128, 128, 128, 0.2)"; // 50% transparent gray
    this.dashColor = "black";
    this.widthLimit = this.width;
    this.heightLimit = this.height;
    this.myYOffset = 80;
    this.myXOffset = 0;
    this.isVisible = true;
    this.allowInnerCircle = false;
    this.init();

    // add self to the node
    node.addCustomWidget(this);
  }

  updateBrushSize(size) {
    this.brushSize = size;
  }

  init() {
    //init preview canvas
    this.previewCanvas = document.createElement("canvas");
    this.previewCanvas.width = this.brushSize; //app.canvasContainer.width;
    this.previewCanvas.height = this.brushSize; //app.canvasContainer.height;
    this.previewCtx = this.previewCanvas.getContext("2d");
  }

  draw(ctx) {
    // ctx.fillStyle = "red"
    // ctx.fillRect(this.myX, this.myY, this.width, this.height);
    const { x, y } = this.mousePos;
    if (!this.isVisible) return;
    // if (x > this.widthLimit) return;
    // if (y > this.heightLimit) return;
    if (y < this.myYOffset) return;
    if (!this.isMouseIn(x, y)) return;
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
    ctx.fillStyle = this.allowInnerCircle ? this.color : "rgba(255, 255, 255, 0)";
    ctx.fill();

    // Draw dotted outline
    ctx.setLineDash([3, 3]); // [dash length, gap length]
    ctx.strokeStyle = this.dashColor; // Outline color
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash to solid
  }
  isMouseIn(x, y) {
    return x >= this.myX && x <= this.myX + this.width && y >= this.myY && y <= this.myY + this.height;
  }
  handleMove() {
    // AUTO PIN
    const safeZone = 50;
    const { x, y } = this.mousePos;
    if (y > 30 && y < this.node.height + safeZone) {
      if (x > this.node.width + safeZone || x < -safeZone) {
        this.node.flags.pinned = false;
      } else {
        this.node.flags.pinned = true;
      }
    } else {
      this.node.flags.pinned = false;
    }
  }
}