import { app } from "../../../scripts/app.js";
import { Shapes, lightenColor, hexDataToImage } from "./utils.js";
import { api } from "../../../scripts/api.js";

class BaseSmartWidget {
  constructor(node) {
    this.node = node;
    this._mousePos = [0, 0];
  }

  init() {}

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  enterFreezeMode() {
    this.node.allow_interaction = false;
    this.node.allow_dragcanvas = false;
  }

  exitFreezeMode() {
    this.node.allow_interaction = true;
    this.node.allow_dragcanvas = true;
  }

  get mousePos() {
    const graphMouse = app.canvas.graph_mouse;
    return {
      x: graphMouse[0] - this.node.pos[0],
      y: graphMouse[1] - this.node.pos[1],
    };
  }
}

export class BaseSmartWidgetManager extends BaseSmartWidget {
  constructor(node) {
    super(node);
    this.allowDebug = false;
    this.init();
    this.initEventListeners();
  }

  init() {}

  initEventListeners() {
    app.canvas.onMouseDown = (e) => this.handleMouseDown(e); //works even out of node
    app.canvas.canvas.onclick = (e) => this.handleMouseClick(e); // works after mouse down
    this.node.onDrawForeground = (e) => this.handleMouseMove(e); //works every where even when dragging
    // app.canvas.canvas.onmousemove = (e) => this.handleMouseMove(e); //works every where

    // this.node.onMouseUp = (e) => this.handleDragEnd(e); // work only after dragging on node, trigger before click
    // this.node.onMouseDown = (e,pos, node) => this.handleDragStart(e,pos, node); // work only if mouse down on node,
  }
  handleMouseDown(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleDown?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDown", this.mousePos);
  }

  handleMouseMove(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleMove?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseMoved");
  }

  handleMouseClick(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleClick?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseClicked");
  }

  // handleDragStart(e,pos,node) {
  //   Object.values(this.node.widgets).forEach((widget) => {
  //     if (widget instanceof SmartSlider) {
  //       widget.handleDragStart();
  //     }
  //   });
  //   if (this.allowDebug) console.log("NodeMouseDown");
  //   console.log('node',node);
  // }

  // handleDragEnd(e) {
  //   Object.values(this.node.widgets).forEach((widget) => {
  //     if (widget instanceof SmartSlider) {
  //       widget.handleDragEnd();
  //     }
  //   });
  //   if (this.allowDebug) console.log("NodeMouseUp");
  // }

  get mousePos() {
    const graphMouse = app.canvas.graph_mouse;
    return {
      x: graphMouse[0] - this.node.pos[0],
      y: graphMouse[1] - this.node.pos[1],
    };
  }
}

