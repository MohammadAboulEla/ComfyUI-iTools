import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartText extends BaseSmartWidget {
  constructor(x, y, node, options = {}) {
    super(node);
    this.myX = x;
    this.myY = y;

    this.placeholderColor = "grey";
    this.img = new Image(); // Create an image object
    this.imgLoaded = true;

    this.text = "iTools";
    this.isPicked = false;
    this.isResizing = false; // Track if the user is resizing
    this.resizeAnchor = null; // Store the anchor point being resized (e.g., 'top-left', 'right', etc.)
    this.resizeThreshold = 10; // Distance threshold for detecting resize areas

    this.isUnderCover = false;

    this.isSelected = false;
    this.buttonXoffset = 5;
    this.buttonYoffset = 5;

    this.closeButton = false;
    this.closeButtonWidth = 10;
    this.closeButtonHeight = 10;
    this.closeButtonOffsetX = 10;
    this.closeButtonOffsetY = 10;
    this.onClosed = null;

    // properties of text
    this.textColor = "brown";
    this.fontSize = 102;
    this.fontWeight = "bolder"; // Options: normal, bold, bolder, lighter, or numeric (100–900)
    this.handleScale = 2.5;
    this.width = this.fontSize * this.handleScale;
    this.height = (this.fontSize * this.handleScale) / 2;
    this.isItalic = false;
    this.fonts = [
      "Arial",
      "Verdana",
      "Tahoma",
      "Trebuchet MS",
      "Times New Roman",
      "Georgia",
      "Palatino Linotype",
      "Courier New",
      "Consolas",
      "Lucida Console",
      "Comic Sans MS",
    ];
    this.fontIndex = 0;
    this.fonts = [
      "Arial",
      "Verdana",
      "Tahoma",
      "Trebuchet MS",
      "Times New Roman",
      "Georgia",
      "Palatino Linotype",
      "Courier New",
      "Consolas",
      "Lucida Console",
      "Comic Sans MS",
    ];
    this.fontName = this.fonts[this.fontIndex];
    this.font = `${this.isItalic ? "italic" : ""} ${this.fontWeight} ${this.fontSize}px ${this.fontName}`;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.isTextObject = true;

    // properties for rotation
    this.rotateThreshold = 15;
    this.rotateDrawMargin = this.rotateThreshold - 2.5;
    this.rotationAngle = 0;
    this.initialRotationAngle = 0;
    this.isRotating = false;
    this.rotationCenter = {
      x: this.width / 2,
      y: this.height / 2,
    };

    // Apply options if provided
    Object.assign(this, options);

    // Add self to the node
    node.addCustomWidget(this);
  }
  cycleFont() {
    this.fontIndex = (this.fontIndex + 1) % this.fonts.length;
    this.fontName = this.fonts[this.fontIndex];
  }
  cycleFontWeight() {
    const weights = ["normal", "bold"]; //, "bolder", "lighter"/"100", "200", "300", "400", "500", "600", "700", "800", "900"];
    const currentIndex = weights.indexOf(this.fontWeight);
    this.fontWeight = weights[(currentIndex + 1) % weights.length];
    this.font = `${this.fontWeight} ${this.fontSize}px ${this.fontName}`;
  }

  toggleItalic() {
    this.isItalic = !this.isItalic;
    this.font = `${this.isItalic ? "italic" : "normal"} ${this.fontWeight} ${this.fontSize}px ${this.fontName}`;
  }

  // Method to handle rotation start
  handleRotateStart() {
    if (this.isMouseInRotatedArea()) {
      this.isRotating = true;
      this.rotationStartPos = { x: this.mousePos.x, y: this.mousePos.y };
    }
  }

  // Method to handle rotation during drag
  handleRotateMove() {
    if (this.isRotating) {
      // Calculate mouse position relative to the center of rotation
      const centerX = this.myX + this.width / 2;
      const centerY = this.myY + this.height / 2;
      const dx = this.mousePos.x - centerX;
      const dy = this.mousePos.y - centerY;

      // Calculate the angle from the center to the current mouse position
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Calculate the angle from the center to the initial rotation start position
      const startDx = this.rotationStartPos.x - this.rotationCenter.x;
      const startDy = this.rotationStartPos.y - this.rotationCenter.y;
      const startAngle = Math.atan2(startDy, startDx) * (180 / Math.PI);

      // Update rotation angle correctly
      this.rotationAngle = (this.initialRotationAngle + (currentAngle - startAngle)) % 360;

      // Ensure the rotation angle is within [0, 360)
      if (this.rotationAngle < 0) {
        this.rotationAngle += 360;
      }
    }
  }

  // Method to handle rotation end
  handleRotateEnd() {
    this.isRotating = false;
    this.initialRotationAngle = this.rotationAngle;
  }

  handleDown() {
    if (this.isUnderCover) return;
    if (this.closeButton && this.isMouseInCloseButtonArea()) {
      this.markDelete = true;
      if (this.onClosed) this.onClosed();
    }
    if (this.isMouseInResizeArea()) {
      this.isResizing = true;
      this.resizeAnchor = this.getResizeAnchor();
    } else if (this.isMouseInRotatedArea()) {
      this.handleRotateStart();
    } else if (this.isMouseIn(-20) && this.isSelected && !this.isUnderCover) {
      this.isPicked = true;
      this.pickOffset = {
        x: this.mousePos.x - this.myX,
        y: this.mousePos.y - this.myY,
      };
    }
  }

  handleMove() {
    const canvasX = 0,
      canvasY = 80,
      width = 512 - this.width,
      height = 512 - this.height;

    if (this.isResizing) {
      this.resizeImage();
    } else if (this.isRotating) {
      this.handleRotateMove();
    } else if (this.isPicked) {
      let newX = this.mousePos.x - this.pickOffset.x;
      let newY = this.mousePos.y - this.pickOffset.y;

      // Corrected clamping logic
      this.myX = Math.max(canvasX, Math.min(newX, canvasX + width));
      this.myY = Math.max(canvasY, Math.min(newY, canvasY + height));
    }
  }

  handleClick() {
    this.isPicked = false;
    this.isResizing = false;
    this.resizeAnchor = null;
    this.handleRotateEnd();
  }

  handleDrag() {
    // for changing cursor
    if (this.isMouseIn()) {
      //app.canvas.canvas.style.cursor = "url('/cursor/colorSelect.png') 15 25, auto";
      //app.canvas.canvas.style.cursor = "grabbing";
    }
    if (this.isMouseInResizeArea()) {
      const dir = this.getResizeAnchor();
      switch (dir) {
        case "bottom-right":
          app.canvas.canvas.style.cursor = "se-resize";
          break;
        case "bottom":
          app.canvas.canvas.style.cursor = "s-resize";
          break;
        case "bottom-left":
          app.canvas.canvas.style.cursor = "sw-resize";
          break;
        case "top-right":
          app.canvas.canvas.style.cursor = "ne-resize";
          break;
        case "top":
          app.canvas.canvas.style.cursor = "n-resize";
          break;
        case "top-left":
          app.canvas.canvas.style.cursor = "nw-resize";
          break;
        case "right":
          app.canvas.canvas.style.cursor = "e-resize";
          break;
        case "left":
          app.canvas.canvas.style.cursor = "w-resize";
          break;

        default:
          break;
      }
    }
    if (this.isMouseInRotatedArea()) {
      app.canvas.canvas.style.cursor = "grabbing";
    }
  }

  isMouseIn(safeZone = 0) {
    const { x, y } = this.mousePos;
    return (
      x >= this.myX - safeZone &&
      x <= this.myX + this.width + safeZone &&
      y >= this.myY - safeZone &&
      y <= this.myY + this.height + safeZone
    );
  }

  isMouseInResizeArea() {
    const { x: mouseX, y: mouseY } = this.mousePos;
    const threshold = this.resizeThreshold;

    // Translate mouse position relative to the center of the image
    const dx = mouseX - (this.myX + this.width / 2);
    const dy = mouseY - (this.myY + this.height / 2);

    // Rotate the coordinates back by the negative of the rotation angle
    const radianAngle = -(this.rotationAngle * Math.PI) / 180;
    const cosA = Math.cos(radianAngle);
    const sinA = Math.sin(radianAngle);

    // Apply inverse rotation
    const rotatedX = dx * cosA - dy * sinA;
    const rotatedY = dx * sinA + dy * cosA;

    // Transform the rotated coordinates back to the image's top-left corner
    const rx = rotatedX + this.width / 2;
    const ry = rotatedY + this.height / 2;

    // Now check if the mouse is in a resize area using the corrected coordinates
    const topLeft = rx >= -threshold && rx <= threshold && ry >= -threshold && ry <= threshold;
    const topRight =
      rx >= this.width - threshold && rx <= this.width + threshold && ry >= -threshold && ry <= threshold;
    const bottomLeft =
      rx >= -threshold && rx <= threshold && ry >= this.height - threshold && ry <= this.height + threshold;
    const bottomRight =
      rx >= this.width - threshold &&
      rx <= this.width + threshold &&
      ry >= this.height - threshold &&
      ry <= this.height + threshold;

    const top = rx >= 0 && rx <= this.width && ry >= -threshold && ry <= threshold;
    const bottom = rx >= 0 && rx <= this.width && ry >= this.height - threshold && ry <= this.height + threshold;
    const left = rx >= -threshold && rx <= threshold && ry >= 0 && ry <= this.height;
    const right = rx >= this.width - threshold && rx <= this.width + threshold && ry >= 0 && ry <= this.height;

    return topLeft || topRight || bottomLeft || bottomRight || top || bottom || left || right;
  }

  isMouseInRotatedArea() {
    const { x: mouseX, y: mouseY } = this.mousePos;
    const threshold = this.rotateThreshold;
    const margin = this.rotateDrawMargin - 5; // Move the detection area slightly inside the image

    // Translate mouse position relative to the center of the image
    const dx = mouseX - (this.myX + this.width / 2);
    const dy = mouseY - (this.myY + this.height / 2);

    // Rotate the coordinates back by the negative of the rotation angle
    const radianAngle = -(this.rotationAngle * Math.PI) / 180;
    const cosA = Math.cos(radianAngle);
    const sinA = Math.sin(radianAngle);

    // Apply inverse rotation
    const rotatedX = dx * cosA - dy * sinA;
    const rotatedY = dx * sinA + dy * cosA;

    // Transform the rotated coordinates back to the image's top-left corner
    const rx = rotatedX + this.width / 2;
    const ry = rotatedY + this.height / 2;

    // Define slightly inset corner areas
    const topLeft = rx >= margin && rx <= margin + threshold && ry >= margin && ry <= margin + threshold;
    const topRight =
      rx >= this.width - margin - threshold && rx <= this.width - margin && ry >= margin && ry <= margin + threshold;
    const bottomLeft =
      rx >= margin && rx <= margin + threshold && ry >= this.height - margin - threshold && ry <= this.height - margin;
    const bottomRight =
      rx >= this.width - margin - threshold &&
      rx <= this.width - margin &&
      ry >= this.height - margin - threshold &&
      ry <= this.height - margin;

    return topLeft || topRight || bottomLeft || bottomRight;
  }

  isMouseInCloseButtonArea() {
    const { x, y } = this.mousePos;
    return (
      x >= this.myX + this.closeButtonOffsetX &&
      x <= this.myX + this.closeButtonWidth + this.closeButtonOffsetX &&
      y >= this.myY + this.closeButtonOffsetY &&
      y <= this.myY + this.closeButtonOffsetY + this.closeButtonHeight
    );
  }

  getResizeAnchor() {
    const { x: mouseX, y: mouseY } = this.mousePos;
    const threshold = this.resizeThreshold;

    // Translate mouse position relative to the center of the image
    const dx = mouseX - (this.myX + this.width / 2);
    const dy = mouseY - (this.myY + this.height / 2);

    // Rotate the coordinates back by the negative of the rotation angle
    const radianAngle = -(this.rotationAngle * Math.PI) / 180;
    const cosA = Math.cos(radianAngle);
    const sinA = Math.sin(radianAngle);

    // Corrected rotation formula
    const rotatedX = dx * cosA - dy * sinA;
    const rotatedY = dx * sinA + dy * cosA;

    // Transform the rotated coordinates back to the image's top-left corner
    const rx = rotatedX + this.width / 2;
    const ry = rotatedY + this.height / 2;

    // Check which resize anchor the transformed coordinates fall into
    if (rx >= -threshold && rx <= threshold && ry >= -threshold && ry <= threshold) {
      return "top-left";
    } else if (rx >= this.width - threshold && rx <= this.width + threshold && ry >= -threshold && ry <= threshold) {
      return "top-right";
    } else if (rx >= -threshold && rx <= threshold && ry >= this.height - threshold && ry <= this.height + threshold) {
      return "bottom-left";
    } else if (
      rx >= this.width - threshold &&
      rx <= this.width + threshold &&
      ry >= this.height - threshold &&
      ry <= this.height + threshold
    ) {
      return "bottom-right";
    } else if (rx >= 0 && rx <= this.width && ry >= -threshold && ry <= threshold) {
      return "top";
    } else if (rx >= 0 && rx <= this.width && ry >= this.height - threshold && ry <= this.height + threshold) {
      return "bottom";
    } else if (rx >= -threshold && rx <= threshold && ry >= 0 && ry <= this.height) {
      return "left";
    } else if (rx >= this.width - threshold && rx <= this.width + threshold && ry >= 0 && ry <= this.height) {
      return "right";
    }

    return null; // No valid resize anchor detected
  }

  resizeImage() {
    if (!this.isSelected) return;
    const { x, y } = this.mousePos;
    const canvasX = 0,
      canvasY = 80,
      maxWidth = 512,
      maxHeight = 592;

    switch (this.resizeAnchor) {
      case "top-left": {
        const newWidth = this.myX + this.width - x;
        const newHeight = this.myY + this.height - y;
        this.myX = Math.max(canvasX, x); // Ensure x stays within canvas
        this.myY = Math.max(canvasY, y); // Ensure y stays within canvas
        this.width = Math.max(10, Math.min(newWidth, maxWidth - this.myX));
        this.height = Math.max(10, Math.min(newHeight, maxHeight - this.myY));
        break;
      }
      case "top-right": {
        const newHeight = this.myY + this.height - y;
        this.myY = Math.max(canvasY, y); // Ensure y stays within canvas
        this.width = Math.max(10, Math.min(x - this.myX, maxWidth - this.myX));
        this.height = Math.max(10, Math.min(newHeight, maxHeight - this.myY));
        break;
      }
      case "bottom-left": {
        const newWidth = this.myX + this.width - x;
        this.myX = Math.max(canvasX, x); // Ensure x stays within canvas
        this.width = Math.max(10, Math.min(newWidth, maxWidth - this.myX));
        this.height = Math.max(10, Math.min(y - this.myY, maxHeight - this.myY));
        break;
      }
      case "bottom-right": {
        this.width = Math.max(10, Math.min(x - this.myX, maxWidth - this.myX));
        this.height = Math.max(10, Math.min(y - this.myY, maxHeight - this.myY));
        break;
      }
      case "top": {
        const newHeight = this.myY + this.height - y;
        this.myY = Math.max(canvasY, y); // Ensure y stays within canvas
        this.height = Math.max(10, Math.min(newHeight, maxHeight - this.myY));
        break;
      }
      case "bottom": {
        this.height = Math.max(10, Math.min(y - this.myY, maxHeight - this.myY));
        break;
      }
      case "left": {
        const newWidth = this.myX + this.width - x;
        this.myX = Math.max(canvasX, x); // Ensure x stays within canvas
        this.width = Math.max(10, Math.min(newWidth, maxWidth - this.myX));
        break;
      }
      case "right": {
        this.width = Math.max(10, Math.min(x - this.myX, maxWidth - this.myX));
        break;
      }
      default:
        break;
    }
    this.fontSize = this.width / this.handleScale;
  }

  fillImage(pa, scale, offsetY = 80) {
    this.width = Math.min(pa[0] / scale, 512);
    this.height = Math.min(pa[1] / scale, 512);
    // Center the image in the available space
    this.myX = (512 - this.width) / 2;
    this.myY = (512 - this.height) / 2 + offsetY;
  }

  fitImage(pa, dim = "w", scale = 1, offsetY = 80) {
    if (!this.imgLoaded) {
      console.warn("Image is not loaded yet.");
      return;
    }
    const aspectRatio = this.img.width / this.img.height;
    // if (allow_debug) {
    //   console.log("scale", scale);
    // }
    let maxWidth = Math.min(pa[0] / scale, 512);
    let maxHeight = Math.min(pa[1] / scale, 512);

    if (dim === "w") {
      // Start by setting width to max and calculate height
      this.width = maxWidth;
      this.height = this.width / aspectRatio;
      // If height exceeds maxHeight, adjust height and recalculate width
      if (this.height > maxHeight) {
        this.height = maxHeight;
        this.width = this.height * aspectRatio;
      }
    } else {
      // Start by setting height to max and calculate width
      this.height = maxHeight;
      this.width = this.height * aspectRatio;
      // If width exceeds maxwidth, adjust width and recalculate height
      if (this.width > maxWidth) {
        this.width = maxWidth;
        this.height = this.width / aspectRatio;
      }
    }

    // Center the image in the available space
    this.myX = (512 - this.width) / 2;
    this.myY = (512 - this.height) / 2 + offsetY;
  }

  plotImageOnCanvas(ctx, xOffset, yOffset, scale) {
    if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
      console.error("Invalid canvas context provided.");
      return;
    }
    // if (allow_debug) {
    //   console.log("scale", scale);
    // }
    if (scale === -1 || scale === 0) scale = 1;
    else if (scale === 1) scale = 2;
    else if (scale === 2) scale = 4;
    const { myX, myY, width, height, rotationAngle } = this;

    // Save the context state before transformations
    ctx.save();

    // Calculate the scaled dimensions and offsets
    //if(allow_debug){console.log('SCALE is',scale);}
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const scaledX = (myX - xOffset) * scale;
    const scaledY = (myY - yOffset) * scale;

    // Translate to the center of the scaled image
    ctx.translate(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2);

    // Rotate the context
    ctx.rotate((rotationAngle * Math.PI) / 180);

    // Translate back to the top-left corner of the scaled image
    ctx.translate(-scaledWidth / 2, -scaledHeight / 2);

    // Plot the text
    ctx.fillStyle = this.textColor;
    ctx.font = `${this.isItalic ? "italic" : ""} ${this.fontWeight} ${this.fontSize * scale}px ${this.fontName}`;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(this.text, scaledWidth / 2, scaledHeight / 2);

    // Restore the context state
    ctx.restore();

    // plot preview
    this.isPlotted = true;
    setTimeout(() => {
      this.isPlotted = false;
    }, 200);
  }

  draw(ctx) {
    if (this.markDelete) return;

    // Save the context state before transformations
    ctx.save();

    this.rotationCenter = { x: this.myX + this.width / 2, y: this.myY + this.height / 2 };
    // Translate to the center of the image
    ctx.translate(this.rotationCenter.x, this.rotationCenter.y);
    //ctx.translate(this.myX + this.width / 2, this.myY + this.height / 2);

    // Rotate the context
    ctx.rotate((this.rotationAngle * Math.PI) / 180);

    // Translate back to the top-left corner of the image
    ctx.translate(-this.myX - this.width / 2, -this.myY - this.height / 2);

    // Draw the text
    if (this.text) {
      ctx.fillStyle = "rgba(128, 128, 128, 0.0)";
      ctx.fillRect(this.myX, this.myY, this.width, this.height);

      ctx.fillStyle = this.textColor;
      ctx.font = `${this.isItalic ? "italic" : ""} ${this.fontWeight} ${this.fontSize}px ${this.fontName}`;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, this.myX + this.width / 2, this.myY + this.height / 2);
    }

    // Draw resize handles (small outlined squares) at the edges and corners
    if (this.isSelected) {
      // Draw a dashed outline around the image
      ctx.strokeStyle = "#333"; // Color of the dashed outline
      ctx.lineWidth = 1.5; // Width of the dashed outline
      ctx.setLineDash([5, 5]); // Dash pattern: 5px dash, 5px gap
      ctx.strokeRect(this.myX, this.myY, this.width, this.height);

      const handleSize = 10; // Size of the resize handle (width and height)
      ctx.strokeStyle = "#333"; // Color of the resize handles
      ctx.lineWidth = 1.5; // Width of the resize handle outline
      ctx.setLineDash([]); // Reset dash pattern for solid lines

      // Draw handles at the corners
      ctx.strokeRect(this.myX - handleSize / 2, this.myY - handleSize / 2, handleSize, handleSize); // Top-left
      ctx.strokeRect(this.myX + this.width - handleSize / 2, this.myY - handleSize / 2, handleSize, handleSize); // Top-right
      ctx.strokeRect(this.myX - handleSize / 2, this.myY + this.height - handleSize / 2, handleSize, handleSize); // Bottom-left
      ctx.strokeRect(
        this.myX + this.width - handleSize / 2,
        this.myY + this.height - handleSize / 2,
        handleSize,
        handleSize
      ); // Bottom-right

      // Draw handles at the midpoints of the edges
      ctx.strokeRect(this.myX + this.width / 2 - handleSize / 2, this.myY - handleSize / 2, handleSize, handleSize); // Top
      ctx.strokeRect(
        this.myX + this.width / 2 - handleSize / 2,
        this.myY + this.height - handleSize / 2,
        handleSize,
        handleSize
      ); // Bottom
      ctx.strokeRect(this.myX - handleSize / 2, this.myY + this.height / 2 - handleSize / 2, handleSize, handleSize); // Left
      ctx.strokeRect(
        this.myX + this.width - handleSize / 2,
        this.myY + this.height / 2 - handleSize / 2,
        handleSize,
        handleSize
      ); // Right
    }

    // Draw rotate dots
    if ((this.isMouseInRotatedArea() && this.isSelected) || this.isRotating) {
      const handleSize = 16; // Diameter of the handle
      const radius = handleSize / 2;
      const margin = this.rotateDrawMargin; // Move handles slightly inside the image

      ctx.strokeStyle = "red"; // Red color for handles
      ctx.lineWidth = 1.5;

      // Function to draw a circle at a given position
      const drawHandle = (x, y) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      };

      // Draw circles at the slightly inset corners
      if (!this.closeButton) drawHandle(this.myX + margin, this.myY + margin); // Top-left
      drawHandle(this.myX + this.width - margin, this.myY + margin); // Top-right
      drawHandle(this.myX + margin, this.myY + this.height - margin); // Bottom-left
      drawHandle(this.myX + this.width - margin, this.myY + this.height - margin); // Bottom-right
    }

    // Draw visual plot
    if (this.isPlotted) {
      ctx.fillStyle = "rgba(255,0, 0, 0.1)";
      ctx.fillRect(this.myX, this.myY, this.width, this.height);
    }

    // Draw close button
    if (this.closeButton) {
      const radius = 2.5;

      ctx.beginPath();
      ctx.moveTo(this.myX + this.closeButtonOffsetX + radius, this.myY + this.closeButtonOffsetY);
      ctx.lineTo(
        this.myX + this.closeButtonOffsetX + this.closeButtonWidth - radius,
        this.myY + this.closeButtonOffsetY
      );
      ctx.arcTo(
        this.myX + this.closeButtonOffsetX + this.closeButtonWidth,
        this.myY + this.closeButtonOffsetY,
        this.myX + this.closeButtonOffsetX + this.closeButtonWidth,
        this.myY + this.closeButtonOffsetY + radius,
        radius
      );
      ctx.lineTo(
        this.myX + this.closeButtonOffsetX + this.closeButtonWidth,
        this.myY + this.closeButtonOffsetY + this.closeButtonHeight - radius
      );
      ctx.arcTo(
        this.myX + this.closeButtonOffsetX + this.closeButtonWidth,
        this.myY + this.closeButtonOffsetY + this.closeButtonHeight,
        this.myX + this.closeButtonOffsetX + this.closeButtonWidth - radius,
        this.myY + this.closeButtonOffsetY + this.closeButtonHeight,
        radius
      );
      ctx.lineTo(
        this.myX + this.closeButtonOffsetX + radius,
        this.myY + this.closeButtonOffsetY + this.closeButtonHeight
      );
      ctx.arcTo(
        this.myX + this.closeButtonOffsetX,
        this.myY + this.closeButtonOffsetY + this.closeButtonHeight,
        this.myX + this.closeButtonOffsetX,
        this.myY + this.closeButtonOffsetY + this.closeButtonHeight - radius,
        radius
      );
      ctx.lineTo(this.myX + this.closeButtonOffsetX, this.myY + this.closeButtonOffsetY + radius);
      ctx.arcTo(
        this.myX + this.closeButtonOffsetX,
        this.myY + this.closeButtonOffsetY,
        this.myX + this.closeButtonOffsetX + radius,
        this.myY + this.closeButtonOffsetY,
        radius
      );
      ctx.closePath();

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fill();

      // Draw outline if enabled
      if (false) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw text
      if (this.closeButton) {
        ctx.fillStyle = "black";
        ctx.font = "12px Arial Bold";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "x",
          this.myX + this.closeButtonOffsetX + this.closeButtonWidth / 2 + 0,
          this.myY + this.closeButtonOffsetY + this.closeButtonHeight / 2 + 0
        );
      }
    }

    ctx.restore();
  }
}