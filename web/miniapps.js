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
  
  class CounterApp {
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
   
  class PaintToolV2 {
    constructor(node) {
      this.node = node;
      this.initTools();
      this.initEventListeners();
    }
  
    initTools() {
      // Initialize paint area
      this.paintArea = new PaintArea(0, 80, 512, 512);
      this.paintArea.yOffset = 80;
      this.node.addCustomWidget(this.paintArea);
  
      // Initialize color picker
      this.colorPicker = new ColorPicker(512 - 100, 80, 100, 100);
      this.node.addCustomWidget(this.colorPicker);
  
      // Initialize buttons
      this.initButtons();
  
      // Initialize preview
      this.preview = new Preview(0, 0);
      this.preview.dashColor = "red";
      this.node.addCustomWidget(this.preview);
  
      // Initialize slider
      this.slider = new Slider(60, 40);
      this.slider.onChange = (value) => {
        this.preview.brushSize = value;
        this.paintArea.brushSize = value;
      };
      this.node.addCustomWidget(this.slider);
    }
  
    initButtons() {
      const buttons = [
        {
          name: "colorButton",
          x: 462,
          y: 35,
          text: "🎨",
          shape: Shapes.ROUND,
          color: "crimson",
          onClick: () => this.colorPicker.open(),
        },
        {
          name: "saveButton",
          x: 462 - 100,
          y: 35,
          text: "save",
          shape: Shapes.ROUND,
          color: "#5d8aa8",
          onClick: () => this.paintArea.saveTempImage(),
        },
        {
          name: "loadButton",
          x: 462 - 50,
          y: 35,
          text: "load",
          shape: Shapes.ROUND,
          color: "#915c83",
          onClick: () => this.paintArea.loadTempImage(),
        },
        {
          name: "clearButton",
          x: 462 - 150,
          y: 35,
          text: "clear",
          shape: Shapes.CIRCLE,
          color: "grey",
          onClick: () => this.paintArea.clearWithColor("white"),
        },
      ];
  
      buttons.forEach((buttonConfig) => {
        this[buttonConfig.name] = new Button(
          buttonConfig.x,
          buttonConfig.y,
          buttonConfig.text,
          buttonConfig.width,
          buttonConfig.height,
          buttonConfig.onClick
        );
        this[buttonConfig.name].shape = buttonConfig.shape;
        this[buttonConfig.name].color = buttonConfig.color;
        this.node.addCustomWidget(this[buttonConfig.name]);
      });
    }
  
    initEventListeners() {
      this.node.onMouseDown = (e, pos) => this.handleMouseDown(e, pos);
      this.node.onMouseMove = (e, pos) => this.handleMouseMove(e, pos);
      this.node.onMouseUp = () => this.handleMouseUp();
      this.node.onMouseLeave = () => this.handleMouseLeave();
      this.node.onMouseEnter = (e, pos) => this.handleMouseEnter(e, pos);
    }
  
    handleMouseDown(e, pos) {
      this.node.locked = true;
      if (pos[1] > 80 && !this.colorPicker.isSelecting) {
        this.paintArea.isPainting = true;
      }
  
      // Handle button clicks
      // Object.values(this).forEach((widget) => {
      //   if (widget instanceof Button) {
      //     widget.handleClick(pos[0], pos[1]);
      //   }
      // });
  
      if (this.colorPicker.isSelecting) {
        this.colorPicker.close();
      }
  
      if (pos[1] > 80) {
        this.node.flags.pinned = true;
      }
    }
  
    handleMouseMove(e, pos) {
      if (this.slider.isHandleClicked(pos)) {
        this.slider.handleMouseMove(pos);
      }
  
      this.paintArea.updateMousePos(pos);
      this.preview.updateMousePos(pos);
  
      if (this.colorPicker.isVisible) {
        this.colorPicker.setColorUnderCurser(e);
        this.colorButton.color = this.colorPicker.selectedColor;
        this.paintArea.brushColor = this.colorPicker.selectedColor;
      }
    }
  
    handleMouseUp() {
      this.paintArea.isPainting = false;
    }
  
    handleMouseLeave() {
      this.paintArea.sendDrawingToAPI();
      this.preview.isMouseIn = false;
      this.node.flags.pinned = false;
    }
  
    handleMouseEnter(e, pos) {
      this.preview.isMouseIn = true;
    }
  }

  export class SmartScalablePaintArea extends BaseSmartWidget {
    constructor(x, y, width, height, node) {
      super(node);
      
      // Fixed node display dimensions
      this.nodeWidth = 512;
      this.nodeHeight = 512;
      
      // Internal canvas dimensions (scaleable)
      this.canvasWidth = 512;
      this.canvasHeight = 512;
  
      // Position and scaling
      this.x = x;
      this.y = y;
      
      this.width = width;
      this.width = height;
      
      this.scaleFactor = 1.0;
      this.nodeYoffset = 80;
      this.nodeXoffset = 0;
  
      // Initialize painting properties
      this.brushSize = 10;
      this.brushColor = "crimson";
      this.isPainting = false;
      this.blockPainting = false;
      this.isPaintingBackground = false;
  
      // Initialize canvases
      this.initCanvases();
  
      // Event callbacks
      this.onClick = null;
      this.onPress = null;
  
      node.addCustomWidget(this);
    }
  
    initCanvases() {
      // Foreground Layer
      this.foregroundCanvas = document.createElement("canvas");
      this.foregroundCanvas.width = this.canvasWidth;
      this.foregroundCanvas.height = this.canvasHeight;
      this.foregroundCtx = this.foregroundCanvas.getContext("2d");
  
      // Background Layer
      this.backgroundCanvas = document.createElement("canvas");
      this.backgroundCanvas.width = this.canvasWidth;
      this.backgroundCanvas.height = this.canvasHeight;
      this.backgroundCtx = this.backgroundCanvas.getContext("2d");
      this.backgroundCtx.fillStyle = "white";
      this.backgroundCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  
    setNewSize(size) {
      // Determine scale factor based on available space
      this.scaleFactor = (size.width >= 1024 || size.height >= 1024) ? 2 : 1;
    
      // Set internal canvas resolution (2x when scaled)
      const newCanvasWidth = 512 * this.scaleFactor;
      const newCanvasHeight = 512 * this.scaleFactor;
    
      // Preserve and scale existing canvas content
      this.resizeCanvas(this.foregroundCanvas, this.foregroundCtx, newCanvasWidth, newCanvasHeight);
      this.resizeCanvas(this.backgroundCanvas, this.backgroundCtx, newCanvasWidth, newCanvasHeight);
    
      // Set fixed position within node (0 from left, 80 from top)
      this.x = 0;
      this.y = this.nodeYoffset; // 80
    
      // Update dimensions
      this.canvasWidth = newCanvasWidth;
      this.canvasHeight = newCanvasHeight;
    }
    
    resizeCanvas(canvas, ctx, newWidth, newHeight) {
      // Create temporary canvas to preserve content
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
    
      // Resize main canvas
      canvas.width = newWidth;
      canvas.height = newHeight;
    
      // Redraw content with proper scaling
      ctx.save();
      ctx.scale(newWidth / tempCanvas.width, newHeight / tempCanvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();
    }
  
    draw(ctx) {
      // Apply inverse scaling to fit high-res canvas into node dimensions
      ctx.save();
      ctx.scale(1 / this.scaleFactor, 1 / this.scaleFactor);
  
      // Draw background layer
      ctx.drawImage(
        this.backgroundCanvas,
        this.x * this.scaleFactor,
        this.y * this.scaleFactor,
        this.nodeWidth * this.scaleFactor,
        this.nodeHeight * this.scaleFactor
      );
  
      // Draw foreground layer
      ctx.drawImage(
        this.foregroundCanvas,
        this.x * this.scaleFactor,
        this.y * this.scaleFactor,
        this.nodeWidth * this.scaleFactor,
        this.nodeHeight * this.scaleFactor
      );
  
      ctx.restore();
  
      // Handle painting operations
      if (this.isPainting && !this.blockPainting) {
        const { x, y } = this.getScaledMousePosition(ctx);
        const activeCtx = this.isPaintingBackground
          ? this.backgroundCtx
          : this.foregroundCtx;
  
        activeCtx.lineWidth = this.brushSize * this.scaleFactor;
        activeCtx.lineCap = "round";
        activeCtx.strokeStyle = this.brushColor;
        activeCtx.lineTo(x, y);
        activeCtx.stroke();
        activeCtx.beginPath();
        activeCtx.moveTo(x, y);
      } else {
        this.foregroundCtx.beginPath();
        this.backgroundCtx.beginPath();
      }
    }
  
    getScaledMousePosition(ctx) {
      // Get the mouse position relative to the node
      const { x, y } = this.mousePos;
  
      // Calculate scale factors based on canvas resolution vs displayed size
      const scaleX = this.canvasWidth / this.nodeWidth; // 1 or 2
      const scaleY = this.canvasHeight / this.nodeHeight; // 1 or 2
  
      // Adjust for the canvas offset within the node (0, 80)
      const adjustedX = x - 0;
      const adjustedY = y - this.nodeYoffset;
  
      // Scale the coordinates if necessary
      return {
        x: adjustedX * scaleX,
        y: adjustedY * scaleY,
      };
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
  
    isMouseIn() {
      const { x, y } = this.mousePos;
      return (
        x >= this.x &&
        x <= this.x + this.nodeWidth &&
        y >= this.y &&
        y <= this.y + this.nodeHeight
      );
    }
  
    switchLayer() {
      this.isPaintingBackground = !this.isPaintingBackground;
    }
  
    clearWithColor(color) {
      const clearCtx = this.isPaintingBackground
        ? this.backgroundCtx
        : this.foregroundCtx;
      clearCtx.fillStyle = color;
      clearCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  
      if (!this.isPaintingBackground) {
        this.foregroundCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
    }
  
    saveTempImage() {
      this.tempForeground = this.foregroundCanvas.toDataURL();
      this.tempBackground = this.backgroundCanvas.toDataURL();
    }
  
    loadTempImage() {
      const loadImage = (src, ctx) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            ctx.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
            resolve();
          };
          img.src = src;
        });
      };
  
      if (this.tempForeground) {
        loadImage(this.tempForeground, this.foregroundCtx);
      }
      if (this.tempBackground) {
        loadImage(this.tempBackground, this.backgroundCtx);
      }
    }
  
    async sendDrawingToAPI() {
      const filename = "iToolsPaintedImage";
      try {
        // Combine layers
        const combinedCanvas = document.createElement("canvas");
        combinedCanvas.width = this.canvasWidth;
        combinedCanvas.height = this.canvasHeight;
        const combinedCtx = combinedCanvas.getContext("2d");
  
        combinedCtx.drawImage(this.backgroundCanvas, 0, 0);
        combinedCtx.drawImage(this.foregroundCanvas, 0, 0);
  
        // Convert to Blob
        const blob = await new Promise((resolve) =>
          combinedCanvas.toBlob(resolve, "image/png")
        );
  
        // Send to API
        const formData = new FormData();
        formData.append("file", blob, `${filename}.png`);
  
        await api.fetchApi("/itools/request_save_paint", {
          method: "POST",
          body: formData,
        });
        console.log("Drawing sent successfully");
      } catch (error) {
        console.error("Error sending drawing:", error);
      }
    }
  
    async getDrawingFromAPI() {
      try {
        const response = await api.fetchApi("/itools/request_the_paint_file", {
          method: "POST",
          body: JSON.stringify({ filename: "iToolsPaintedImage.png" }),
        });
  
        const result = await response.json();
        if (result.status === "success") {
          const img = hexDataToImage(result.data);
          this.backgroundCtx.drawImage(
            img,
            0,
            0,
            this.canvasWidth,
            this.canvasHeight
          );
        }
      } catch (error) {
        console.error("Error loading drawing:", error);
      }
    }
  }