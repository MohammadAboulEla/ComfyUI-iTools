import { SmartWidget } from "./SmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartSwitch extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    this.isOn = true;
    this.handleWidth = this.width / 2;
    this.handleHeight = this.height;
    this.handleColor = "#80a1c0";
    this.trackColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.trackHeight = this.height / 4;
    this.onValueChange = null;

    this.textOn = "On";
    this.textOff = "Off";
    this.textOnColor = this.isOn ? "black" : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textOffColor = this.isOn ? LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white" : "black";
    this.textYoffset = 0.8;
    this.textXoffset = 0.0;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";

    //Apply options if provided
    Object.assign(this, options);
  }

  handleDown() {
    if (this.isMouseIn()) {
      this.callClick();
    }
  }

  callClick() {
    this.isOn = !this.isOn;
    this.textOnColor = this.isOn ? "black" : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textOffColor = this.isOn ? LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white" : "black";
    if (this.onValueChange) this.onValueChange(this.isOn);
  }

  handleMove() {}

  handleClick() {}

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
    super.draw(ctx);
    const trackY = this.myY + (this.handleHeight - this.height) / 2;

    // Draw the track
    ctx.fillStyle = this.trackColor;
    ctx.beginPath();
    ctx.roundRect(this.myX, trackY, this.width, this.height, 5);
    ctx.fill();

    // Calculate handle position correctly
    const handleX = this.isOn ? this.myX : this.myX + this.width / 2;

    // Draw the handle
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(handleX, this.myY, this.handleWidth, this.handleHeight, 5);
    ctx.fill();

    // Draw text on
    ctx.fillStyle = this.textOnColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(this.textOn, this.myX + this.width / 4, this.myY + this.height / 2 + this.textYoffset);

    // Draw text off
    ctx.fillStyle = this.textOffColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(
      this.textOff,
      this.myX + this.width / 2 + this.width / 4,
      this.myY + this.height / 2 + this.textYoffset
    );
  }
}
