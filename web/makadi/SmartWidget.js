import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { Shapes, lightenColor } from "../utils.js";
import { allow_debug } from "../js_shared.js";

export class SmartWidget extends BaseSmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(node);

    this.myX = x;
    this.myY = y;
    this.width = width;
    this.height = height;

    this.radius = width / 2;
    this._shape = Shapes.ROUND;

    this.color = LiteGraph.WIDGET_BGCOLOR || "crimson";

    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = 0.8;

    this.allowVisualPress = true;
    this.allowVisualHover = true;
    this.resetColor = true;
    this.onClick = null;
    this.onPress = null;
    this.onHover = null;

    this.isActive = false;
    this.isVisible = true;
    // New properties for half-circle shapes
    this.sliceOffset = 0; // Offset for the sliced edge (default: no offset)

    // Apply options if provided
    Object.assign(this, options);

    this.originalColor = this.color; // Store original color

    // add self to the node
    node.addCustomWidget(this);
  }

  handleDown() {
    if (this.isMouseIn()) {
      if (this.allowVisualPress) this.visualClick();
      if (this.onPress) this.onPress();
    }
  }

  handleClick() {
    if (this.isMouseIn()) {
      if (this.onClick) this.onClick();
    }
  }

  handleMove() {
    if (this.isMouseIn()) {
      if (this.allowVisualHover) {
        this.visualHover();
      }
      if (this.onHover) this.onHover();
    } else {
      this.visualUnHover();
    }
  }

  draw(ctx) {
    // Draw half-horizontal circle
    const centerX = this.myX + this.radius;
    const centerY = this.myY + this.radius;

    // Draw rounded rectangle //HAS NO DETECT YET
    if (this.shape === Shapes.ROUND) {
      const radius = this.roundRadius ?? Math.min(this.width, this.height) / 5; // Adjust rounding level
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

    // Draw left round
    else if (this.shape === Shapes.ROUND_L) {
      // Rounded on the left side only
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.myX + radius, this.myY); // Start at the top-left corner, slightly inside
      ctx.arcTo(this.myX, this.myY, this.myX, this.myY + radius, radius); // Round the top-left corner
      ctx.lineTo(this.myX, this.myY + this.height - radius); // Go down the left edge
      ctx.arcTo(this.myX, this.myY + this.height, this.myX + radius, this.myY + this.height, radius); // Round the bottom-left corner
      ctx.lineTo(this.myX + this.width, this.myY + this.height); // Go across the bottom edge
      ctx.lineTo(this.myX + this.width, this.myY); // Go up the right edge
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw right round
    else if (this.shape === Shapes.ROUND_R) {
      // Rounded on the right side only
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.myX, this.myY); // Start at the top-left corner
      ctx.lineTo(this.myX + this.width - radius, this.myY); // Go across the top edge
      ctx.arcTo(this.myX + this.width, this.myY, this.myX + this.width, this.myY + radius, radius); // Round the top-right corner
      ctx.lineTo(this.myX + this.width, this.myY + this.height - radius); // Go down the right edge
      ctx.arcTo(
        this.myX + this.width,
        this.myY + this.height,
        this.myX + this.width - radius,
        this.myY + this.height,
        radius
      ); // Round the bottom-right corner
      ctx.lineTo(this.myX, this.myY + this.height); // Go across the bottom edge
      ctx.lineTo(this.myX, this.myY); // Go up the left edge
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-horizontal left circle
    else if (this.shape === Shapes.HHL_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, Math.PI, 0, false);
      ctx.lineTo(centerX - this.sliceOffset, centerY);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-horizontal right circle
    else if (this.shape === Shapes.HHR_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, 0, Math.PI, false);
      ctx.lineTo(centerX + this.sliceOffset, centerY);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-vertical left circle
    else if (this.shape === Shapes.HVL_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.lineTo(centerX, centerY - this.sliceOffset);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-vertical right circle
    else if (this.shape === Shapes.HVR_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, Math.PI * 1.5, Math.PI * 0.5, false);
      ctx.lineTo(centerX, centerY + this.sliceOffset);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw rectangle
    else if (this.shape === Shapes.SQUARE) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.myX, this.myY, this.width, this.height);

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.strokeRect(this.myX, this.myY, this.width, this.height);
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
  }

  isMouseIn() {
    if (!this.isVisible) return false;
    const { x, y } = this.mousePos;

    const centerX = this.myX + this.radius;
    const centerY = this.myY + this.radius;

    if (
      this.shape === Shapes.SQUARE ||
      this.shape === Shapes.ROUND ||
      this.shape === Shapes.ROUND_L ||
      this.shape === Shapes.ROUND_R ||
      this.shape === Shapes.ELLIPSE
    ) {
      return x >= this.myX && x <= this.myX + this.width && y >= this.myY && y <= this.myY + this.height;
    } else if (this.shape === Shapes.CIRCLE) {
      const distance = Math.sqrt((x - (this.myX + this.radius)) ** 2 + (y - (this.myY + this.radius)) ** 2);
      return distance <= this.radius;
    } else if (this.shape === Shapes.HVL_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && x <= centerX;
    } else if (this.shape === Shapes.HVR_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && x >= centerX;
    } else if (this.shape === Shapes.HHL_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && y <= centerY;
    } else if (this.shape === Shapes.HHR_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && y >= centerY;
    }

    return false;
  }

  toggleActive() {
    this.color === "#80a1c0" ? (this.color = this.originalColor) : (this.color = "#80a1c0");
    this.textColor === "black" ? (this.textColor = this.originalTextColor) : (this.textColor = "black");
    this.isActive = !this.isActive;
  }

  visualClick() {
    if (this.visualClickLocked) return; // prevent re-entry
    this.visualClickLocked = true;

    const originalPosX = this.myX;
    const originalPosY = this.myY;

    if (!this.allowVisualHover && this.resetColor) this.color = lightenColor(this.originalColor, 20);

    this.myX = originalPosX + 0.5;
    this.myY = originalPosY + 0.5;

    setTimeout(() => {
      if (!this.allowVisualHover && this.resetColor) this.color = this.originalColor;

      this.myX = originalPosX;
      this.myY = originalPosY;

      this.visualClickLocked = false; // release lock
    }, 100);
  }

  visualHover() {
    if (this.hovered) return; // Prevent multiple executions
    this.hovered = true;
    this.color = lightenColor(this.color, 20);
  }

  visualUnHover() {
    if (!this.hovered) return;
    if (!this.isActive) this.color = this.originalColor;
    this.hovered = false;
  }

  set shape(value) {
    this._shape = value;
    if (value === Shapes.CIRCLE) this.height = this.width;
  }

  get shape() {
    return this._shape;
  }
}