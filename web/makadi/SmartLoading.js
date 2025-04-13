import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartLoading extends BaseSmartWidget {
  constructor(x, y, node) {
    super(node);
    this.myX = x;
    this.myY = y;
    this.radius = 20;
    this.angle = 0;
    this.color = "#cd7f32";
    this.lineWidth = 8;
    this.allowInnerCircle = true;
    this.innerCircleColor = "rgba(255, 255, 255, 0.5)";
    this.isVisible = false;

    // this.maxTime = 20000

    // setTimeout(() => {
    //   this.isVisible = false
    // }, this.maxTime);

    // add self to the node
    node.addCustomWidget(this);
  }
  handleMove() {
    this.angle += 0.1;
  }

  draw(ctx) {
    if (!this.isVisible) return;
    if (!this.ctx) this.ctx = ctx;
    //Draw circle
    if (this.allowInnerCircle) {
      ctx.beginPath();
      ctx.arc(this.myX, this.myY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.innerCircleColor;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(this.myX, this.myY, this.radius, this.angle, this.angle + Math.PI / 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
    this.node.setDirtyCanvas(true, true);
  }
}