export class SmartWidget extends BaseSmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(node);

    this.x = x;
    this.y = y;
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
    this.onClick = null;
    this.onPress = null;
    this.onHover = null;

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
    if (!this.isMouseIn) return;
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
    // Draw rectangle
    if (this.shape === Shapes.SQUARE) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    }

    // Draw circle
    if (this.shape === Shapes.CIRCLE) {
      ctx.beginPath();
      ctx.arc(
        this.x + this.radius,
        this.y + this.radius,
        this.radius,
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

    // Draw rounded rectangle //HAS NO DETECT YET
    if (this.shape === Shapes.ROUND) {
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.width - radius, this.y);
      ctx.arcTo(
        this.x + this.width,
        this.y,
        this.x + this.width,
        this.y + radius,
        radius
      );
      ctx.lineTo(this.x + this.width, this.y + this.height - radius);
      ctx.arcTo(
        this.x + this.width,
        this.y + this.height,
        this.x + this.width - radius,
        this.y + this.height,
        radius
      );
      ctx.lineTo(this.x + radius, this.y + this.height);
      ctx.arcTo(
        this.x,
        this.y + this.height,
        this.x,
        this.y + this.height - radius,
        radius
      );
      ctx.lineTo(this.x, this.y + radius);
      ctx.arcTo(this.x, this.y, this.x + radius, this.y, radius);
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
    if (this.shape === Shapes.TRIANGLE) {
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
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
    if (this.shape === Shapes.STAR) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
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
    if (this.shape === Shapes.ELLIPSE) {
      ctx.beginPath();
      ctx.ellipse(
        this.x + this.width / 2,
        this.y + this.height / 2,
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
    const { x, y } = this.mousePos;
    if (
      this.shape === Shapes.SQUARE ||
      this.shape === Shapes.ROUND ||
      this.shape === Shapes.ELLIPSE
    ) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    } else if (this.shape === Shapes.CIRCLE || this.shape === Shapes.STAR) {
      const distance = Math.sqrt(
        (x - (this.x + this.radius)) ** 2 + (y - (this.y + this.radius)) ** 2
      );
      return distance <= this.radius;
    }

    // } else if (this.shape === Shapes.ROUND) {
    //   const radius = Math.min(this.width, this.height) / 5;

    //   // Check if the point is inside the main rectangle (excluding rounded corners)
    //   if (
    //     x >= this.x + radius &&
    //     x <= this.x + this.width - radius &&
    //     y >= this.y &&
    //     y <= this.y + this.height
    //   ) {
    //     return true;
    //   }
    //   if (
    //     x >= this.x &&
    //     x <= this.x + this.width &&
    //     y >= this.y + radius &&
    //     y <= this.y + this.height - radius
    //   ) {
    //     return true;
    //   }

    //   // Check if the point is inside the rounded corners
    //   const cornerCenters = [
    //     { cx: this.x + radius, cy: this.y + radius }, // Top-left
    //     { cx: this.x + this.width - radius, cy: this.y + radius }, // Top-right
    //     { cx: this.x + radius, cy: this.y + this.height - radius }, // Bottom-left
    //     { cx: this.x + this.width - radius, cy: this.y + this.height - radius }, // Bottom-right
    //   ];

    //   return cornerCenters.some(({ cx, cy }) => {
    //     return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
    //   });
    // }

    return false;
  }

  visualClick() {
    const originalPosX = this.x;
    const originalPosY = this.y;
    setTimeout(() => {
      if (!this.allowVisualHover) this.color = this.originalColor;
      this.x = originalPosX;
      this.y = originalPosY;
    }, 100);
    if (!this.allowVisualHover)
      this.color = lightenColor(this.originalColor, 20);
    this.x = originalPosX + 0.5;
    this.y = originalPosY + 0.5;
  }

  visualHover() {
    if (this.hovered) return; // Prevent multiple executions
    this.hovered = true;
    this.color = lightenColor(this.color, 20);
  }

  visualUnHover() {
    if (!this.hovered) return;
    this.color = this.originalColor;
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

export class SmartLabel extends BaseSmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.text = text;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.0;
    this.textXoffset = 0.0;
    this.textAlign = "left";
    this.textBaseline = "top";
    this.font = "14px Arial Bold";
    this.textWidth = null;

    // Apply options if provided
    Object.assign(this, options);

    // add self to the node
    node.addCustomWidget(this);
  }
  draw(ctx) {
    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(
        this.text,
        this.x + this.textXoffset,
        this.y + this.textYoffset
      );
      if (this.textWidth === null) {
        const textMetrics = ctx.measureText(this.text);
        this.textWidth = textMetrics.width;
      }
    }
  }
}

export class SmartButton extends SmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(x, y, width, height, node, options);

    this.text = text;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 1.2;
    this.textXoffset = 0.0;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";

    this.withTagWidth = false; // false or number
    this.tagColor = "crimson";
    this.tagPosition = "left"; // "left" or "right"
    this.tagRound = 2.5;

    // Apply options if provided
    Object.assign(this, options);
  }
  draw(ctx) {
    super.draw(ctx);

    // Draw tag
    if (this.withTagWidth) {
      ctx.fillStyle = this.tagColor;

      ctx.beginPath();

      if (this.tagPosition === "left") {
        // Round only the left side
        ctx.roundRect(
          this.x + 0.5,
          this.y + 0.5,
          this.withTagWidth,
          this.height - 1,
          [this.tagRound, 0, 0, this.tagRound]
        );
      } else {
        // Round only the right side
        ctx.roundRect(
          this.x + this.width - this.withTagWidth - 0.5,
          this.y + 0.5,
          this.withTagWidth,
          this.height - 1,
          [0, this.tagRound, this.tagRound, 0]
        );
      }

      ctx.fill();
    }

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(
        this.text,
        this.x + this.width / 2 + this.textXoffset,
        this.y + this.height / 2 + this.textYoffset
      );
    }
  }
}

