import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { Shapes } from "../utils.js";
import { allow_debug } from "../js_shared.js";

export class SmartInfo extends BaseSmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(node);

    this.myX = x;
    this.myY = y;
    this.width = width;
    this.height = height;

    this.originalWidth = width;
    this.originalHeight = height;
    this.originalY = y;

    this.radius = width / 2;
    this._shape = Shapes.ROUND;

    this.color = LiteGraph.WIDGET_BGCOLOR || "crimson";

    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = 0.8;

    this.text = text;
    this.textWidth = null;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.7;
    this.textXoffset = 0.0;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";

    this.previewDuration = 2000;
    this.done = true;

    // Apply options if provided
    Object.assign(this, options);
    this.originalColor = this.color; // Store original color
    this.originalTextColor = this.textColor;

    // add self to the node
    node.addCustomWidget(this);

    this.autoStart = false;
    if (this.autoStart) {
      this.start();
    }
  }

  handleDown() {}

  handleClick() {}

  handleMove() {}

  start() {
    this.throttledFunction =
      this.throttledFunction ||
      this.throttle(() => {
        // start
        this.done = false;
        // clean
        setTimeout(() => {
          this.clean();
        }, this.previewDuration);
      }, 200);

    this.throttledFunction(); // Call the throttled function
  }

  throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  clean() {
    this.done = true;
    this.width = this.originalWidth;
    this.height = this.originalHeight;
    this.myY = this.originalY;
    this.color = this.originalColor;
    this.textColor = this.originalTextColor;
  }

  showWarning(msg, newWidth = 120, newColor = "#cd7f32") {
    this.color = newColor;
    this.textColor = "black";
    this.restart(msg, newWidth, 85 + 20, 20);
  }

  show(msg, newWidth = 120) {
    this.restart(msg, newWidth);
  }

  restart(newText, newWidth = null, newY = null, newHeight = null, newDuration = 2000) {
    if (newWidth) {
      this.width = newWidth;
      this.myX = 512 / 2 - newWidth / 2; // recenter info
    }
    if (newHeight) this.height = newHeight;
    if (newY) this.myY = newY;

    this.text = newText;
    this.previewDuration = newDuration;

    this.start();
  }

  draw(ctx) {
    if (this.done) return;

    // Draw rectangle
    if (this.shape === Shapes.SQUARE) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.myX, this.myY, this.width, this.height);

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.strokeRect(this.myX, this.myY, this.width, this.height);
      }
    }

    // Draw circle
    else if (this.shape === Shapes.CIRCLE) {
      ctx.beginPath();
      ctx.arc(this.myX + this.radius, this.myY + this.radius, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw rounded rectangle
    else if (this.shape === Shapes.ROUND) {
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.myX + radius, this.myY);
      ctx.lineTo(this.myX + this.width - radius, this.myY);
      ctx.arcTo(this.myX + this.width, this.myY, this.myX + this.width, this.myY + radius, radius);
      ctx.lineTo(this.myX + this.width, this.myY + this.height - radius);
      ctx.arcTo(
        this.myX + this.width,
        this.myY + this.height,
        this.myX + this.width - radius,
        this.myY + this.height,
        radius
      );
      ctx.lineTo(this.myX + radius, this.myY + this.height);
      ctx.arcTo(this.myX, this.myY + this.height, this.myX, this.myY + this.height - radius, radius);
      ctx.lineTo(this.myX, this.myY + radius);
      ctx.arcTo(this.myX, this.myY, this.myX + radius, this.myY, radius);
      ctx.closePath();

      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw triangle
    else if (this.shape === Shapes.TRIANGLE) {
      ctx.beginPath();
      ctx.moveTo(this.myX + this.width / 2, this.myY);
      ctx.lineTo(this.myX, this.myY + this.height);
      ctx.lineTo(this.myX + this.width, this.myY + this.height);
      ctx.closePath();

      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw star
    else if (this.shape === Shapes.STAR) {
      const centerX = this.myX + this.width / 2;
      const centerY = this.myY + this.height / 2;
      const radius = Math.min(this.width, this.height) / 2;
      const spikes = 5;
      const step = Math.PI / spikes;
      ctx.beginPath();

      for (let i = 0; i < spikes * 2; i++) {
        const angle = i * step;
        const currentRadius = i % 2 === 0 ? radius : radius / 2;
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw ellipse
    else if (this.shape === Shapes.ELLIPSE) {
      ctx.beginPath();
      ctx.ellipse(
        this.myX + this.width / 2,
        this.myY + this.height / 2,
        this.width / 2,
        this.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(
        this.text,
        this.myX + this.width / 2 + this.textXoffset,
        this.myY + this.height / 2 + this.textYoffset
      );
    }
  }

  isMouseIn() {
    const { x, y } = this.mousePos;
    if (this.shape === Shapes.SQUARE || this.shape === Shapes.ROUND || this.shape === Shapes.ELLIPSE) {
      return x >= this.myX && x <= this.myX + this.width && y >= this.myY && y <= this.myY + this.height;
    } else if (this.shape === Shapes.CIRCLE || this.shape === Shapes.STAR) {
      const distance = Math.sqrt((x - (this.myX + this.radius)) ** 2 + (y - (this.myY + this.radius)) ** 2);
      return distance <= this.radius;
    }

    return false;
  }

  getTextWidth(ctx) {
    ctx.font = this.font;
    return ctx.measureText(this.text).width;
  }

  updateText(newText) {
    this.text = newText;
  }

  set shape(value) {
    this._shape = value;
    if (value === Shapes.CIRCLE) this.height = this.width;
  }

  get shape() {
    return this._shape;
  }
}