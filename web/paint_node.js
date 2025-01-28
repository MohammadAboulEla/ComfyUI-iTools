import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

export class RgthreeBaseWidget {
  constructor(name) {
    this.last_y = 0;
    this.mouseDowned = null;
    this.isMouseDownedAndOver = false;
    this.hitAreas = {};
    this.downedHitAreasForMove = [];
    this.name = name;
  }
  clickWasWithinBounds(pos, bounds) {
    let xStart = bounds[0];
    let xEnd = xStart + (bounds.length > 2 ? bounds[2] : bounds[1]);
    const clickedX = pos[0] >= xStart && pos[0] <= xEnd;
    if (bounds.length === 2) {
      return clickedX;
    }
    return clickedX && pos[1] >= bounds[1] && pos[1] <= bounds[1] + bounds[3];
  }
  mouse(event, pos, node) {
    var _a, _b, _c;
    const canvas = app.canvas;
    if (event.type == "pointerdown") {
      this.mouseDowned = [...pos];
      this.isMouseDownedAndOver = true;
      this.downedHitAreasForMove.length = 0;
      let anyHandled = false;
      for (const part of Object.values(this.hitAreas)) {
        if (
          (part.onDown || part.onMove) &&
          this.clickWasWithinBounds(pos, part.bounds)
        ) {
          if (part.onMove) {
            this.downedHitAreasForMove.push(part);
          }
          if (part.onDown) {
            const thisHandled = part.onDown.apply(this, [
              event,
              pos,
              node,
              part,
            ]);
            anyHandled = anyHandled || thisHandled == true;
          }
        }
      }
      return (_a = this.onMouseDown(event, pos, node)) !== null && _a !== void 0
        ? _a
        : anyHandled;
    }
    if (event.type == "pointerup") {
      if (!this.mouseDowned) return true;
      this.downedHitAreasForMove.length = 0;
      this.cancelMouseDown();
      let anyHandled = false;
      for (const part of Object.values(this.hitAreas)) {
        if (part.onUp && this.clickWasWithinBounds(pos, part.bounds)) {
          const thisHandled = part.onUp.apply(this, [event, pos, node, part]);
          anyHandled = anyHandled || thisHandled == true;
        }
      }
      return (_b = this.onMouseUp(event, pos, node)) !== null && _b !== void 0
        ? _b
        : anyHandled;
    }
    if (event.type == "pointermove") {
      this.isMouseDownedAndOver = !!this.mouseDowned;
      if (
        this.mouseDowned &&
        (pos[0] < 15 ||
          pos[0] > node.size[0] - 15 ||
          pos[1] < this.last_y ||
          pos[1] > this.last_y + LiteGraph.NODE_WIDGET_HEIGHT)
      ) {
        this.isMouseDownedAndOver = false;
      }
      for (const part of this.downedHitAreasForMove) {
        part.onMove.apply(this, [event, pos, node, part]);
      }
      return (_c = this.onMouseMove(event, pos, node)) !== null && _c !== void 0
        ? _c
        : true;
    }
    return false;
  }
  cancelMouseDown() {
    this.mouseDowned = null;
    this.isMouseDownedAndOver = false;
    this.downedHitAreasForMove.length = 0;
  }
  onMouseDown(event, pos, node) {
    return;
  }
  onMouseUp(event, pos, node) {
    return;
  }
  onMouseMove(event, pos, node) {
    return;
  }
}

function isLowQuality() {
  var _a;
  const canvas = app.canvas;
  return (
    (((_a = canvas.ds) === null || _a === void 0 ? void 0 : _a.scale) || 1) <=
    0.5
  );
}
// extends RgthreeBaseWidget
class DrawingApp {
  constructor() {
    //super("iTools_draw_app");
    this.ctx = null;
    this.paint_ctx = null;
    this.node = null;
    this.canvas = null;
    this.newCanvas = null;
    this.newCtx = null;
    this.painting = false;
    this.pos = [0, 0];
    this.brushSize = 20;
    this.brushColor = "#ff0000"; //"#000000";

    this.colors = [
      "#000000",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      //   "#ff00ff",
      //   "#00ffff",
      //   "#ffa500",
      //   "#800080",
      //   "#008080", // 5 new colors
    ];
  }

