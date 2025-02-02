import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import {
  Button,
  Label,
  Slider,
  DropdownMenu,
  Widget,
  Checkbox,
  ColorPicker
} from "./widgets.js";
import { Shapes, Colors,} from "./utils.js";
import {
  RgthreeLabelWidget,
  RgthreeBetterButtonWidget,
} from "./rgthree_widgets.js";

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
      "#ffffff", // White
      "#000000", // Black
      "#ff0000", // Red
      "#00ff00", // Green
      "#0000ff", // Blue
      "#ffff00", // Yellow

      "#ff00ff", // Magenta
      "#00ffff", // Cyan
      "#ffa500", // Orange
      "#800080", // Purple
      "#008000", // Dark Green
      "#800000", // Maroon

      "#808000", // Olive
      "#008080", // Teal
      "#d3d3d3", // Light Gray
      "#000080", // Navy
      "#ffc0cb", // Pink
      "#a52a2a", // Brown

      "#add8e6", // Light Blue
      "#ff4500", // Orange Red
      "#90ee90", // Light Green
      "#4b0082", // Indigo
      "#ffb6c1", // Light Pink
      "#ffd700", // Gold

      "#f0e68c", // Khaki
      "#c0c0c0", // Silver
      "#696969", // Dim Gray
      "#1e90ff", // Dodger Blue
      "#32cd32", // Lime Green
      "#ff6347", // Tomato

      "#dc143c", // Crimson
      "#4682b4", // Steel Blue
      "#8b4513", // Saddle Brown
      "#ffdab9", // Peach Puff
      "#b22222", // Firebrick
      "#228b22", // Forest Green

      "#f5deb3", // Wheat
      "#2f4f4f", // Dark Slate Gray
      "#6a5acd", // Slate Blue
      "#e9967a", // Dark Salmon
      "#ff69b4", // Hot Pink
      "#bc8f8f", // Rosy Brown

      "#deb887", // Burlywood
      "#7fffd4", // Aquamarine
      "#ff8c00", // Dark Orange
    ];

    this.rectSize = 15; // Size of each color rectangle
    this.padding = 0; // Padding between rectangles
    this.startX = 270; // Starting X position for the color picker
    this.startY = 40; // Starting Y position for the color picker
    this.rowLimit = 2;
    this.colLimit = 15;

    this.node.onMouseEnter = (e) => {};

    this.node.onMouseLeave = (e, node) => {
      //console.log('node.allow_dragnodes',node.allow_dragnodes);
      //node.allow_dragnodes = true;
      this.node.flags.pinned = false;
      this.endPosition();
      this.sendDrawingToAPI("itools_painted_image");
    };

    this.node.onMouseMove = (event, pos, node) => {
      //console.log('app.canvas.pointer',app.canvas.pointer.isDown);
      //console.log('isPainting',this.painting);
      if (this.pos[1] < 80) {
        this.endPosition();
      }

      if (this.pos[1] > 30) {
        this.node.flags.pinned = true;
      } else {
        this.node.flags.pinned = false;
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

    for (let row = 0; row < this.rowLimit; row++) {
      for (let col = 0; col < this.colLimit; col++) {
        const index = row * this.colLimit + col;
        if (index < this.colors.length) {
          const rectX = this.startX + col * (this.rectSize + this.padding);
          const rectY = this.startY + row * (this.rectSize + this.padding);
          if (
            x >= rectX &&
            x <= rectX + this.rectSize &&
            y >= rectY &&
            y <= rectY + this.rectSize
          ) {
            this.brushColor = this.colors[index];
          }
        }
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

    for (let row = 0; row < this.rowLimit; row++) {
      for (let col = 0; col < this.colLimit; col++) {
        const index = row * this.colLimit + col;
        if (index < this.colors.length) {
          this.ctx.fillStyle = this.colors[index];
          this.ctx.fillRect(
            this.startX + col * (this.rectSize + this.padding),
            this.startY + row * (this.rectSize + this.padding),
            this.rectSize,
            this.rectSize
          );
        }
      }
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
    if (this.isDragging()) {
      this.paint();
    } else {
      this.endPosition();
    }

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

class DrawingAppOLD {
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
      "#ffffff", // White
      "#000000", // Black
      "#ff0000", // Red
      "#00ff00", // Green
      "#0000ff", // Blue
      "#ffff00", // Yellow

      "#ff00ff", // Magenta
      "#00ffff", // Cyan
      "#ffa500", // Orange
      "#800080", // Purple
      "#008000", // Dark Green
      "#800000", // Maroon

      "#808000", // Olive
      "#008080", // Teal
      "#d3d3d3", // Light Gray
      "#000080", // Navy
      "#ffc0cb", // Pink
      "#a52a2a", // Brown

      "#add8e6", // Light Blue
      "#ff4500", // Orange Red
      "#90ee90", // Light Green
      "#4b0082", // Indigo
      "#ffb6c1", // Light Pink
      "#ffd700", // Gold

      "#f0e68c", // Khaki
      "#c0c0c0", // Silver
      "#696969", // Dim Gray
      "#1e90ff", // Dodger Blue
      "#32cd32", // Lime Green
      "#ff6347", // Tomato

      "#dc143c", // Crimson
      "#4682b4", // Steel Blue
      "#8b4513", // Saddle Brown
      "#ffdab9", // Peach Puff
      "#b22222", // Firebrick
      "#228b22", // Forest Green

      "#f5deb3", // Wheat
      "#2f4f4f", // Dark Slate Gray
      "#6a5acd", // Slate Blue
      "#e9967a", // Dark Salmon
      "#ff69b4", // Hot Pink
      "#bc8f8f", // Rosy Brown

      "#deb887", // Burlywood
      "#7fffd4", // Aquamarine
      "#ff8c00", // Dark Orange
    ];

    this.rectSize = 15; // Size of each color rectangle
    this.padding = 0; // Padding between rectangles
    this.startX = 270; // Starting X position for the color picker
    this.startY = 40; // Starting Y position for the color picker
    this.rowLimit = 2;
    this.colLimit = 15;

    this.node.onMouseEnter = (e) => {};

    this.node.onMouseLeave = (e, node) => {
      //console.log('node.allow_dragnodes',node.allow_dragnodes);
      //node.allow_dragnodes = true;
      this.node.flags.pinned = false;
      this.endPosition();
      this.sendDrawingToAPI("itools_painted_image");
    };

    this.node.onMouseMove = (event, pos, node) => {
      //console.log('app.canvas.pointer',app.canvas.pointer.isDown);
      //console.log('isPainting',this.painting);
      if (this.pos[1] < 80) {
        this.endPosition();
      }

      if (this.pos[1] > 30) {
        this.node.flags.pinned = true;
      } else {
        this.node.flags.pinned = false;
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

    for (let row = 0; row < this.rowLimit; row++) {
      for (let col = 0; col < this.colLimit; col++) {
        const index = row * this.colLimit + col;
        if (index < this.colors.length) {
          const rectX = this.startX + col * (this.rectSize + this.padding);
          const rectY = this.startY + row * (this.rectSize + this.padding);
          if (
            x >= rectX &&
            x <= rectX + this.rectSize &&
            y >= rectY &&
            y <= rectY + this.rectSize
          ) {
            this.brushColor = this.colors[index];
          }
        }
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

    for (let row = 0; row < this.rowLimit; row++) {
      for (let col = 0; col < this.colLimit; col++) {
        const index = row * this.colLimit + col;
        if (index < this.colors.length) {
          this.ctx.fillStyle = this.colors[index];
          this.ctx.fillRect(
            this.startX + col * (this.rectSize + this.padding),
            this.startY + row * (this.rectSize + this.padding),
            this.rectSize,
            this.rectSize
          );
        }
      }
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
    if (this.isDragging()) {
      this.paint();
    } else {
      this.endPosition();
    }

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

class Example1 {
    // usage //const e1 = new Example1(node);
    constructor(node) {
      this.node = node;
  
      const lbl = new Label(50, 80, "test");
      this.node.addCustomWidget(lbl);
  
      const buttons = [];
      // Loop to create buttons
      for (let i = 1; i < 10; i++) {
        let btn = new Button(10 + i * 25, 100);
        btn.shape = Shapes.CIRCLE;
        btn.color = Colors[i];
        btn.outline = true;
        btn.text = "B" + i;
        btn.onClick = () => {
          lbl.text = btn.text + " " + btn.color;
          //console.log(btn.color);
        };
        buttons.push(btn);
      }
  
      buttons.forEach((bt) => {
        this.node.addCustomWidget(bt);
      });
  
      this.node.onMouseDown = (e, pos, node) => {
        buttons.forEach((bt) => {
          bt.handleClick(pos[0], pos[1]);
        });
      };
    }
  }


  // This code here is for learning and testing purpose
  
  export class CounterApp {
    constructor() {
      this.count = 0; // Initialize the counter
      this.labelWidget = new RgthreeLabelWidget("Counter", {
        align: "center",
        size: 20,
      });
      this.buttonWidget = new RgthreeBetterButtonWidget(
        "Increase",
        this.incrementCounter.bind(this)
      );
    }
  
    incrementCounter(event, pos, node) {
      this.count += 1; // Increment the count
      this.updateLabel(); // Update the label with the new count
    }
  
    updateLabel() {
      this.labelWidget.value = `Count: ${this.count}`;
    }
  
    draw(ctx, node, width, y, height) {
      // Draw the label and button
      this.labelWidget.draw(ctx, node, width, y, height);
      this.buttonWidget.draw(ctx, node, width, y + height + 10, 40); // Adjust button position below the label
    }
  
    mouse(event, pos, node) {
      // Handle mouse events for the button widget
      this.buttonWidget.mouse(event, pos, node);
    }
  }
   