import { app } from "../../../scripts/app.js";


function lightenColor(color, percent) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  color = ctx.fillStyle; 

  if (!color.startsWith("#")) {
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch) {
      color = `#${rgbMatch
        .map((x) => parseInt(x).toString(16).padStart(2, "0"))
        .join("")}`;
    }
  }

  color = color.replace(/^#/, "");
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);

  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const Shapes = Object.freeze({
  SQUARE: "square",
  CIRCLE: "circle",
});

export const Colors = [
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

export class Widget {
  constructor(
    x,
    y,
    width = 50,
    height = 50,
    onClick = null
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = "crimson";
    this.radius = width / 2;
    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = .5;
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
    this.x = originalPosX + 1;
    this.y = originalPosY + 1;
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
  constructor(
    x,
    y,
    width = 20,
    height = 20,
    text = null,
    onClick = null
  ) {
    super(
      x,
      y,
      width,
      height,
      text,
      onClick
    );
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

export class Label {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.textColor = "white";
    this.font = "16px Arial";
    this.textAlign = "left";
    this.textBaseline = "middle";
    this.xOffset = 0;
    this.yOffset = 0;
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
    trackColor = "#d3d3d3",
    handleColor = "#4b0082",
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

export class Checkbox {
  constructor(
    x,
    y,
    width = 20,
    height = 20,
    color = "red",
    checkedColor = "green",
    outline = false,
    outlineColor = "dark-grey",
    outlineWidth = 0.5,
    isChecked = false,
    onClick = null
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.checkedColor = checkedColor;
    this.outline = outline; // Outline property
    this.outlineColor = outlineColor; // Outline color
    this.outlineWidth = outlineWidth;
    this.isChecked = isChecked;
    this.onClick = onClick; // Callback function for click event

    this.checkmarkSize = 10; // Size of the checkmark
  }

  draw(ctx) {
    // Draw rectangle
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw outline if enabled
    if (this.outline) {
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = this.outlineWidth;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    // Draw checkmark if checked
    if (this.isChecked) {
      ctx.beginPath();
      ctx.moveTo(this.x + 2, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height - 3);
      ctx.lineTo(this.x + this.width - 2, this.y + 3);
      ctx.strokeStyle = this.checkedColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  isClicked(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  handleClick(x, y) {
    if (this.isClicked(x, y)) {
      this.isChecked = !this.isChecked;
      if (this.onClick) {
        this.onClick(this.isChecked); // Call the provided callback function with checked status
      } else {
        console.log("Checkbox", this.isChecked ? "checked" : "unchecked");
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
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.fillText(this.selectedOption || 'Select an option', this.x + 10, this.y + 25);

      // Draw the dropdown arrow
      ctx.beginPath();
      ctx.moveTo(this.x + this.width - 20, this.y + 10);
      ctx.lineTo(this.x + this.width - 10, this.y + 10);
      ctx.lineTo(this.x + this.width - 15, this.y + 20);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();

      // Draw the dropdown options if open
      if (this.isOpen) {
          for (let i = 0; i < this.options.length; i++) {
              const optionY = this.y + this.height + (i * 30);
              ctx.fillStyle = '#4CAF50';
              ctx.fillRect(this.x, optionY, this.width, 30);
              ctx.fillStyle = '#000';
              ctx.fillText(this.options[i], this.x + 10, optionY + 20);
          }
      }
  }

  handleClick(mouseX, mouseY) {
      // Check if the main button is clicked
      if (mouseX >= this.x && mouseX <= this.x + this.width &&
          mouseY >= this.y && mouseY <= this.y + this.height) {
          this.isOpen = !this.isOpen;
      } else if (this.isOpen) {
          // Check if an option is clicked
          for (let i = 0; i < this.options.length; i++) {
              const optionY = this.y + this.height + (i * 30);
              if (mouseX >= this.x && mouseX <= this.x + this.width &&
                  mouseY >= optionY && mouseY <= optionY + 30) {
                  this.selectedOption = this.options[i];
                  this.isOpen = false;
                  break;
              }
          }
      }
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