  init(ctx, node, width, y, height) {
    this.ctx = ctx;
    this.node = node;
    this.canvas = app.canvas;
  }

  startPosition() {
    if (this.pos[1] > 80) {
      this.painting = true;
    }
  }

  endPosition() {
    this.painting = false;
    if (this.newCtx !== null) {
      this.newCtx.beginPath();
    }
  }

  paint() {
    if (!this.painting) return;
    //console.log(this.pos)

    if (this.newCtx === null) {
      // Create a new canvas element or use an existing one
      const newCanvas = document.createElement("canvas");
      newCanvas.width = this.node.width; // Match the dimensions of the original canvas
      newCanvas.height = this.node.height;
      const newCtx = newCanvas.getContext("2d");

      // Fill the new canvas with a white background
      newCtx.fillStyle = "white";
      newCtx.fillRect(0, 80, newCanvas.width, newCanvas.height);
      this.newCtx = newCtx;
      this.newCanvas = newCanvas;
    }

    console.log(this.node.pointer_is_down);
    // Set the drawing properties
    this.newCtx.lineWidth = this.brushSize;
    this.newCtx.lineCap = "round";
    this.newCtx.strokeStyle = this.brushColor;

    // Draw on the new canvas
    this.newCtx.lineTo(this.pos[0], this.pos[1]);
    this.newCtx.stroke();

    this.newCtx.beginPath();
    this.newCtx.moveTo(this.pos[0], this.pos[1]);

    this.ctx.drawImage(this.newCanvas, 0, 0);
  }

  drawUI() {
    const y = 30; // Vertical offset for the UI
    const uiHeight = 50; // Height of the top part
    const centerY = y + uiHeight / 2; // Vertical center of the UI

    // Clear the top part of the canvas for UI
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, y, this.node.width, uiHeight);

    // paint area
    if (!this.painting && this.newCanvas instanceof HTMLCanvasElement) {
      this.ctx.drawImage(this.newCanvas, 0, 0);
    }

    // Draw brush size label
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "14px Arial";
    this.ctx.fillText("Brush Size:", 10, centerY + 5); // Adjusted for vertical center alignment

    // Draw brush size slider
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(100, centerY - 5, 150, 10); // Slider track, centered vertically
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(
      100 + (this.brushSize - 1) * (150 / 49),
      centerY - 10,
      10,
      20
    ); // Slider thumb, centered vertically

    // Draw color picker label
    this.ctx.fillStyle = "#000000";
    this.ctx.fillText("Color:", 270, centerY + 5); // Adjusted for vertical center alignment

    // Draw color picker buttons
    for (let i = 0; i < this.colors.length; i++) {
      this.ctx.fillStyle = this.colors[i];
      this.ctx.fillRect(320 + i * 30, centerY - 15, 30, 30); // Buttons vertically aligned
    }
  }

  draw(ctx, node, width, y, height) {
    const lowQuality = isLowQuality();
    if (lowQuality) {
      return;
    }
    if (this.ctx === null) {
      this.init(ctx, node, width, y, height);
    }
    this.paint();
    this.drawUI();
  }
}

app.registerExtension({
  name: "iTools.paintNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsPaintNode") {
      return;
    }

    if (allow_debug) {
      console.log("nodeType", nodeType);
      console.log("nodeData", nodeData);
      console.log("app", app);
    }
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPaintNode") {
      return;
    }
    node.setSize([512, 592]);
    if (allow_debug) {
      console.log("node", node);
    }

    const drawing_app = new DrawingApp();
    node.addCustomWidget(drawing_app);

    node.onMouseMove = (event, pos, node) => {
      // Update the position after the check
      drawing_app.pos = pos;
    };

    node.onMouseUp = (event, pos, node) => {
      console.log("Mouse_up");
      drawing_app.endPosition();
      node.allow_dragnodes = true;
      return;
    };

    node.onMouseDown = (event, pos, node) => {
      console.log("node", node);
      console.log("app", app);
      if (pos[1] > 30) {
        node.allow_dragnodes = false;
      }
      if(drawing_app.painting) {
        drawing_app.endPosition();}
      else{
        drawing_app.startPosition();
      }
      

      return;
    };
  },
});
