import { app } from "../../../scripts/app.js";
import { Shapes, lightenColor, hexDataToImage } from "./utils.js";
import { api } from "../../../scripts/api.js";

export class Widget {
  constructor(x, y, width = 50, height = 50, onClick = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = "crimson";
    this.radius = width / 2;
    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = 0.5;
    this.allowVisualClick = true;
    this.onClick = onClick;
    this._shape = Shapes.SQUARE;
    this.mousePos = [0, 0];
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
  }

  isClicked(x, y) {
    if (this.shape === Shapes.SQUARE) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    } else if (this.shape === Shapes.CIRCLE) {
      const distance = Math.sqrt(
        (x - (this.x + this.radius)) ** 2 + (y - (this.y + this.radius)) ** 2
      );
      return distance <= this.radius;
    }
    return false;
  }

  visualClick() {
    const originalColor = this.color;
    const originalPosX = this.x;
    const originalPosY = this.y;
    setTimeout(() => {
      this.color = originalColor;
      this.x = originalPosX;
      this.y = originalPosY;
    }, 100);
    this.color = lightenColor(this.color, 20);
    this.x = originalPosX + 0.5;
    this.y = originalPosY + 0.5;
  }

  async handleClick(x, y) {
    if (this.isClicked(x, y)) {
      if (this.allowVisualClick) this.visualClick();
      if (this.onClick) this.onClick();
    } else {
      //console.log("clicked"); // Default behavior
    }
  }

  updateMousePos(pos) {}

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  set shape(value) {
    this._shape = value;
    if (value === Shapes.CIRCLE) this.height = this.width;
  }

  get shape() {
    return this._shape;
  }
}

export class Button extends Widget {
  constructor(x, y, text, width = 40, height = 40, onClick = null) {
    super(x, y, width, height, text, onClick);
    this.outlineColor = "#DDD";
    this.outlineWidth = 1;
    this.text = text;
    this.textColor = "white";
    this.font = "16px Arial Bold";
  }

  draw(ctx) {
    super.draw(ctx); // Call the draw method of the Widget class

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; //"bottom";
      ctx.fillText(
        this.text,
        this.x + this.width / 2,
        this.y + this.height / 2
      );
    }
  }
}

export class Checkbox extends Widget {
  constructor(x, y, width = 15, height = 15, isChecked = true, onClick = null) {
    super(x, y, width, height, onClick);
    this.color = "#80a1c0";
    this.checkedColor = LiteGraph.WIDGET_BGCOLOR;
    this.isChecked = isChecked;
    this.checkMarkShrink = width / 2.5;
  }

  draw(ctx) {
    // Draw rectangle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    // Draw box checkMark if checked
    if (this.isChecked) {
      ctx.fillStyle = this.checkedColor;
      ctx.beginPath();
      ctx.roundRect(
        this.x + this.checkMarkShrink / 2,
        this.y + this.checkMarkShrink / 2,
        this.width - this.checkMarkShrink,
        this.height - this.checkMarkShrink,
        2.5
      );
      ctx.fill();
    }
  }
}

export class Label {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    this.font = "14px Arial";
    this.textAlign = "left";
    this.textBaseline = "middle";
    this.xOffset = 0;
    this.yOffset = 7;
  }

  draw(ctx) {
    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, this.x + this.xOffset, this.y + this.yOffset);
    }
  }
}

export class Slider {
  constructor(
    x,
    y,
    width = 200,
    height = 10,
    min = 5,
    max = 100,
    value = 20,
    trackColor = LiteGraph.WIDGET_BGCOLOR,
    handleColor = "#80a1c0",
    onChange = null
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.min = min;
    this.max = max;
    this.value = value;
    this.trackColor = trackColor;
    this.handleColor = handleColor;
    this.onChange = onChange;

    this.handleWidth = 20;
    this.handleHeight = 20;
  }

  draw(ctx) {
    // Draw the track
    ctx.fillStyle = this.trackColor;
    ctx.fillRect(
      this.x,
      this.y + (this.handleHeight - this.height) / 2,
      this.width,
      this.height
    );

    // Calculate the handle position
    const handleX =
      this.x +
      ((this.value - this.min) / (this.max - this.min)) *
        (this.width - this.handleWidth);

    // Draw the handle
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(handleX, this.y, this.handleWidth, this.handleHeight, 5);
    ctx.fill();

    //Draw value text
    if (this.value) {
      ctx.fillStyle = "white";
      ctx.font = "12px Arial Bold";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; //"bottom";
      ctx.fillText(
        "Brush Size: " + this.value.toFixed(2),
        this.x + this.width / 2,
        this.y + 30
      );
    }
  }