export class SmartSlider extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    // Slider specific properties
    this.minValue = 5;
    this.maxValue = 100;
    this.value = this.minValue;
    this.handleWidth = 15;
    this.handleHeight = this.height;
    this.handleColor = "#80a1c0";
    this.trackColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.trackHeight = this.height / 4;
    this.onValueChange = null;
    this.isProgressBar = false;

    this.text = "Value: ";
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.8;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";
    this.disableText = false;
    this.textColorNormalize = false;

    // Calculate handle position based on initial value
    this.handleX =
      this.x +
      ((this.value - this.minValue) / (this.maxValue - this.minValue)) *
        (this.width - this.handleWidth);
    this.handleY = this.y + (this.height - this.handleHeight) / 2;

    // Track dragging state
    this.isDragging = false;

    //Apply options if provided
    Object.assign(this, options);
  }

  handleDown() {
    if (this.isMouseIn()) this.isDragging = true;
  }

  handleMove() {
    if (this.isDragging) {
      const { x } = this.mousePos;
      this.handleX = Math.max(
        this.x,
        Math.min(
          x - this.handleWidth / 2,
          this.x + this.width - this.handleWidth
        )
      );
      this.value =
        this.minValue +
        ((this.handleX - this.x) / (this.width - this.handleWidth)) *
          (this.maxValue - this.minValue);

      if (this.onValueChange) {
        this.onValueChange(this.value);
      }
    }
  }

  handleClick() {
    this.isDragging = false;
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

  isMouseInTrack() {
    const { x, y } = this.mousePos;
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y + (this.height - this.trackHeight) / 2 &&
      y <= this.y + (this.height + this.trackHeight) / 2
    );
  }

  draw(ctx) {
    const trackY = this.y + (this.handleHeight - this.height) / 2;

    // Draw the track
    //ctx.fillStyle = this.trackColor;
    //ctx.fillRect(this.x, trackY, this.width, this.height);
    ctx.fillStyle = this.trackColor;
    ctx.beginPath();
    ctx.roundRect(this.x, trackY, this.width, this.height, 5);
    ctx.fill();

    // Calculate handle position correctly
    const handleX =
      this.x +
      ((this.value - this.minValue) / (this.maxValue - this.minValue)) *
        (this.width - this.handleWidth);

    // Draw the progress
    if (this.isProgressBar) {
      const progressWidth =
        ((this.value - this.minValue) / (this.maxValue - this.minValue)) *
        this.width;
      ctx.fillStyle = this.handleColor; // You can change this to any color for the progress
      ctx.beginPath();
      ctx.roundRect(this.x, trackY, progressWidth, this.height, 5);
      ctx.fill();
    } else {
      // Draw the handle
      ctx.fillStyle = this.handleColor;
      ctx.beginPath();
      ctx.roundRect(handleX, this.y, this.handleWidth, this.handleHeight, 5);
      ctx.fill();
    }

    // Draw value text
    if (this.disableText) return;

    if (!this.textColorNormalize) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(
        `${this.text}${this.value.toFixed(2)}`,
        this.x + this.width / 2,
        this.y + this.height / 2 + this.textYoffset
      );
      return;
    }

    // Define shiftMin and shiftMax to control the range
    const shiftMin = this.minValue + 0.35 * (this.maxValue - this.minValue); // Example shift
    const shiftMax = this.maxValue - 0.0 * (this.maxValue - this.minValue);

    // Clamp value within shiftMin and shiftMax
    const clampedValue = Math.max(shiftMin, Math.min(this.value, shiftMax));

    // Normalize within shifted range
    const normalizedValue = (clampedValue - shiftMin) / (shiftMax - shiftMin);

    // Compute color intensity (closer to black as value increases)
    const colorIntensity = Math.round(160 * (1 - normalizedValue));

    // Set text color
    ctx.fillStyle = `rgb(${colorIntensity}, ${colorIntensity}, ${colorIntensity})`;

    // Draw text
    ctx.font = this.font;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(
      `${this.text}${this.value.toFixed(2)}`,
      this.x + this.width / 2,
      this.y + this.height / 2 + this.textYoffset
    );
  }
}

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
    this.textOnColor = this.isOn
      ? "black"
      : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textOffColor = this.isOn
      ? LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white"
      : "black";
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
      this.isOn = !this.isOn;
      this.textOnColor = this.isOn
        ? "black"
        : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
      this.textOffColor = this.isOn
        ? LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white"
        : "black";
      if (this.onValueChange) this.onValueChange();
    }
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
    const trackY = this.y + (this.handleHeight - this.height) / 2;

    // Draw the track
    ctx.fillStyle = this.trackColor;
    ctx.beginPath();
    ctx.roundRect(this.x, trackY, this.width, this.height, 5);
    ctx.fill();

    // Calculate handle position correctly
    const handleX = this.isOn ? this.x : this.x + this.width / 2;

    // Draw the handle
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(handleX, this.y, this.handleWidth, this.handleHeight, 5);
    ctx.fill();

    // Draw text on
    ctx.fillStyle = this.textOnColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(
      this.textOn,
      this.x + this.width / 4,
      this.y + this.height / 2 + this.textYoffset
    );

    // Draw text off
    ctx.fillStyle = this.textOffColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(
      this.textOff,
      this.x + this.width / 2 + this.width / 4,
      this.y + this.height / 2 + this.textYoffset
    );
  }
}

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
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    // Draw the handle
    if (!this.isChecked) return;
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(
      this.x + this.gap / 2,
      this.y + this.gap / 2,
      this.width - this.gap,
      this.height - this.gap,
      5 - this.gap / 2
    );
    ctx.fill();
  }
}

