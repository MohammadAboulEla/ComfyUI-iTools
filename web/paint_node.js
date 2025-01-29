import { api } from "../../../scripts/api.js";
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
  constructor(node) {
    this.ctx = null;
    this.node = node;
    this.canvas = app.canvas;
    this.newCanvas = null;
    this.newCtx = null;
    this.painting = false;
    this.pos = [0, 0];
    this.brushSize = 20;
    this.brushColor = "#000000";
    this.sliderPicked = false;

    this.colors = [
      "#ffffff",
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

    this.node.onMouseEnter = (e) => {};

    this.node.onMouseLeave = (e,node) => {
      //console.log('node.allow_dragnodes',node.allow_dragnodes);
      //node.allow_dragnodes = true;
      this.node.flags.pinned = false
      this.endPosition();
      this.sendDrawingToAPI("itools_painted_image")

    };

    this.node.onMouseMove = (event, pos, node) => {
      //console.log('app.canvas.pointer',app.canvas.pointer.isDown);
      if (this.pos[1] < 80) {
        this.endPosition();
      }

      if (this.pos[1] > 30) {
        this.node.flags.pinned = true
      } else {
        this.node.flags.pinned = false
      }

      this.pos = pos;
    };

    this.node.onMouseUp = (event, pos, node) => {
      console.log("mouse up");

      if (this.sliderPicked) {
        this.sliderPicked = false;
      }
    
      this.endPosition();
    };

    this.node.onMouseDown = (event, pos, node) => {
      console.log("mouse down");
      console.log("node", node);

      if (this.painting) {
        this.endPosition();
      } else {
        this.startPosition();
      }
    };
  }

  init(ctx) {
    this.ctx = ctx;

    const newCanvas = document.createElement("canvas");
    newCanvas.width = this.node.width; // Match the dimensions of the original canvas
    newCanvas.height = this.node.height;
    newCanvas.style.position = "absolute";
    newCanvas.style.left = "0px";
    newCanvas.style.top = "80px";
    const newCtx = newCanvas.getContext("2d");

    // Fill the new canvas with a white background
    newCtx.fillStyle = "white";
    newCtx.fillRect(0, 80, newCanvas.width, newCanvas.height - 80);
    this.newCtx = newCtx;
    this.newCanvas = newCanvas;
  }

  startPosition() {
    if (this.pos[1] > 80) {
      this.painting = true;
    }
    this.checkForColorPick();
    this.checkForSliderClick();
  }

  endPosition() {
    this.painting = false;

    if (this.newCtx !== null) {
      this.newCtx.beginPath();
    }
  }

  paint() {
    if (!this.painting) return;

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

  checkForColorPick() {
    // Check if color picker buttons are clicked
    const x = this.pos[0];
    const y = this.pos[1];
    //console.log("check for color", x,y)
    for (let i = 0; i < this.colors.length; i++) {
      if (x >= 280 + i * 30 && x <= 310 + i * 30 && y >= 40 && y <= 70) {
        //console.log("color changed")
        this.brushColor = this.colors[i];
      }
    }
  }

  checkForSliderPick() {
    if (!this.sliderPicked) {
      return;
    }
    const x = this.pos[0];
    const y = this.pos[1];
    console.log("slider changed");
    // Check if slider is clicked
    if (x >= 100 && x <= 200 && y >= 35 && y <= 75) {
      const sliderPosition = x - 100 - 5;
      const newSize = Math.round((sliderPosition / 100) * 89) + 1; // Map slider position to brush size (1-90)
      this.brushSize = newSize;
    }
  }

  checkForSliderClick() {
    if (
      this.pos[0] >= 100 &&
      this.pos[0] <= 200 &&
      this.pos[1] >= 35 &&
      this.pos[1] <= 75
    ) {
      this.sliderPicked = true;
    } else {
      this.sliderPicked = false;
    }
  }

  drawUI() {
    const y = 30; // Vertical offset for the UI
    const uiHeight = 50; // Height of the top part
    const centerY = y + uiHeight / 2; // Vertical center of the UI

    this.ctx.drawImage(this.newCanvas, 0, 0);

    // Clear the top part of the canvas for UI
    this.ctx.fillStyle = LiteGraph.WIDGET_BGCOLOR; //"#2c455b";
    this.ctx.fillRect(0, y, this.node.width, uiHeight);

    // Draw brush size label
    this.ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR; //"#000000";
    this.ctx.font = "14px Arial";
    this.ctx.fillText("Brush Size:", 10, centerY + 5); // Adjusted for vertical center alignment

    // Draw brush size slider
    this.ctx.fillStyle = "#484848";
    this.ctx.fillRect(100, centerY - 5, 100, 10); // Slider track, centered vertically
    this.ctx.fillStyle = "grey";
    this.ctx.fillRect(
      100 + (this.brushSize - 1) * (100 / 89),
      centerY - 10,
      10,
      20
    ); // Slider thumb, centered vertically

    // Draw color picker label
    this.ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR; //"#000000";
    this.ctx.fillText("Color:", 220, centerY + 5); // Adjusted for vertical center alignment

    // Draw color picker buttons
    for (let i = 0; i < this.colors.length; i++) {
      this.ctx.fillStyle = this.colors[i];
      this.ctx.fillRect(280 + i * 30, centerY - 15, 30, 30); // Buttons vertically aligned
    }
  }

  isDragging() {
    return app.canvas.pointer.isDown;
  }

  draw(ctx) {
    const lowQuality = isLowQuality();
    if (lowQuality) {
      return;
    }
    if (this.ctx === null) {
      this.init(ctx);
    }
    this.checkForSliderPick();
    if (this.isDragging()) {this.paint();} else { this.endPosition()}

    this.drawUI();
  }

  async sendDrawingToAPI(filename) {
    if (!this.newCanvas) {
      console.error("Canvas is not initialized.");
      return;
    }

    // Convert the canvas content to a data URL
    const dataURL = this.newCanvas.toDataURL("image/png");
    
    // Convert the data URL to a Blob
    const blob = await fetch(dataURL).then((res) => res.blob());
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", blob, `${filename}.png`);

    // Send the file to the API endpoint
    try {
        await api.fetchApi("/itools/request_save_paint", {
        method: "POST",
        body: formData,
      });
      console.log("Drawing sent successfully.");
    } catch (error) {
      console.error("Error sending the drawing:", error);
    }
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
    node.resizable = false;

    while (node.graph === null) {
      console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (allow_debug) {
      console.log("node", node);
    }

    //node.setDirtyCanvas(true, false);
    const drawing_app = new DrawingApp(node);
    node.addCustomWidget(drawing_app);


  },
});