  isHandleClicked(mousePos) {
    const x = mousePos[0];
    const y = mousePos[1];
    //console.log(mousePos);
    return (
      x >= this.x - 20 &&
      x <= this.x + this.width + 20 &&
      y >= this.y &&
      y <= this.y + this.handleHeight
    );
  }

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  handleMouseMove(mousePos) {
    const x = mousePos[0];
    if (this.isMouseDown() && this.isHandleClicked(mousePos)) {
      let newValue =
        ((x - this.x) / this.width) * (this.max - this.min) + this.min;
      newValue = Math.max(this.min, Math.min(this.max, newValue));
      this.value = newValue;

      if (this.onChange) {
        this.onChange(this.value);
      }
    }
  }
}

export class DropdownMenu {
  constructor(x, y, width, height, options) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.options = options;
    this.isOpen = false;
    this.selectedOption = null;
  }

  draw(ctx) {
    // Draw the main dropdown button
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText(
      this.selectedOption || "Select an option",
      this.x + 10,
      this.y + 25
    );

    // Draw the dropdown arrow
    ctx.beginPath();
    ctx.moveTo(this.x + this.width - 20, this.y + 10);
    ctx.lineTo(this.x + this.width - 10, this.y + 10);
    ctx.lineTo(this.x + this.width - 15, this.y + 20);
    ctx.closePath();
    ctx.fillStyle = "#000";
    ctx.fill();

    // Draw the dropdown options if open
    if (this.isOpen) {
      for (let i = 0; i < this.options.length; i++) {
        const optionY = this.y + this.height + i * 30;
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(this.x, optionY, this.width, 30);
        ctx.fillStyle = "#000";
        ctx.fillText(this.options[i], this.x + 10, optionY + 20);
      }
    }
  }

  handleClick(mouseX, mouseY) {
    // Check if the main button is clicked
    if (
      mouseX >= this.x &&
      mouseX <= this.x + this.width &&
      mouseY >= this.y &&
      mouseY <= this.y + this.height
    ) {
      this.isOpen = !this.isOpen;
    } else if (this.isOpen) {
      // Check if an option is clicked
      for (let i = 0; i < this.options.length; i++) {
        const optionY = this.y + this.height + i * 30;
        if (
          mouseX >= this.x &&
          mouseX <= this.x + this.width &&
          mouseY >= optionY &&
          mouseY <= optionY + 30
        ) {
          this.selectedOption = this.options[i];
          this.isOpen = false;
          break;
        }
      }
    }
  }
}