export class SmartPaintArea extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.yOffset = 0;
    this.xOffset = 0;

    this.nodeYoffset = 80
    this.nodeXoffset = 0
    
    this.brushSize = 10;
    this.brushColor = "crimson";
    this.isPainting = false;
    this.blockPainting = false;
    this.isPaintingBackground = false; // Layer switch

    // Foreground Layer
    this.foregroundCanvas = document.createElement("canvas");
    this.foregroundCanvas.width = this.width;
    this.foregroundCanvas.height = this.height;
    this.foregroundCtx = this.foregroundCanvas.getContext("2d");

    // Background Layer
    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundCanvas.width = this.width;
    this.backgroundCanvas.height = this.height;
    this.backgroundCtx = this.backgroundCanvas.getContext("2d");
    this.backgroundCtx.fillStyle = "white";
    this.backgroundCtx.fillRect(0, 0, this.width, this.height);

    this.onClick = null;
    this.onPress = null;

    this.scaleFactor = 1.0

    node.addCustomWidget(this);
  }

  setNewSize(size) {
    const newX = size.width;
    const newY = size.height;
    
    if(newX >=1024 || newY >= 1024){
      this.scaleFactor = 2;
    }else {
      this.scaleFactor = 1;
    }

    // Center the canvas on the x and y axis of the node
    this.x = (this.node.width - newX) / 2;
    this.y = (this.node.height + this.nodeYoffset -  newY) / 2;

    // Update the width and height properties
    this.width = newX;
    this.height = newY;

    // Resize the foreground canvas and redraw the content
    const foregroundImageData = this.foregroundCtx.getImageData(
      0,
      0,
      this.foregroundCanvas.width,
      this.foregroundCanvas.height
    );
    this.foregroundCanvas.width = newX;
    this.foregroundCanvas.height = newY;
    this.foregroundCtx.putImageData(foregroundImageData, 0, 0);

    // Resize the background canvas and redraw the content
    const backgroundImageData = this.backgroundCtx.getImageData(
      0,
      0,
      this.backgroundCanvas.width,
      this.backgroundCanvas.height
    );
    this.backgroundCanvas.width = newX;
    this.backgroundCanvas.height = newY;
    this.backgroundCtx.putImageData(backgroundImageData, 0, 0);

    // Redraw the background with the default color
    this.backgroundCtx.fillStyle = "white";
    this.backgroundCtx.fillRect(0, 0, newX, newY);
  }

  switchLayer() {
    this.isPaintingBackground = !this.isPaintingBackground;
  }


  draw(ctx) {
    const { x, y } = this.mousePos;
  
    if (this.isPainting && !this.blockPainting) {
      const activeCtx = this.isPaintingBackground
        ? this.backgroundCtx
        : this.foregroundCtx;
      activeCtx.lineWidth = this.brushSize * 2;
      activeCtx.lineCap = "round";
      activeCtx.strokeStyle = this.brushColor;
      activeCtx.lineTo(x - this.x - this.xOffset, y - this.y - this.yOffset); // Adjust for canvas position and offsets
      activeCtx.stroke();
      activeCtx.beginPath();
      activeCtx.moveTo(x - this.x - this.xOffset, y - this.y - this.yOffset); // Adjust for canvas position and offsets
    } else {
      this.foregroundCtx.beginPath();
      this.backgroundCtx.beginPath();
    }
  
    // Draw layers in correct order
    ctx.drawImage(this.backgroundCanvas, this.x, this.y);
    ctx.drawImage(this.foregroundCanvas, this.x, this.y);
  }

  handleDown() {
    if (this.isMouseIn()) {
      this.isPainting = true;
      if (this.onPress) this.onPress();
    }
  }

  handleClick() {
    if (this.isMouseIn()) {
      this.isPainting = false;
      if (this.onClick) this.onClick();
    }
  }

  clearWithColor(color) {
    if (this.isPaintingBackground) {
      // Fill the background with the color
      this.backgroundCtx.fillStyle = color;
      this.backgroundCtx.fillRect(0, 0, this.width, this.height);
    } else {
      // Fill the background with the color
      this.backgroundCtx.fillStyle = color;
      this.backgroundCtx.fillRect(0, 0, this.width, this.height);
      // Reinitialize foreground to be transparent
      this.foregroundCtx.clearRect(0, 0, this.width, this.height);
    }
  }

  isMouseIn() {
    const { x, y } = this.mousePos;
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  saveTempImage() {
    this.tempForeground = this.foregroundCanvas.toDataURL();
    this.tempBackground = this.backgroundCanvas.toDataURL();
  }

  loadTempImage() {
    if (this.tempForeground) {
      let fgImg = new Image();
      fgImg.src = this.tempForeground;
      fgImg.onload = () => {
        this.foregroundCtx.clearRect(0, 0, this.width, this.height);
        this.foregroundCtx.drawImage(fgImg, 0, 0);
      };
    }

    if (this.tempBackground) {
      let bgImg = new Image();
      bgImg.src = this.tempBackground;
      bgImg.onload = () => {
        this.backgroundCtx.clearRect(0, 0, this.width, this.height);
        this.backgroundCtx.drawImage(bgImg, 0, 0);
      };
    }
  }

  // send image to be saved by python
  async sendDrawingToAPI() {
    const filename = "iToolsPaintedImage";
    if (!this.paintCanvas) {
      console.error("Canvas is not initialized.");
      return;
    }

    // Convert the canvas content to a data URL
    const dataURL = this.paintCanvas.toDataURL("image/png");

    // Convert the data URL to a Blob
    const blob = await fetch(dataURL).then((res) => res.blob());

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", blob, `${filename}.png`);

    // Send the file to the API endpoint
    try {
      const response = await api.fetchApi("/itools/request_save_paint", {
        method: "POST",
        body: formData,
      });
      //console.log(response.json());
      console.log("Drawing sent successfully.");
    } catch (error) {
      console.error("Error sending the drawing:", error);
    }
  }

  // request last image saved by python
  async getDrawingFromAPI() {
    const filename = "iToolsPaintedImage.png";

    const formData = new FormData();
    formData.append("filename", filename);
    try {
      const response = await api.fetchApi("/itools/request_the_paint_file", {
        method: "POST",
        body: formData,
      });

      console.log("response", response);

      // Ensure the response is properly parsed as JSON
      const result = await response.json();

      // Check if the response is successful
      if (result.status === "success") {
        console.log("Drawing received successfully.", result);
        this.loadedImage = hexDataToImage(result["data"]);
      } else {
        console.error("Error:", result.message);
      }
    } catch (error) {
      console.error("iTools No Temp Drawing Found", error);
    }
  }
}

