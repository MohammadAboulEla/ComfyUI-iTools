import { SmartWidget } from "./SmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartCheckBox extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    this.isChecked = true;
    this.gap = 4;
    // this.handleWidth = this.width - this.gap;
    // this.handleHeight = this.height - this.gap;
    this.handleColor = "#80a1c0";
    this.bgColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.bgHeight = this.height;
    this.onValueChange = null;

    //Apply options if provided
    Object.assign(this, options);
  }

  handleDown() {
    if (this.isMouseIn()) {
      this.isChecked = !this.isChecked;
    }
  }

  handleMove() {}

  handleClick() {
    if (this.onValueChange) this.onValueChange();
  }

  isMouseInHandle() {
    const { x, y } = this.mousePos;
    return (
      x >= this.handleX &&
      x <= this.handleX + this.handleWidth &&
      y >= this.handleY &&
      y <= this.handleY + this.handleHeight
    );
  }

  draw(ctx) {
    // Draw the background
    ctx.fillStyle = this.trackColor;
    ctx.beginPath();
    ctx.roundRect(this.myX, this.myY, this.width, this.height, 5);
    ctx.fill();

    // Draw the handle
    if (!this.isChecked) return;
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(
      this.myX + this.gap / 2,
      this.myY + this.gap / 2,
      this.width - this.gap,
      this.height - this.gap,
      5 - this.gap / 2
    );
    ctx.fill();
  }
}