export class ColorPicker {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.selectedColor = null;
    this.ctx = null;
  }

  draw(ctx) {
    // Ensure the context is set
    if (this.ctx === null) this.ctx = ctx;

    // Create a horizontal gradient for hue
    const hueGradient = this.ctx.createLinearGradient(
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
    this.ctx.fillStyle = hueGradient;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    // Create a vertical gradient for brightness
    const brightnessGradient = this.ctx.createLinearGradient(
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
    this.ctx.globalCompositeOperation = "multiply";
    this.ctx.fillStyle = brightnessGradient;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    // Reset the global composite operation to default
    this.ctx.globalCompositeOperation = "source-over";

    this.displaySelectedColor();
  }

  handleOnClick(event, pos, node) {
    const rect = this.ctx.canvas.getBoundingClientRect();
    const scaleX = this.ctx.canvas.width / rect.width;
    const scaleY = this.ctx.canvas.height / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    const pixel = this.ctx.getImageData(canvasX, canvasY, 1, 1).data;
    this.selectedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  }

  displaySelectedColor() {
    // // Clear a small area below the canvas to display the selected color
    // this.ctx.clearRect(0, this.canvas.height - 30, this.canvas.width, 30); // Adjusted coordinates
    this.ctx.fillStyle = this.selectedColor;
    this.ctx.fillRect(this.x, this.y + this.height, this.width, 10); // Adjusted coordinates
    // // Add text to show the RGB value
    // this.ctx.fillStyle = "#000";
    // this.ctx.font = "16px Arial";
    // this.ctx.fillText(
    //   `Selected Color: ${this.selectedColor}`,
    //   10,
    //   this.canvas.height - 10
    // ); // Adjusted coordinates
  }
}

export class PaintArea extends Widget {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.color = "white";
    this.clearColor = null;
    this.ctx = null;
    this.paintCanvas = null;
    this.paintCtx = null;
    this.lastImage = null;
    this.loadedImage = null;
    this.tempImage = null;
    this.isPainting = false;
    this.blockPainting = false;
    this.brushSize = 20;
    this.brushColor = "#000000";

    this.yOffset = 30;

    this.init();
    this.getDrawingFromAPI();
  }

  init() {
    // init paint canvas
    this.paintCanvas = document.createElement("canvas");
    this.paintCanvas.width = this.width; // Match the dimensions of the original canvas
    this.paintCanvas.height = this.height;
    this.paintCtx = this.paintCanvas.getContext("2d");

    // Fill the new canvas with a white background
    this.paintCtx.fillStyle = "white";
    this.paintCtx.fillRect(
      this.x,
      this.y,
      this.paintCanvas.width,
      this.paintCanvas.height
    );
  }

  clearWithColor(color) {
    this.clearColor = color;
  }

  updateMousePos(pos) {
    const x = pos[0];
    const y = pos[1] - this.yOffset;
    this.mousePos = [x, y];
    this.isMouseDown();
  }

  togglePainting() {
    this.isPainting = !this.isPainting;
  }

  isDragging() {
    return app.canvas.pointer.isDown;
  }

  isMouseDown() {
    this.isPainting = app.canvas.pointer.isDown;
  }

  saveTempImage() {
    console.log("image saved");
    this.tempImage = this.paintCanvas.toDataURL();
  }

  loadTempImage() {
    let img = new Image();
    img.src = this.tempImage;
    img.onload = () => {
      this.loadedImage = img;
    };
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

  draw(ctx) {
    if (this.ctx === null) this.ctx = ctx;
    if (this.blockPainting) return;

    // use loaded image once
    if (this.loadedImage !== null) {
      console.log("loaded image used");
      this.paintCtx.drawImage(this.loadedImage, 0, 0);
      //ctx.drawImage(this.paintCanvas, 0, 0);
      this.loadedImage = null;
    }

    // use clear color once
    if (this.clearColor !== null) {
      this.paintCtx.fillStyle = this.clearColor;
      this.paintCtx.fillRect(
        0,
        0,
        this.paintCanvas.width,
        this.paintCanvas.height
      );
      this.sendDrawingToAPI(); // save after clear
      this.clearColor = null;
    }

    // draw phase
    if (this.isPainting && this.isDragging()) {
      // Set the drawing properties
      this.paintCtx.lineWidth = this.brushSize;
      this.paintCtx.lineCap = "round";
      this.paintCtx.strokeStyle = this.brushColor;

      // Draw on the new canvas
      this.paintCtx.lineTo(this.mousePos[0], this.mousePos[1]);
      this.paintCtx.stroke();

      this.paintCtx.beginPath();
      this.paintCtx.moveTo(this.mousePos[0], this.mousePos[1]);

      // Store the last drawn image
      this.lastImage = this.paintCanvas.toDataURL();
    } else {
      // in case mouse up miss
      this.isPainting = false;
      this.paintCtx.beginPath();
    }
    // keep drawing on screen
    ctx.drawImage(this.paintCanvas, this.x, this.y);
  }
}

export class Preview {
  constructor() {
    this.mousePos = [0, 0];
    this.brushSize = 10;
    this.color = "rgba(128, 128, 128, 0.2)"; // 50% transparent gray
    this.dashColor = "black";
    this.widthLimit = 512;
    this.heightLimit = 592;
    this.yOffset = 80;
    this.isMouseIn = true;
    this.init();
  }

  updateBrushSize(size) {
    this.brushSize = size;
  }

  updateMousePos(pos) {
    this.mousePos = pos;
  }

  init() {
    //init preview canvas
    this.previewCanvas = document.createElement("canvas");
    this.previewCanvas.width = this.brushSize; //app.canvasContainer.width;
    this.previewCanvas.height = this.brushSize; //app.canvasContainer.height;
    this.previewCtx = this.previewCanvas.getContext("2d");
  }
  draw(ctx) {
    if (this.mousePos[0] > this.widthLimit) return;
    if (this.mousePos[1] > this.heightLimit) return;
    if (this.mousePos[1] < this.yOffset) return;
    if (!this.isMouseIn) return;

    ctx.beginPath();
    ctx.arc(this.mousePos[0], this.mousePos[1], this.brushSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw dotted outline
    ctx.setLineDash([3, 3]); // [dash length, gap length]
    ctx.strokeStyle = this.dashColor; // Outline color
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash to solid
  }
}

// DEPRECATED

export class ColorPickerOld {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.selectedColor = null;
    this.ctx = null;
  }

  draw(ctx) {
    if (this.ctx === null) this.ctx = ctx;

    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y
    );

    // Create a horizontal gradient for hue
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.17, "orange");
    gradient.addColorStop(0.34, "yellow");
    gradient.addColorStop(0.51, "green");
    gradient.addColorStop(0.68, "blue");
    gradient.addColorStop(0.85, "indigo");
    gradient.addColorStop(1, "violet");

    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add a vertical gradient for brightness
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

    ctx.fillStyle = brightnessGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Display the selected color
    ctx.fillStyle = this.selectedColor;
    ctx.fillRect(this.x, this.y + this.height, this.width, 30); // Adjusted coordinates

    // Add text to show the RGB value
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText(
      `Selected Color: ${this.selectedColor}`,
      this.x + 10,
      this.height - 10
    ); // Adjusted coordinates
  }

  handleOnClick(event, pos, node) {
    const x = pos[0];
    const y = pos[1];

    // Get the color at the clicked position
    const pixel = this.ctx.getImageData(x, y, 1, 1).data;
    this.selectedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  }

  displaySelectedColor() {
    // Clear a small area below the canvas to display the selected color
    //this.ctx.clearRect(this.x , this.height - 30, this.width, 30); // Adjusted coordinates
    this.ctx.fillStyle = this.selectedColor;
    this.ctx.fillRect(this.x, this.height, this.width, 30); // Adjusted coordinates

    // Add text to show the RGB value
    this.ctx.fillStyle = "#000";
    this.ctx.font = "16px Arial";
    this.ctx.fillText(
      `Selected Color: ${this.selectedColor}`,
      this.x + 10,
      this.height - 10
    ); // Adjusted coordinates
  }
}