export class SmartPreview extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.brushSize = 10;
    this.color = "rgba(128, 128, 128, 0.2)"; // 50% transparent gray
    this.dashColor = "black";
    this.widthLimit = this.width;
    this.heightLimit = this.height;
    this.yOffset = 80;
    this.xOffset = 0;

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
    const { x, y } = this.mousePos;
    // if (x > this.widthLimit) return;
    // if (y > this.heightLimit) return;
    if (y < this.yOffset) return;
    if (!this.isMouseIn(x, y)) return;
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
    ctx.fillStyle = this.allowInnerCircle
      ? this.color
      : "rgba(255, 255, 255, 0)";
    ctx.fill();

    // Draw dotted outline
    ctx.setLineDash([3, 3]); // [dash length, gap length]
    ctx.strokeStyle = this.dashColor; // Outline color
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash to solid
  }
  isMouseIn(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }
}

export class SmartColorPicker extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.ctx = null;
    this.heightDisplay = 20;
    this.selectedColor = null;
    this.isVisible = false;
    this.allowDisplayColor = true;
    this.isSelecting = false;

    // Add self to the node
    node.addCustomWidget(this);
  }

  open() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.isSelecting = false;
  }

  handleMove(e) {
    if (!this.isMouseDown()) {
      this.isVisible = false;
      this.isSelecting = false;
    } else {
      this.isSelecting = true;
    }
  }

  toggleShow() {
    this.isVisible = !this.isVisible;
  }

  draw(ctx) {
    if (!this.isVisible) return;
    // Ensure the context is set
    if (this.ctx === null) this.ctx = ctx;

    // Create a horizontal gradient for hue
    const hueGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y
    );
    hueGradient.addColorStop(0, "red");
    hueGradient.addColorStop(0.17, "orange");
    hueGradient.addColorStop(0.34, "yellow");
    hueGradient.addColorStop(0.51, "green");
    hueGradient.addColorStop(0.68, "blue");
    hueGradient.addColorStop(0.85, "indigo");
    hueGradient.addColorStop(1, "violet");

    // Fill the canvas with the hue gradient
    ctx.fillStyle = hueGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Create a vertical gradient for brightness
    const brightnessGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    brightnessGradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // White
    brightnessGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)"); // Transparent
    brightnessGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)"); // Transparent
    brightnessGradient.addColorStop(1, "rgba(0, 0, 0, 1)"); // Black

    // Use global composite operation to blend the gradients
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = brightnessGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Reset the global composite operation to default
    ctx.globalCompositeOperation = "source-over";

    if (this.allowDisplayColor) this.displaySelectedColor(ctx);
  }

  setColorUnderCurser(event) {
    if (!this.isSelecting) return;
    if (!this.ctx) return;
    const rect = this.ctx.canvas.getBoundingClientRect();
    const scaleX = this.ctx.canvas.width / rect.width;
    const scaleY = this.ctx.canvas.height / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    const pixel = this.ctx.getImageData(canvasX, canvasY, 1, 1).data;
    this.selectedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  }

  displaySelectedColor(ctx) {
    // // Clear a small area below the canvas to display the selected color
    // this.ctx.clearRect(0, this.canvas.height - 30, this.canvas.width, 30); // Adjusted coordinates
    //if(!this.selectedColor) return;
    ctx.fillStyle = this.selectedColor;
    ctx.fillRect(this.x, this.y + this.height, this.width, this.heightDisplay); // Adjusted coordinates
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
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }
}

