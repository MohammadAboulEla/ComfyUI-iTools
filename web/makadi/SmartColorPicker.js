import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartColorPicker extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.myX = x;
    this.myY = y;
    this.width = width;
    this.height = height;

    this.ctx = null;
    this.heightDisplay = 20;
    this.selectedColor = null;
    this.isVisible = false;
    this.allowDisplayColor = true;
    this.isSelecting = false;
    this.onValueChange = null;

    // Add self to the node
    node.addCustomWidget(this);
  }

  openHidden() {
    this.isVisible = true;
    this.isGhost = true;
  }

  open() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.isSelecting = false;
    this.isGhost = false;
  }

  handleDown(e) {}

  handleMove(e) {
    if (!this.isMouseDown()) {
      this.isVisible = false;
      this.isGhost = false;
      this.isSelecting = false;
    } else {
      this.isSelecting = true;
    }
  }

  handleDrag(e) {
    // BUGGED
    //if(this.allowPickVis) app.canvas.canvas.style.cursor = "url('/cursor/colorSelect.png') 15 25, auto";
  }

  toggleShow() {
    this.isVisible = !this.isVisible;
  }

  draw(ctx) {
    const transparentColor = "rgba(0, 0, 0, 0.0)"; // 100% transparency (semi-transparent red)

    // Ensure the context is set
    if (this.ctx === null) this.ctx = ctx;
    if (!this.isVisible) return;

    // Create a horizontal gradient for hue
    const hueGradient = ctx.createLinearGradient(this.myX, this.myY, this.myX + this.width, this.myY);
    hueGradient.addColorStop(0, "red");
    hueGradient.addColorStop(0.17, "orange");
    hueGradient.addColorStop(0.34, "yellow");
    hueGradient.addColorStop(0.51, "green");
    hueGradient.addColorStop(0.68, "blue");
    hueGradient.addColorStop(0.85, "indigo");
    hueGradient.addColorStop(1, "violet");

    // Fill the canvas with the hue gradient
    ctx.fillStyle = this.isGhost ? transparentColor : hueGradient;
    ctx.fillRect(this.myX, this.myY, this.width, this.height);

    // Create a vertical gradient for brightness
    const brightnessGradient = ctx.createLinearGradient(this.myX, this.myY, this.myX, this.myY + this.height);
    brightnessGradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // White
    brightnessGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)"); // Transparent
    brightnessGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)"); // Transparent
    brightnessGradient.addColorStop(1, "rgba(0, 0, 0, 1)"); // Black

    // Use global composite operation to blend the gradients
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = this.isGhost ? transparentColor : brightnessGradient;
    ctx.fillRect(this.myX, this.myY, this.width, this.height);

    // Reset the global composite operation to default
    ctx.globalCompositeOperation = "source-over";

    if (this.allowDisplayColor && !this.isGhost) this.displaySelectedColor(ctx);
  }

  setColorUnderCursor(event) {
    if (!this.isSelecting) return;
    if (!this.ctx) return;
    const rect = this.ctx.canvas.getBoundingClientRect();

    const scaleX = this.ctx.canvas.width / rect.width;
    const scaleY = this.ctx.canvas.height / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    const pixel = this.ctx.getImageData(canvasX, canvasY, 1, 1).data;
    this.selectedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    if (this.onValueChange) this.onValueChange(this.selectedColor);
  }

  displaySelectedColor(ctx) {
    // // Clear a small area below the canvas to display the selected color
    // this.ctx.clearRect(0, this.canvas.height - 30, this.canvas.width, 30); // Adjusted coordinates
    //if(!this.selectedColor) return;
    ctx.fillStyle = this.selectedColor;
    ctx.fillRect(this.myX, this.myY + this.height, this.width, this.heightDisplay); // Adjusted coordinates
    // // Add text to show the RGB value
    // this.ctx.fillStyle = "#000";
    // this.ctx.font = "16px Arial";
    // this.ctx.fillText(
    //   `Selected Color: ${this.selectedColor}`,
    //   10,
    //   this.canvas.height - 10
    // ); // Adjusted coordinates
  }

  isMouseIn(x, y) {
    return x >= this.myX && x <= this.myX + this.width && y >= this.myY && y <= this.myY + this.height;
  }
}