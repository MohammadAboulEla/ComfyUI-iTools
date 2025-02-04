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

  // isDragStarted(){
  //   return app.canvas.pointer.dragStarted
  // }

  // enterFreezeMode(){
  //   this.node.allow_interaction = false
  //   this.node.allow_dragcanvas = false
  // }

  // exitFreezeMode(){
  //   this.node.allow_interaction = true
  //   this.node.allow_dragcanvas = true
  // }

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
      if (widget instanceof SmartWidget) {
        widget.handleDown();
      }
    });
    if (this.allowDebug) console.log("MouseDown", this.mousePos);
  }

  handleMouseMove(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof SmartWidget) {
        widget.handleMove();
      }
    });
    if (this.allowDebug) console.log("MouseMoved");
  }

  handleMouseClick(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof SmartWidget) {
        widget.handleClick();
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

export class SmartButton extends SmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(x, y, width, height, node, options);

    this.text = text;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.8;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "16px Arial Bold";

    // Apply options if provided
    Object.assign(this, options);
  }
  draw(ctx) {
    super.draw(ctx);

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(
        this.text,
        this.x + this.width / 2,
        this.y + this.height / 2 + this.textYoffset
      );
    }
  }
}

export class SmartSlider extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    // Slider specific properties
    this.minValue = 0;
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
    if(this.disableText) return;
    ctx.fillStyle = this.textColor;
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
