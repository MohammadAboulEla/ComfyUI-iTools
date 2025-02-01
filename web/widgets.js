import { app } from "../../../scripts/app.js";
import { Shapes, lightenColor } from "./utils.js";

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

  handleClick(x, y) {
    if (this.isClicked(x, y)) {
      if (this.allowVisualClick) this.visualClick();
      if (this.onClick) this.onClick();
    } else {
      //console.log("clicked"); // Default behavior
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

export class Button extends Widget {
  constructor(x, y, width = 20, height = 20, text = null, onClick = null) {
    super(x, y, width, height, text, onClick);
    this.text = text;
    this.textColor = "black";
    this.font = "8px Arial";
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
    this.font = "12px Arial";
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
    min = 0,
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
    this.isDragging = false;
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
  }
  // draw(ctx) {
  //   // Draw the track
  //   ctx.fillStyle = this.trackColor;
  //   ctx.fillRect(this.x, this.y + (this.handleHeight - this.height) / 2, this.width, this.height);

  //   // Calculate the handle position
  //   const handleX = this.x + ((this.value - this.min) / (this.max - this.min)) * (this.width - this.handleWidth);

  //   // Draw the handle as a standard rectangle
  //   ctx.fillStyle = this.handleColor;
  //   ctx.fillRect(handleX, this.y, this.handleWidth, this.handleHeight);
  // }

  isHandleClicked(mousePos) {
    const x = mousePos[0];
    const y = mousePos[1];
    // if ((
    //   x >= this.x - 20 &&
    //   x <= this.x + this.width + 20 &&
    //   y >= this.y &&
    //   y <= this.y + this.handleHeight
    // ) ){
    //   console.log('true',);
    // }
    return (
      x >= this.x - 20 &&
      x <= this.x + this.width + 20 &&
      y >= this.y &&
      y <= this.y + this.handleHeight
    );
  }

  handleMouseDown(mousePos) {
    console.log("click");
    if (this.isHandleClicked(mousePos) && app.canvas.pointer.isDown) {
      this.isDragging = true;
    } else {
      this.isDragging = false;
    }
  }

  handleMouseMove(mousePos) {
    const x = mousePos[0];
    if (this.isDragging) {
      let newValue =
        ((x - this.x) / this.width) * (this.max - this.min) + this.min;
      newValue = Math.max(this.min, Math.min(this.max, newValue));
      this.value = newValue;

      if (this.onChange) {
        this.onChange(this.value);
      }
    }
  }

  handleMouseUp() {
    this.isDragging = false;
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

export class ColorPicker0 {
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
    this.ctx.fillRect(this.x, this.y + this.height, this.width, 30); // Adjusted coordinates
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