export class CanvasObjectManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.objects = [];
  }

  addObject(obj) {
    this.objects.push(obj);
  }

  drawAll() {
    this.objects.forEach((obj) => obj.draw(this.ctx));
  }

  handleClick(x, y) {
    this.objects.forEach((obj) => {
      if (obj.isClicked && obj.isClicked(x, y)) {
        obj.onClick(); // Call object's click handler
      }
    });
  }
}

export class WidgetGlobal {
  constructor(
    x,
    y,
    width = 50,
    height = 50,
    color = "crimson",
    outline = false,
    outlineColor = "dark-grey",
    outlineWidth = 0.5,
    onClick = null,
    onMouseIn = null,
    onMouseOut = null
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.outline = outline;
    this.outlineColor = outlineColor;
    this.outlineWidth = outlineWidth;
    this.onClick = onClick;
    this.onMouseIn = onMouseIn;
    this.onMouseOut = onMouseOut;

    this.mousePos = [0, 0];
  }

  updateNodePos(nodePos) {
    this.nodePos = nodePos;
  }

  updateMousePos(nodePos) {
    this.nodePos = nodePos;
    const canvasX = app.canvas.canvas_mouse[0] || 0;
    const canvasY = app.canvas.canvas_mouse[1] || 0;
    this.mousePos[0] = nodePos[0] - canvasX;
    this.mousePos[1] = nodePos[1] - canvasY;
  }

  draw(ctx) {
    this.trackMouse(this.mousePos[0], this.mousePos[1]);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillText("Test", this.x + 50, this.y + 50);
  }

  trackMouse(x, y) {
    if (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    ) {
      console.log("mouse in"); //this.onMouseIn()
    }
  }
}

export class ButtonOLd {
  constructor(
    x,
    y,
    width = 20,
    height = 20,
    color = "red",
    text = null,
    outline = false,
    outlineColor = "dark-grey",
    outlineWidth = 0.5,
    onClick = null
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    (this._shape = Shapes.SQUARE), (this.text = text);
    this.radius = width / 2; // Radius for circle
    this.outline = outline; // Outline property
    this.outlineColor = outlineColor; // Outline color
    this.outlineWidth = outlineWidth;
    this.onClick = onClick; // Callback function for click event

    this.textColor = "black";
    this.font = "8px Arial";

    if (this.shape == Shapes.CIRCLE) {
      console.log("yes it is");
      this.height = this.width;
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

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; //"bottom";
      ctx.fillText(
        this.text,
        this.x + this.width / 2,
        this.y + this.height / 2
      );
    }
  }

  isClicked(x, y) {
    if (this.shape === Shapes.SQUARE) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    } else if (this.shape === Shapes.CIRCLE) {
      const distance = Math.sqrt(
        (x - (this.x + this.radius)) ** 2 + (y - (this.y + this.radius)) ** 2
      );
      return distance <= this.radius;
    }
    return false;
  }

  handleClick(x, y) {
    if (this.isClicked(x, y)) {
      if (this.onClick) {
        const originalColor = this.color;
        const originalPosX = this.x;
        const originalPosY = this.y;
        setTimeout(() => {
          this.color = originalColor;
          this.x = originalPosX;
          this.y = originalPosY;
        }, 100);
        this.color = lightenColor(this.color, 20);
        this.x = originalPosX + 1;
        this.y = originalPosY + 1;
        this.onClick(); // Call the provided callback function
      } else {
        console.log(this.text, "clicked"); // Default behavior
      }
    }
  }

  set shape(value) {
    this._shape = value;
    if (value === Shapes.CIRCLE) this.height = this.width;
  }

  get shape() {
    return this._shape;
  }
}