export class SmartDropdownMenu extends BaseSmartWidget {
  constructor(x, y, width, height, node, items) {
    super(node);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.items = items;
    this.isOpen = false;
    this.selectedItemIndex = -1;
    this.title = "Canvas";

    this.handleColor = "#80a1c0";
    this.bgColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.font = "14px Arial Bold";
    this.textAlign = "center";
    this.textBaseline = "middle";

    this.textYOffset = 0.8;
    this.dropMenuOffset = 6;
    this.dropMenuGap = 1;
    this.dropMenuBg = lightenColor(LiteGraph.WIDGET_BGCOLOR, 20);

    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = 0.8;

    this.onSelect = null;
    node.addCustomWidget(this);
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  select(index) {
    this.selectedItemIndex = index;
    this.isOpen = false;
    if (this.onSelect) this.onSelect();
  }

  draw(ctx) {
    this.drawButton(ctx);
    if (this.isOpen) {
      this.drawMenu(ctx);
    }
  }

  drawButton(ctx) {
    ctx.fillStyle = this.bgColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    // Draw outline if enabled
    if (this.outline) {
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = this.outlineWidth;
      ctx.stroke();
    }

    ctx.font = this.font;
    ctx.fillStyle = this.textColor;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    const text =
      this.selectedItemIndex >= 0
        ? this.items[this.selectedItemIndex]
        : this.title;
    ctx.fillText(
      text,
      this.x + this.width / 2,
      this.y + this.height / 2 + this.textYOffset
    );
  }

  drawMenu(ctx) {
    const menuHeight =
      this.items.length * this.height +
      (this.items.length - 1) * this.dropMenuGap +
      2;
    const menuWidth = this.width + 2;

    ctx.fillStyle = this.dropMenuBg;
    ctx.beginPath();
    ctx.roundRect(
      this.x - 1,
      this.y - 1 + this.height + this.dropMenuOffset,
      menuWidth,
      menuHeight,
      5
    );
    ctx.fill();

    for (let i = 0; i < this.items.length; i++) {
      const itemY =
        this.y +
        this.height * (i + 1) +
        this.dropMenuOffset +
        i * this.dropMenuGap;
      ctx.fillStyle =
        i === this.selectedItemIndex ? this.handleColor : this.bgColor;
      ctx.beginPath();
      ctx.roundRect(this.x, itemY, this.width, this.height, 5);
      ctx.fill();

      ctx.fillStyle = i === this.selectedItemIndex ? "black" : this.textColor;
      ctx.fillText(
        this.items[i],
        this.x + this.width / 2,
        itemY + this.height / 2 + this.textYOffset
      );
    }
  }

  handleClick(event) {
    const { x, y } = this.mousePos;
    if (this.isMouseIn()) {
      this.toggle();
    } else if (this.isOpen) {
      for (let i = 0; i < this.items.length; i++) {
        const itemY =
          this.y +
          this.height * (i + 1) +
          this.dropMenuOffset +
          i * this.dropMenuGap;
        if (y >= itemY && y <= itemY + this.height) {
          this.select(i);
          break;
        }
      }
    }
  }

  isMouseIn() {
    const { x, y } = this.mousePos;
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }
}

// export class SmartDropdownMenu extends BaseSmartWidget {
//   constructor(x, y, width, height, node, items) {
//     super(node);
//     this.x = x;
//     this.y = y;
//     this.width = width;
//     this.height = height;

//     this.items = items;
//     this.isOpen = false;
//     this.title = "Canvas"
//     this.selectedItemIndex = -1;

//     this.handleColor = "#80a1c0";
//     this.bgColor = LiteGraph.WIDGET_BGCOLOR || "crimson";

//     this.textYoffset = 0.8;
//     this.textXoffset = 0.0;
//     this.textColor = this.isOpen
//       ? "black"
//       : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
//     this.textAlign = "center";
//     this.textBaseline = "middle";
//     this.font = "14px Arial Bold";

//     this.dropMenuOffset = 10
//     this.dropMenuGaps = 0
//     // add self to the node
//     node.addCustomWidget(this);
//   }

//   toggle() {
//     console.log('here',);
//     this.isOpen = !this.isOpen;
//   }

//   select(index) {
//     this.selectedItemIndex = index;
//     this.isOpen = false;
//   }

//   draw(ctx) {
//     // Draw the main button
//     ctx.fillStyle = this.bgColor;
//     ctx.beginPath();
//     ctx.roundRect(this.x, this.y, this.width, this.height, 5);
//     ctx.fill();

//     ctx.font = this.font;
//     ctx.fillStyle = this.textColor;
//     ctx.textAlign = this.textAlign;
//     ctx.textBaseline = this.textBaseline;

//     const buttonText =
//       this.selectedItemIndex >= 0
//         ? this.items[this.selectedItemIndex]
//         : this.title;
//     ctx.fillText(buttonText, this.x + this.width / 2, this.y + this.textYoffset + this.height / 2);

//     if (this.isOpen) {
//       this.drawItems(ctx);
//     }
//   }

//   drawItems(ctx) {
//     for (let i = 0; i < this.items.length; i++) {
//       const itemY = this.y + this.height * (i + 1) + this.dropMenuOffset;

//       // draw background for all items
//       ctx.fillStyle = "red"
//       ctx.beginPath();
//       ctx.roundRect(this.x, itemY +(1*this.dropMenuGaps), this.width, this.items.length*this.height, 5);
//       ctx.fill();

//       ctx.fillStyle = i === this.selectedItemIndex ? this.handleColor : this.bgColor;
//       ctx.beginPath();
//       ctx.roundRect(this.x, itemY +(i*this.dropMenuGaps), this.width, this.height, 5);
//       ctx.fill();

//       ctx.fillStyle = i === this.selectedItemIndex ?  "black" : this.textColor;
//       ctx.fillText(this.items[i], this.x + this.width/2, itemY +(i*this.dropMenuGaps) + this.textYoffset +  this.height / 2);
//     }
//   }

//   handleClick(event) {

//     const { x, y } = this.mousePos;

//       if (this.isMouseIn()) {
//         this.toggle();
//       }
//       else if (this.isOpen) {
//         for (let i = 0; i < this.items.length; i++) {
//           const itemY = this.y + this.height * (i + 1) +this.dropMenuOffset;
//           if (y >= itemY +(i*this.dropMenuGaps) && y <= itemY +(i*this.dropMenuGaps) + this.height) {
//             this.select(i);
//             break;
//           }
//         }
//       }
//   }

//   isMouseIn() {
//     const { x, y } = this.mousePos;
//     return (
//       x >= this.x &&
//       x <= this.x + this.width &&
//       y >= this.y &&
//       y <= this.y + this.height
//     );
//   }
// }

// export class PaintArea extends BaseSmartWidget {
//   constructor(x, y, width, height, node) {
//     super(node);

//     this.x = x;
//     this.y = y;
//     this.width = width;
//     this.height = height;

//     this.yOffset = 80;
//     this.xOffset = 0;
//     this.brushSize = 10;
//     this.brushColor = "crimson";
//     this.isPainting = false;
//     this.blockPainting = false;
//     this.clearColor = "white";

//     this.layer = "foreground"; // Default layer
//     this.fgCanvas = this.createCanvas();
//     this.bgCanvas = this.createCanvas();
//     this.fgCtx = this.fgCanvas.getContext("2d");
//     this.bgCtx = this.bgCanvas.getContext("2d");

//     this.init();

//     // Add self to the node
//     node.addCustomWidget(this);
//   }

//   createCanvas() {
//     const canvas = document.createElement("canvas");
//     canvas.width = this.width;
//     canvas.height = this.height;
//     return canvas;
//   }

//   init() {
//     this.fgCtx.fillStyle = "white";
//     this.fgCtx.fillRect(0, 0, this.width, this.height);
//     this.bgCtx.fillStyle = "white";
//     this.bgCtx.fillRect(0, 0, this.width, this.height);
//   }

//   draw(ctx) {
//     const { x, y } = this.mousePos;
//     this.isDragStarted();

//     // Handle clearing background while keeping foreground
//     if (this.clearColor !== null) {
//       this.bgCtx.fillStyle = this.clearColor;
//       this.bgCtx.fillRect(0, 0, this.width, this.height);
//       this.clearColor = null;
//     }

//     // Handle painting
//     if (this.isPainting && !this.blockPainting) {
//       const activeCtx = this.layer === "foreground" ? this.fgCtx : this.bgCtx;
//       activeCtx.lineWidth = this.brushSize * 2;
//       activeCtx.lineCap = "round";
//       activeCtx.strokeStyle = this.brushColor;

//       activeCtx.lineTo(x - this.xOffset, y - this.yOffset);
//       activeCtx.stroke();
//       activeCtx.beginPath();
//       activeCtx.moveTo(x - this.xOffset, y - this.yOffset);
//     } else {
//       this.fgCtx.beginPath();
//       this.bgCtx.beginPath();
//     }

//     // Draw both layers to the main canvas
//     ctx.drawImage(this.bgCanvas, this.x, this.y);
//     ctx.drawImage(this.fgCanvas, this.x, this.y);
//   }

//   switchLayer() {
//     this.layer = this.layer === "foreground" ? "background" : "foreground";
//     console.log(`Switched to ${this.layer} layer`);
//   }

//   handleDown() {
//     if (this.isMouseIn()) {
//       this.isPainting = true;
//     }
//   }

//   handleClick() {
//     if (this.isMouseIn()) {
//       this.isPainting = false;
//     }
//   }

//   isMouseIn() {
//     const { x, y } = this.mousePos;
//     return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
//   }

//   //handleMove() {}
// }

// export class PaintArea extends BaseSmartWidget {
//   constructor(x, y, width, height, node) {
//     super(node);

//     this.x = x;
//     this.y = y;
//     this.width = width;
//     this.height = height;

//     this.yOffset = 80;
//     this.xOffset = 0;
//     this.brushSize = 10;
//     this.brushColor = "crimson";
//     this.isPainting = false;
//     this.blockPainting = false;
//     this.clearColor = "white";

//     this.loadedImage = null;
//     this.init();

//     // add self to the node
//     node.addCustomWidget(this);
//   }

//   init() {
//     // init paint canvas
//     this.paintCanvas = document.createElement("canvas");
//     this.paintCanvas.width = this.width; // Match the dimensions of the original canvas
//     this.paintCanvas.height = this.height;
//     this.paintCtx = this.paintCanvas.getContext("2d");

//     // Fill the new canvas with a white background
//     this.paintCtx.fillStyle = "white";
//     this.paintCtx.fillRect(
//       this.x,
//       this.y,
//       this.paintCanvas.width,
//       this.paintCanvas.height
//     );
//   }

//   draw(ctx) {
//     const { x, y } = this.mousePos;
//     this.isDragStarted()

//     // use clear color once
//     if (this.clearColor !== null) {
//       this.paintCtx.fillStyle = this.clearColor;
//       this.paintCtx.fillRect(
//         0,
//         0,
//         this.paintCanvas.width,
//         this.paintCanvas.height
//       );
//       //this.sendDrawingToAPI(); // save after clear
//       this.clearColor = null;
//     }

//     // use loaded image once
//     if (this.loadedImage !== null) {
//       console.log("loaded image used");
//       this.paintCtx.drawImage(this.loadedImage, 0, 0);
//       //ctx.drawImage(this.paintCanvas, 0, 0);
//       this.loadedImage = null;
//     }

//     // draw phase
//     if (this.isPainting && !this.blockPainting) {
//       // Set the drawing properties
//       this.paintCtx.lineWidth = this.brushSize * 2;
//       this.paintCtx.lineCap = "round";
//       this.paintCtx.strokeStyle = this.brushColor;

//       // Draw on the new canvas
//       this.paintCtx.lineTo(x - this.xOffset, y - this.yOffset);
//       this.paintCtx.stroke();

//       this.paintCtx.beginPath();
//       this.paintCtx.moveTo(x - this.xOffset, y - this.yOffset);

//       // Store the last drawn image
//       this.lastImage = this.paintCanvas.toDataURL();
//     } else {
//       this.paintCtx.beginPath();
//     }
//     // keep drawing on screen
//     ctx.drawImage(this.paintCanvas, this.x, this.y);
//   }

//   handleDown() {
//     if (this.isMouseIn()) {
//       this.isPainting = true;
//     }
//   }

//   handleClick() {
//     if (this.isMouseIn()) {
//       this.isPainting = false;
//     }
//   }

//   handleMove() {}

//   clearWithColor(color){
//     this.clearColor = color
//   }

//   isMouseIn() {
//     const { x, y } = this.mousePos;
//     return (
//       x >= this.x &&
//       x <= this.x + this.width &&
//       y >= this.y &&
//       y <= this.y + this.height
//     );
//   }

//   saveTempImage() {
//     console.log("image saved");
//     this.tempImage = this.paintCanvas.toDataURL();
//   }

//   loadTempImage() {
//     let img = new Image();
//     img.src = this.tempImage;
//     img.onload = () => {
//       this.loadedImage = img;
//     };
//   }

//   // send image to be saved by python
//   async sendDrawingToAPI() {
//     const filename = "iToolsPaintedImage";
//     if (!this.paintCanvas) {
//       console.error("Canvas is not initialized.");
//       return;
//     }

//     // Convert the canvas content to a data URL
//     const dataURL = this.paintCanvas.toDataURL("image/png");

//     // Convert the data URL to a Blob
//     const blob = await fetch(dataURL).then((res) => res.blob());

//     // Create a FormData object to send the file
//     const formData = new FormData();
//     formData.append("file", blob, `${filename}.png`);

//     // Send the file to the API endpoint
//     try {
//       const response = await api.fetchApi("/itools/request_save_paint", {
//         method: "POST",
//         body: formData,
//       });
//       //console.log(response.json());
//       console.log("Drawing sent successfully.");
//     } catch (error) {
//       console.error("Error sending the drawing:", error);
//     }
//   }

//   // request last image saved by python
//   async getDrawingFromAPI() {
//     const filename = "iToolsPaintedImage.png";

//     const formData = new FormData();
//     formData.append("filename", filename);
//     try {
//       const response = await api.fetchApi("/itools/request_the_paint_file", {
//         method: "POST",
//         body: formData,
//       });

//       console.log("response", response);

//       // Ensure the response is properly parsed as JSON
//       const result = await response.json();

//       // Check if the response is successful
//       if (result.status === "success") {
//         console.log("Drawing received successfully.", result);
//         this.loadedImage = hexDataToImage(result["data"]);
//       } else {
//         console.error("Error:", result.message);
//       }
//     } catch (error) {
//       console.error("iTools No Temp Drawing Found", error);
//     }
//   }
// }

// working callback

// app.canvas.onMouse = (e) => { // any mouse button
//   console.log("onMouse",e);
// };

// app.canvas.onNodeMoved = ()=>{
//   console.log('noe moved',);
// }

// app.canvas.canvas.onmousewheel = (e)=>{
//   console.log('onmousewheel',);
// }

// app.canvas.canvas.onclick = (e) => {
//   console.log("onclick");
// };

// app.canvas.canvas.onkeyup = (ke) => {  //onkeydown//onkeypress
//   console.log("onkeyup",ke);
// };

// app.canvas.canvas.onkeydown = (ke) => {
//   console.log("onkeyup",ke);
// };

// app.canvas.canvas.ondblclick = (e) => {
//   console.log("ondblclick",e);
// };

// app.canvas.canvas.onmouseover = (e) => {
//   console.log("onmouseover");
// };

// ========================
// NOT working callback

// app.canvas.onMouseMoved = () => {
//   console.log("Mouse moved");
// };

// app.canvas.onMouseUP = (e) => {
//   console.log("Mouse UP");
// };

// app.canvas.canvas.onmouseup = (e) => {
//   console.log("onmouseup",e);
// };
