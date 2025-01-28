import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

function isLowQuality() {
  var _a;
  const canvas = app.canvas;
  return (
    (((_a = canvas.ds) === null || _a === void 0 ? void 0 : _a.scale) || 1) <=
    0.5
  );
}

class DrawingApp {
  constructor() {
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
    this.pos = this.node.last_mouse - this.node.last_mouse_position;
    this.painting = true;
  }

  endPosition() {
    //this.ctx.beginPath();
    this.painting = false;
  }


  paint() {
    if (!this.painting) return;
    console.log("painting");
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
    //const lowQuality = isLowQuality();
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

    if (allow_debug) {
      console.log("node", node);
    }

    const drawing_app = new DrawingApp();
    node.addCustomWidget(drawing_app);

    node.onMouseMove = (event, pos, node) => {
      drawing_app.pos = pos; // Update the position
      //app.graph.setDirtyCanvas(true, true);

      return;
    };

    node.onMouseUp = (event, pos, node) => {
      node.allow_dragnodes = true;
      drawing_app.endPosition();
      return;
    };

    node.onMouseDown = (event, pos, node) => {
      if (pos[1] > 30) {
        node.allow_dragnodes = false;
        //   node.allow_interaction = false;
      }
      //node.ctx.restore()
      console.log("node", node);
      console.log("app", app);
      drawing_app.startPosition();
      return;
    };
  },
});
