import { app } from "../../../scripts/app.js";
import { Shapes, lightenColor, hexDataToImage, trackMouseColor, drawCheckerboard, drawAngledStrips } from "./utils.js";
import { api } from "../../../scripts/api.js";
import { allow_debug } from "./js_shared.js";

class BaseSmartWidget {
  constructor(node) {
    this.node = node;
    this._markDelete = false;
    this._mousePos = [0, 0];
  }

  init() {}

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  isLowQuality() {
    const canvas = app.canvas;
    const scale = canvas?.ds?.scale ?? 1; // Get scale, default to 1 if undefined
    return scale <= 0.5;
  }

  delete() {
    this.node.widgets = this.node.widgets.filter(widget => widget !== this);
    this.node.setDirtyCanvas(true, true);
  }

  get markDelete() {
    return this._markDelete;
  }

  set markDelete(value) {
    this._markDelete = Boolean(value);
  }

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
    app.canvas.onDrawForeground = (ctx) => this.handleMouseMove(ctx); //works every where even when dragging
    app.canvas.canvas.onmousemove = (e) => this.handleMouseDrag(e); //works every where but not when dragging
  }

  handleMouseDown(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleDown?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDown", this.mousePos);
  }

  handleMouseMove(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleMove?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseMoved");
  }

  handleMouseClick(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleClick?.(e);
      }
    });
    this.filterDeletedWIdgets();
    if (this.allowDebug) console.log("MouseClicked");
  }

  handleMouseDrag(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleDrag?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDrag");
  }

  filterDeletedWIdgets() {
    console.log('node.widgets',this.node.widgets)
    console.log('node.widgets',this.node.widgets.length)
    // Filter out widgets marked for deletion
    this.node.widgets = this.node.widgets.filter((widget) => !widget.markDelete);
    console.log('node.widgets',this.node.widgets.length)
    this.node.setDirtyCanvas(true, true);
    console.log('node.widgets',this.node.widgets)
  }
}
export class SmartImage extends BaseSmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(node);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.placeholderColor = "grey";
    this.img = new Image(); // Create an image object
    this.imgLoaded = false; // Track if the image has been loaded
    this.apiEndpoint = "/itools/request_load_img"; // API endpoint for fetching the image
    this.filenamePrefix = "iToolsTestImg";
    this.isPicked = false;
    this.isResizing = false; // Track if the user is resizing
    this.resizeAnchor = null; // Store the anchor point being resized (e.g., 'top-left', 'right', etc.)
    this.resizeThreshold = 10; // Distance threshold for detecting resize areas
    this.onImgLoaded = null;
    this.isUnderCover = false;
    
    this.isSelected = false;
    this.buttonXoffset = 5;
    this.buttonYoffset = 5;

    this.closeButton = false;
    this.closeButtonWidth = 10;
    this.closeButtonHeight = 10;
    this.closeButtonOffsetX = 10;
    this.closeButtonOffsetY = 10;

    // properties for rotation
    this.rotateDrawMargin = 25;
    this.rotationAngle = 0;
    this.initialRotationAngle = 0;
    this.isRotating = false;
    this.rotationCenter = {
      x: this.width / 2,
      y: this.height / 2,
    };

    this.loader = null;

    this.isMasked = false;

    // Apply options if provided
    Object.assign(this, options);

    // // Fetch the image from the API if an ID or filename prefix is provided
    // if (this.filenamePrefix) {
    //   this.fetchImageFromAPI();
    // }

    // Add self to the node
    node.addCustomWidget(this);
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
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
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

  updateImage(newSrc) {
    if (!newSrc) {
      console.error("Invalid image source provided.");
      return;
    }

    // Reset the imgLoaded flag
    this.imgLoaded = false;

    // Set the new image source
    this.img.src = ""; // Clear the previous source to ensure proper reloading
    this.img.src = newSrc;

    // Handle image loading events
    this.img.onload = () => {
      this.imgLoaded = true;
      if (this.onImgLoaded) this.onImgLoaded();
    };

    this.img.onerror = () => {
      console.error("Failed to load the new image.");
    };
  }

  async fetchImageFromAPI() {
    const formData = new FormData();
    formData.append("filename_prefix", this.filenamePrefix || "iToolsTestImg");
    try {
      const response = await api.fetchApi(this.apiEndpoint, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.status === "success") {
        const { img } = result.data;

        function hexToBase64(hexString) {
          if (!hexString || typeof hexString !== "string") {
            console.error("Invalid hexadecimal string provided.");
            return "";
          }
          const chunkSize = 1024 * 1024; // Process in chunks of 1MB
          let base64 = "";
          for (let i = 0; i < hexString.length; i += chunkSize * 2) {
            const chunk = hexString.slice(i, i + chunkSize * 2);
            let binaryString = "";
            for (let c = 0; c < chunk.length; c += 2) {
              const byte = parseInt(chunk.substr(c, 2), 16);
              binaryString += String.fromCharCode(byte);
            }
            base64 += btoa(binaryString);
          }
          return base64;
        }

        this.img.src = `data:image/png;base64,${hexToBase64(img)}`;
        this.img.onload = () => {
          this.imgLoaded = true;
          if (this.onImgLoaded) this.onImgLoaded();
        };
        this.img.onerror = () => {
          console.error("Failed to load image from API");
        };
        if (allow_debug) console.log("Image received successfully.");
      } else {
        console.error("Error fetching image:", result.message);
      }
    } catch (error) {
      console.error("Error communicating with the API:", error);
    }
  }

  async fetchMaskedImageFromAPI() {
    const formData = new FormData();
    formData.append("filename_prefix", "iToolsMaskedImg");
    try {
      const response = await api.fetchApi(this.apiEndpoint, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.status === "success") {
        const { img } = result.data;

        function hexToBase64(hexString) {
          if (!hexString || typeof hexString !== "string") {
            console.error("Invalid hexadecimal string provided.");
            return "";
          }
          let binaryString = "";
          for (let i = 0; i < hexString.length; i += 2) {
            const byte = parseInt(hexString.substr(i, 2), 16);
            binaryString += String.fromCharCode(byte);
          }
          return btoa(binaryString);
        }

        this.img.src = `data:image/png;base64,${hexToBase64(img)}`;
        this.img.onload = () => {};
        this.img.onerror = () => {
          console.error("Failed to load Masked image from API");
        };
        if (allow_debug) console.log("Masked image received successfully.");
        this.loader.markDelete = true;
        this.node.setDirtyCanvas(true, true);
      } else {
        console.error("Error fetching image:", result.message);
      }
    } catch (error) {
      console.error("Error communicating with the API:", error);
    } finally {
      this.isMasked = true;
      this.loader.markDelete = true;
      this.loader.isVisible = false;
    }

  }
  
  async requestMaskedImage(img_file) {
    this.loader.isVisible = true
    
    const formData = new FormData();
    formData.append("image", img_file);

    try {
      const response = await api.fetchApi("/itools/request_mask_img", {
        method: "POST",
        body: formData,
        headers: {
          enctype: "multipart/form-data",
        },
      });

      const result = await response.json();

      if (result.status === "success") {
        this.fetchMaskedImageFromAPI();
      } else {
        console.error("Error:", result.message);
      }
    } catch (error) {
      console.error("Error fetching the drawing:", error);
    } finally {
      // this.isMasked = true;
      // this.loader.markDelete = true;
      // this.loader.isVisible = false;
    }
  }

  handleDown() {
    if(this.isUnderCover) return;
    if (this.isInCloseButtonArea()) {
      this.markDelete = true;
    }
    if (this.isMouseInResizeArea()) {
      this.isResizing = true;
      this.resizeAnchor = this.getResizeAnchor();
    } else if (this.isMouseInRotatedArea()) {
      this.handleRotateStart();
    } else if (this.isMouseIn(-20) && this.isSelected && !this.isUnderCover) {
      this.isPicked = true;
      this.pickOffset = {
        x: this.mousePos.x - this.x,
        y: this.mousePos.y - this.y,
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
      this.x = Math.max(canvasX, Math.min(newX, canvasX + width));
      this.y = Math.max(canvasY, Math.min(newY, canvasY + height));

      // this.closeButton.x = this.x + this.buttonXoffset;
      // this.closeButton.y = this.y + this.buttonYoffset;
    }

    if(this.loader){
      this.loader.x = this.x + this.width / 2
      this.loader.y = this.y + this.height / 2
    }
  }

  handleClick() {
    this.isPicked = false;
    this.isResizing = false;
    this.resizeAnchor = null;
    this.handleRotateEnd();
  }

  handleDrag() {
    if(this.isUnderCover) return;
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
      x >= this.x - safeZone &&
      x <= this.x + this.width + safeZone &&
      y >= this.y - safeZone &&
      y <= this.y + this.height + safeZone
    );
  }

  isMouseInResizeArea() {
    const { x: mouseX, y: mouseY } = this.mousePos;
    const threshold = this.resizeThreshold;

    // Translate mouse position relative to the center of the image
    const dx = mouseX - (this.x + this.width / 2);
    const dy = mouseY - (this.y + this.height / 2);

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
    const threshold = this.resizeThreshold;
    const margin = this.rotateDrawMargin - 5; // Move the detection area slightly inside the image

    // Translate mouse position relative to the center of the image
    const dx = mouseX - (this.x + this.width / 2);
    const dy = mouseY - (this.y + this.height / 2);

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

  isInCloseButtonArea() {
    const { x, y } = this.mousePos;
    return (
      x >= this.x + this.closeButtonOffsetX &&
      x <= this.x + this.closeButtonWidth + this.closeButtonOffsetX &&
      y >= this.y + this.closeButtonOffsetY &&
      y <= this.y + this.closeButtonOffsetY + this.closeButtonHeight
    );
  }

  getResizeAnchor() {
    const { x: mouseX, y: mouseY } = this.mousePos;
    const threshold = this.resizeThreshold;

    // Translate mouse position relative to the center of the image
    const dx = mouseX - (this.x + this.width / 2);
    const dy = mouseY - (this.y + this.height / 2);

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
        const newWidth = this.x + this.width - x;
        const newHeight = this.y + this.height - y;
        this.x = Math.max(canvasX, x); // Ensure x stays within canvas
        this.y = Math.max(canvasY, y); // Ensure y stays within canvas
        this.width = Math.max(10, Math.min(newWidth, maxWidth - this.x));
        this.height = Math.max(10, Math.min(newHeight, maxHeight - this.y));
        break;
      }
      case "top-right": {
        const newHeight = this.y + this.height - y;
        this.y = Math.max(canvasY, y); // Ensure y stays within canvas
        this.width = Math.max(10, Math.min(x - this.x, maxWidth - this.x));
        this.height = Math.max(10, Math.min(newHeight, maxHeight - this.y));
        break;
      }
      case "bottom-left": {
        const newWidth = this.x + this.width - x;
        this.x = Math.max(canvasX, x); // Ensure x stays within canvas
        this.width = Math.max(10, Math.min(newWidth, maxWidth - this.x));
        this.height = Math.max(10, Math.min(y - this.y, maxHeight - this.y));
        break;
      }
      case "bottom-right": {
        this.width = Math.max(10, Math.min(x - this.x, maxWidth - this.x));
        this.height = Math.max(10, Math.min(y - this.y, maxHeight - this.y));
        break;
      }
      case "top": {
        const newHeight = this.y + this.height - y;
        this.y = Math.max(canvasY, y); // Ensure y stays within canvas
        this.height = Math.max(10, Math.min(newHeight, maxHeight - this.y));
        break;
      }
      case "bottom": {
        this.height = Math.max(10, Math.min(y - this.y, maxHeight - this.y));
        break;
      }
      case "left": {
        const newWidth = this.x + this.width - x;
        this.x = Math.max(canvasX, x); // Ensure x stays within canvas
        this.width = Math.max(10, Math.min(newWidth, maxWidth - this.x));
        break;
      }
      case "right": {
        this.width = Math.max(10, Math.min(x - this.x, maxWidth - this.x));
        break;
      }
      default:
        break;
    }
  }

  fillImage(pa, scale, offsetY = 80) {
    this.width = Math.min(pa[0] / scale, 512);
    this.height = Math.min(pa[1] / scale, 512);
    // Center the image in the available space
    this.x = (512 - this.width) / 2;
    this.y = (512 - this.height) / 2 + offsetY;
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
    this.x = (512 - this.width) / 2;
    this.y = (512 - this.height) / 2 + offsetY;
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

    const { x, y, width, height, rotationAngle } = this;

    // Save the context state before transformations
    ctx.save();

    // Calculate the scaled dimensions and offsets
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const scaledX = (x - xOffset) * scale;
    const scaledY = (y - yOffset) * scale;

    // Translate to the center of the scaled image
    ctx.translate(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2);

    // Rotate the context
    ctx.rotate((rotationAngle * Math.PI) / 180);

    // Translate back to the top-left corner of the scaled image
    ctx.translate(-scaledWidth / 2, -scaledHeight / 2);

    // Draw the image or placeholder
    if (this.imgLoaded) {
      ctx.drawImage(this.img, 0, 0, scaledWidth, scaledHeight);
    } else {
      ctx.fillStyle = this.placeholderColor;
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    }

    // Restore the context state
    ctx.restore();

    // plot preview
    this.isPlotted = true;
    setTimeout(() => {
      this.isPlotted = false;
    }, 200);
  }

  createCloseButton() {
    // if (this.closeButton === null) {
    //   this.closeButton = new SmartButton(
    //     this.x + this.buttonXoffset,
    //     this.y + this.buttonYoffset,
    //     15,
    //     15,
    //     this.node,
    //     "X",
    //     {
    //       color: "rgba(255, 255, 255, 0.5)",
    //       textColor: "#434343",
    //     }
    //   );
    //   this.closeButton.onClick = () => {
    //     //this.img = null;
    //     this.closeButton.markDelete = true;
    //     this.markDelete = true;
    //   };
    // }
  }

  draw(ctx) {
    if (this.markDelete) return;

    // Save the context state before transformations
    ctx.save();

    this.rotationCenter = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    // Translate to the center of the image
    ctx.translate(this.rotationCenter.x, this.rotationCenter.y);
    //ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // Rotate the context
    ctx.rotate((this.rotationAngle * Math.PI) / 180);

    // Translate back to the top-left corner of the image
    ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
    // rotation

    // Draw the image or placeholder
    if (!this.imgLoaded) {
      ctx.fillStyle = this.placeholderColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    // Draw resize handles (small outlined squares) at the edges and corners
    if (this.isSelected) {
      // Draw a dashed outline around the image
      ctx.strokeStyle = "#333"; // Color of the dashed outline
      ctx.lineWidth = 1.5; // Width of the dashed outline
      ctx.setLineDash([5, 5]); // Dash pattern: 5px dash, 5px gap
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      const handleSize = 10; // Size of the resize handle (width and height)
      ctx.strokeStyle = "#333"; // Color of the resize handles
      ctx.lineWidth = 1.5; // Width of the resize handle outline
      ctx.setLineDash([]); // Reset dash pattern for solid lines

      // Draw handles at the corners
      ctx.strokeRect(this.x - handleSize / 2, this.y - handleSize / 2, handleSize, handleSize); // Top-left
      ctx.strokeRect(this.x + this.width - handleSize / 2, this.y - handleSize / 2, handleSize, handleSize); // Top-right
      ctx.strokeRect(this.x - handleSize / 2, this.y + this.height - handleSize / 2, handleSize, handleSize); // Bottom-left
      ctx.strokeRect(
        this.x + this.width - handleSize / 2,
        this.y + this.height - handleSize / 2,
        handleSize,
        handleSize
      ); // Bottom-right

      // Draw handles at the midpoints of the edges
      ctx.strokeRect(this.x + this.width / 2 - handleSize / 2, this.y - handleSize / 2, handleSize, handleSize); // Top
      ctx.strokeRect(
        this.x + this.width / 2 - handleSize / 2,
        this.y + this.height - handleSize / 2,
        handleSize,
        handleSize
      ); // Bottom
      ctx.strokeRect(this.x - handleSize / 2, this.y + this.height / 2 - handleSize / 2, handleSize, handleSize); // Left
      ctx.strokeRect(
        this.x + this.width - handleSize / 2,
        this.y + this.height / 2 - handleSize / 2,
        handleSize,
        handleSize
      ); // Right
    }

    // draw rotate dots
    if ((this.isMouseInRotatedArea() && this.isSelected) || this.isRotating) {
      const handleSize = 10; // Diameter of the handle
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
      drawHandle(this.x + margin, this.y + margin); // Top-left
      drawHandle(this.x + this.width - margin, this.y + margin); // Top-right
      drawHandle(this.x + margin, this.y + this.height - margin); // Bottom-left
      drawHandle(this.x + this.width - margin, this.y + this.height - margin); // Bottom-right
    }

    // Draw visual plot
    if (this.isPlotted) {
      ctx.fillStyle = "rgba(255,0, 0, 0.1)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Draw close button
    if (this.closeButton) {
      const radius = 2.5;

      ctx.beginPath();
      ctx.moveTo(this.x + this.closeButtonOffsetX + radius, this.y + this.closeButtonOffsetY);
      ctx.lineTo(this.x + this.closeButtonOffsetX + this.closeButtonWidth - radius, this.y + this.closeButtonOffsetY);
      ctx.arcTo(
        this.x + this.closeButtonOffsetX + this.closeButtonWidth,
        this.y + this.closeButtonOffsetY,
        this.x + this.closeButtonOffsetX + this.closeButtonWidth,
        this.y + this.closeButtonOffsetY + radius,
        radius
      );
      ctx.lineTo(
        this.x + this.closeButtonOffsetX + this.closeButtonWidth,
        this.y + this.closeButtonOffsetY + this.closeButtonHeight - radius
      );
      ctx.arcTo(
        this.x + this.closeButtonOffsetX + this.closeButtonWidth,
        this.y + this.closeButtonOffsetY + this.closeButtonHeight,
        this.x + this.closeButtonOffsetX + this.closeButtonWidth - radius,
        this.y + this.closeButtonOffsetY + this.closeButtonHeight,
        radius
      );
      ctx.lineTo(this.x + this.closeButtonOffsetX + radius, this.y + this.closeButtonOffsetY + this.closeButtonHeight);
      ctx.arcTo(
        this.x + this.closeButtonOffsetX,
        this.y + this.closeButtonOffsetY + this.closeButtonHeight,
        this.x + this.closeButtonOffsetX,
        this.y + this.closeButtonOffsetY + this.closeButtonHeight - radius,
        radius
      );
      ctx.lineTo(this.x + this.closeButtonOffsetX, this.y + this.closeButtonOffsetY + radius);
      ctx.arcTo(
        this.x + this.closeButtonOffsetX,
        this.y + this.closeButtonOffsetY,
        this.x + this.closeButtonOffsetX + radius,
        this.y + this.closeButtonOffsetY,
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
          this.x + this.closeButtonOffsetX + this.closeButtonWidth / 2 + 0,
          this.y + this.closeButtonOffsetY + this.closeButtonHeight / 2 + 0
        );
      }
    }

    // Draw loader
    if(!this.loader){
      this.loader = new SmartLoading(this.x + this.width/2, this.y+this.height/2, this.node);
    }

    ctx.restore();
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
    this.resetColor = true;
    this.onClick = null;
    this.onPress = null;
    this.onHover = null;

    this.isActive = false;
    this.isVisible = true;
    // New properties for half-circle shapes
    this.sliceOffset = 0; // Offset for the sliced edge (default: no offset)

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
    // Draw half-horizontal circle
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;

    // Draw rounded rectangle //HAS NO DETECT YET
    if (this.shape === Shapes.ROUND) {
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.width - radius, this.y);
      ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + radius, radius);
      ctx.lineTo(this.x + this.width, this.y + this.height - radius);
      ctx.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height, radius);
      ctx.lineTo(this.x + radius, this.y + this.height);
      ctx.arcTo(this.x, this.y + this.height, this.x, this.y + this.height - radius, radius);
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

    // Draw circle
    else if (this.shape === Shapes.CIRCLE) {
      ctx.beginPath();
      ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw left round
    else if (this.shape === Shapes.ROUND_L) {
      // Rounded on the left side only
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y); // Start at the top-left corner, slightly inside
      ctx.arcTo(this.x, this.y, this.x, this.y + radius, radius); // Round the top-left corner
      ctx.lineTo(this.x, this.y + this.height - radius); // Go down the left edge
      ctx.arcTo(this.x, this.y + this.height, this.x + radius, this.y + this.height, radius); // Round the bottom-left corner
      ctx.lineTo(this.x + this.width, this.y + this.height); // Go across the bottom edge
      ctx.lineTo(this.x + this.width, this.y); // Go up the right edge
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw right round
    else if (this.shape === Shapes.ROUND_R) {
      // Rounded on the right side only
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.x, this.y); // Start at the top-left corner
      ctx.lineTo(this.x + this.width - radius, this.y); // Go across the top edge
      ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + radius, radius); // Round the top-right corner
      ctx.lineTo(this.x + this.width, this.y + this.height - radius); // Go down the right edge
      ctx.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height, radius); // Round the bottom-right corner
      ctx.lineTo(this.x, this.y + this.height); // Go across the bottom edge
      ctx.lineTo(this.x, this.y); // Go up the left edge
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-horizontal left circle
    else if (this.shape === Shapes.HHL_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, Math.PI, 0, false);
      ctx.lineTo(centerX - this.sliceOffset, centerY);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-horizontal right circle
    else if (this.shape === Shapes.HHR_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, 0, Math.PI, false);
      ctx.lineTo(centerX + this.sliceOffset, centerY);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-vertical left circle
    else if (this.shape === Shapes.HVL_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.lineTo(centerX, centerY - this.sliceOffset);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw half-vertical right circle
    else if (this.shape === Shapes.HVR_CIRCLE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.radius, Math.PI * 1.5, Math.PI * 0.5, false);
      ctx.lineTo(centerX, centerY + this.sliceOffset);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw rectangle
    else if (this.shape === Shapes.SQUARE) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    }

    // Draw triangle
    else if (this.shape === Shapes.TRIANGLE) {
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
    else if (this.shape === Shapes.STAR) {
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
    else if (this.shape === Shapes.ELLIPSE) {
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
    if (!this.isVisible) return false;
    const { x, y } = this.mousePos;

    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;

    if (
      this.shape === Shapes.SQUARE ||
      this.shape === Shapes.ROUND ||
      this.shape === Shapes.ROUND_L ||
      this.shape === Shapes.ROUND_R ||
      this.shape === Shapes.ELLIPSE
    ) {
      return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    } else if (this.shape === Shapes.CIRCLE) {
      const distance = Math.sqrt((x - (this.x + this.radius)) ** 2 + (y - (this.y + this.radius)) ** 2);
      return distance <= this.radius;
    } else if (this.shape === Shapes.HVL_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && x <= centerX;
    } else if (this.shape === Shapes.HVR_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && x >= centerX;
    } else if (this.shape === Shapes.HHL_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && y <= centerY;
    } else if (this.shape === Shapes.HHR_CIRCLE) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= this.radius && y >= centerY;
    }

    return false;
  }

  toggleActive() {
    this.color === "#80a1c0" ? (this.color = this.originalColor) : (this.color = "#80a1c0");
    this.textColor === "black" ? (this.textColor = this.originalTextColor) : (this.textColor = "black");
    this.isActive = !this.isActive;
  }

  visualClick() {
    const originalPosX = this.x;
    const originalPosY = this.y;
    setTimeout(() => {
      if (!this.allowVisualHover && this.resetColor) this.color = this.originalColor;
      this.x = originalPosX;
      this.y = originalPosY;
    }, 100);
    if (!this.allowVisualHover  && this.resetColor) this.color = lightenColor(this.originalColor, 20);
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
    if (!this.isActive) this.color = this.originalColor;
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

export class SmartInfo extends BaseSmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.originalWidth = width;
    this.originalHeight = height;
    this.originalY = y;

    this.radius = width / 2;
    this._shape = Shapes.ROUND;

    this.color = LiteGraph.WIDGET_BGCOLOR || "crimson";

    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = 0.8;

    this.text = text;
    this.textWidth = null;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.7;
    this.textXoffset = 0.0;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";

    this.previewDuration = 2000;
    this.done = true;

    // Apply options if provided
    Object.assign(this, options);
    this.originalColor = this.color; // Store original color
    this.originalTextColor = this.textColor;

    // add self to the node
    node.addCustomWidget(this);

    this.autoStart = false;
    if (this.autoStart) {
      this.start();
    }
  }

  handleDown() {}

  handleClick() {}

  handleMove() {}

  start() {
    this.done = false;
    setTimeout(() => {
      this.done = true;
      this.width = this.originalWidth;
      this.height = this.originalHeight;
      this.y = this.originalY;
    }, this.previewDuration);
  }

  restart(newText, newWidth = null, newY = null, newHeight = null, newDuration = 2000) {
    if (newWidth) {
      this.width = newWidth;
      this.x = 512 / 2 - newWidth / 2; // recenter info
    }
    if (newHeight) this.height = newHeight;
    if (newY) this.y = newY;

    this.text = newText;
    this.previewDuration = newDuration;

    this.start();
  }

  draw(ctx) {
    if (this.done) return;

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
      ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline if enabled
      if (this.outline) {
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineWidth;
        ctx.stroke();
      }
    }

    // Draw rounded rectangle
    if (this.shape === Shapes.ROUND) {
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.width - radius, this.y);
      ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + radius, radius);
      ctx.lineTo(this.x + this.width, this.y + this.height - radius);
      ctx.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height, radius);
      ctx.lineTo(this.x + radius, this.y + this.height);
      ctx.arcTo(this.x, this.y + this.height, this.x, this.y + this.height - radius, radius);
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

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, this.x + this.width / 2 + this.textXoffset, this.y + this.height / 2 + this.textYoffset);
    }
  }

  isMouseIn() {
    const { x, y } = this.mousePos;
    if (this.shape === Shapes.SQUARE || this.shape === Shapes.ROUND || this.shape === Shapes.ELLIPSE) {
      return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    } else if (this.shape === Shapes.CIRCLE || this.shape === Shapes.STAR) {
      const distance = Math.sqrt((x - (this.x + this.radius)) ** 2 + (y - (this.y + this.radius)) ** 2);
      return distance <= this.radius;
    }

    return false;
  }

  getTextWidth(ctx) {
    ctx.font = this.font;
    return ctx.measureText(this.text).width;
  }

  updateText(newText) {
    this.text = newText;
  }

  set shape(value) {
    this._shape = value;
    if (value === Shapes.CIRCLE) this.height = this.width;
  }

  get shape() {
    return this._shape;
  }
}

export class SmartLoading extends BaseSmartWidget {
  constructor(x, y, node) {
    super(node);
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.angle = 0;
    this.color = "#cd7f32";
    this.lineWidth = 8;
    this.allowInnerCircle = true;
    this.innerCircleColor = "rgba(255, 255, 255, 0.5)";
    this.isVisible = false;

    // this.maxTime = 20000

    // setTimeout(() => {
    //   this.isVisible = false
    // }, this.maxTime);

    // add self to the node
    node.addCustomWidget(this);
  }
  handleMove() {
    this.angle += 0.1;
  }

  draw(ctx) {
    if (!this.isVisible) return;
    if (!this.ctx) this.ctx = ctx;
    //Draw circle
    if (this.allowInnerCircle) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.innerCircleColor;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, this.angle, this.angle + Math.PI / 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
    this.node.setDirtyCanvas(true, true);
  }
}

export class SmartLabel extends BaseSmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.text = text;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.0;
    this.textXoffset = 0.0;
    this.textAlign = "left";
    this.textBaseline = "top";
    this.font = "14px Arial Bold";
    this.textWidth = null;
    this.isVisible = true;
    // Apply options if provided
    Object.assign(this, options);

    // add self to the node
    node.addCustomWidget(this);
  }
  draw(ctx) {
    if (!this.isVisible) return;
    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, this.x + this.textXoffset, this.y + this.textYoffset);
      if (this.textWidth === null) {
        const textMetrics = ctx.measureText(this.text);
        this.textWidth = textMetrics.width;
      }
    }
  }
  updateText(newText) {
    this.text = newText;
  }
}

export class SmartButton extends SmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(x, y, width, height, node, options);

    this.isVisible = true;

    this.text = text;
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textYoffset = 0.9;
    this.textXoffset = 0.0;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";

    this.withTagWidth = false; // false or number
    this.tagColor = "crimson";
    this.tagPosition = "left"; // "left" or "right"
    this.tagRound = 2.5;

    this.originalTextColor = this.textColor; // Store text original color

    // Apply options if provided
    Object.assign(this, options);
  }
  draw(ctx) {
    if (!this.isVisible) return;

    super.draw(ctx);

    // Draw tag
    if (this.withTagWidth) {
      ctx.fillStyle = this.tagColor;

      ctx.beginPath();

      if (this.tagPosition === "left") {
        // Round only the left side
        ctx.roundRect(this.x + 0.5, this.y + 0.5, this.withTagWidth, this.height - 1, [
          this.tagRound,
          0,
          0,
          this.tagRound,
        ]);
      } else {
        // Round only the right side
        ctx.roundRect(this.x + this.width - this.withTagWidth - 0.5, this.y + 0.5, this.withTagWidth, this.height - 1, [
          0,
          this.tagRound,
          this.tagRound,
          0,
        ]);
      }

      ctx.fill();
    }

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, this.x + this.width / 2 + this.textXoffset, this.y + this.height / 2 + this.textYoffset);
    }
  }
}

export class SmartSlider extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    // Slider specific properties
    this.minValue = 5;
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
    this.textColorNormalize = false;

    // Calculate handle position based on initial value
    this.handleX =
      this.x + ((this.value - this.minValue) / (this.maxValue - this.minValue)) * (this.width - this.handleWidth);
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
      this.handleX = Math.max(this.x, Math.min(x - this.handleWidth / 2, this.x + this.width - this.handleWidth));
      this.value =
        this.minValue + ((this.handleX - this.x) / (this.width - this.handleWidth)) * (this.maxValue - this.minValue);

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
      this.x + ((this.value - this.minValue) / (this.maxValue - this.minValue)) * (this.width - this.handleWidth);

    // Draw the progress
    if (this.isProgressBar) {
      const progressWidth = ((this.value - this.minValue) / (this.maxValue - this.minValue)) * this.width;
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
    if (this.disableText) return;

    if (!this.textColorNormalize) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(
        `${this.text}${this.value.toFixed(2)}`,
        this.x + this.width / 2,
        this.y + this.height / 2 + this.textYoffset
      );
      return;
    }

    // Define shiftMin and shiftMax to control the range
    const shiftMin = this.minValue + 0.35 * (this.maxValue - this.minValue); // Example shift
    const shiftMax = this.maxValue - 0.0 * (this.maxValue - this.minValue);

    // Clamp value within shiftMin and shiftMax
    const clampedValue = Math.max(shiftMin, Math.min(this.value, shiftMax));

    // Normalize within shifted range
    const normalizedValue = (clampedValue - shiftMin) / (shiftMax - shiftMin);

    // Compute color intensity (closer to black as value increases)
    const colorIntensity = Math.round(160 * (1 - normalizedValue));

    // Set text color
    ctx.fillStyle = `rgb(${colorIntensity}, ${colorIntensity}, ${colorIntensity})`;

    // Draw text
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

export class SmartSwitch extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    this.isOn = true;
    this.handleWidth = this.width / 2;
    this.handleHeight = this.height;
    this.handleColor = "#80a1c0";
    this.trackColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.trackHeight = this.height / 4;
    this.onValueChange = null;

    this.textOn = "On";
    this.textOff = "Off";
    this.textOnColor = this.isOn ? "black" : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textOffColor = this.isOn ? LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white" : "black";
    this.textYoffset = 0.8;
    this.textXoffset = 0.0;
    this.textAlign = "center";
    this.textBaseline = "middle";
    this.font = "14px Arial Bold";

    //Apply options if provided
    Object.assign(this, options);
  }

  handleDown() {
    if (this.isMouseIn()) {
      this.callClick();
 
    }
  }

  callClick() {
    this.isOn = !this.isOn;
    this.textOnColor = this.isOn ? "black" : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.textOffColor = this.isOn ? LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white" : "black";
    if (this.onValueChange) this.onValueChange(this.isOn);
  }

  handleMove() {}

  handleClick() {}

  isMouseInHandle() {
    const { x, y } = this.mousePos;
    return (
      x >= this.handleX &&
      x <= this.handleX + this.handleWidth &&
      y >= this.handleY &&
      y <= this.handleY + this.handleHeight
    );
  }

  draw(ctx) {
    super.draw(ctx);
    const trackY = this.y + (this.handleHeight - this.height) / 2;

    // Draw the track
    ctx.fillStyle = this.trackColor;
    ctx.beginPath();
    ctx.roundRect(this.x, trackY, this.width, this.height, 5);
    ctx.fill();

    // Calculate handle position correctly
    const handleX = this.isOn ? this.x : this.x + this.width / 2;

    // Draw the handle
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(handleX, this.y, this.handleWidth, this.handleHeight, 5);
    ctx.fill();

    // Draw text on
    ctx.fillStyle = this.textOnColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(this.textOn, this.x + this.width / 4, this.y + this.height / 2 + this.textYoffset);

    // Draw text off
    ctx.fillStyle = this.textOffColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(this.textOff, this.x + this.width / 2 + this.width / 4, this.y + this.height / 2 + this.textYoffset);
  }
}

export class SmartCheckBox extends SmartWidget {
  constructor(x, y, width, height, node, options = {}) {
    super(x, y, width, height, node, options);

    this.isChecked = true;
    this.gap = 4;
    // this.handleWidth = this.width - this.gap;
    // this.handleHeight = this.height - this.gap;
    this.handleColor = "#80a1c0";
    this.bgColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.bgHeight = this.height;
    this.onValueChange = null;

    //Apply options if provided
    Object.assign(this, options);
  }

  handleDown() {
    if (this.isMouseIn()) {
      this.isChecked = !this.isChecked;
    }
  }

  handleMove() {}

  handleClick() {
    if (this.onValueChange) this.onValueChange();
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

  draw(ctx) {
    // Draw the background
    ctx.fillStyle = this.trackColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    // Draw the handle
    if (!this.isChecked) return;
    ctx.fillStyle = this.handleColor;
    ctx.beginPath();
    ctx.roundRect(
      this.x + this.gap / 2,
      this.y + this.gap / 2,
      this.width - this.gap,
      this.height - this.gap,
      5 - this.gap / 2
    );
    ctx.fill();
  }
}

export class SmartPaintArea extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.yOffset = 0;
    this.xOffset = 0;

    this.nodeYoffset = 80;
    this.nodeXoffset = 0;

    this.brushSize = 10;
    this.brushColor = "crimson";
    this.isPainting = false;
    this.blockPainting = false;
    this.isPaintingBackground = false; // Layer switch
    this.isCheckerboardOn = false;

    this.ctx = null;
    // Foreground Layer
    this.foregroundCanvas = document.createElement("canvas");
    this.foregroundCanvas.width = this.width;
    this.foregroundCanvas.height = this.height;
    this.foregroundCtx = this.foregroundCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    // Background Layer
    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundCanvas.width = this.width;
    this.backgroundCanvas.height = this.height;
    this.backgroundCtx = this.backgroundCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.backgroundCtx.fillStyle = "white";
    this.backgroundCtx.fillRect(0, 0, this.width, this.height);

    this.onClick = null;
    this.onPress = null;
    this.onUpdate = null;
    this.onReInit = null;

    this.scaleFactor = 1.0;

    // Initialize undo and redo stacks
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = 20; // Limit undo steps to 20

    // Load saved drawing after initialization
    this.getDrawingFromAPI();

    node.addCustomWidget(this);
  }

  draw(ctx) {
    if (this.ctx === null) this.ctx = ctx;
    const { x, y } = this.mousePos;

    if (this.isPainting && !this.blockPainting) {
      const activeCtx = this.isPaintingBackground ? this.backgroundCtx : this.foregroundCtx;

      // Scale the brush size and adjust drawing coordinates
      activeCtx.lineWidth = (this.brushSize * 2) / this.scaleFactor;
      activeCtx.lineCap = "round";

      // Determine the stroke style dynamically
      let strokeStyle = this.brushColor;

      if (this.brushColor === "rgba(255, 255, 255, 0.0)") {
        if (activeCtx === this.backgroundCtx) {
          strokeStyle = "white"; // Use white for backgroundCtx
          activeCtx.strokeStyle = strokeStyle;

          // Draw a line with white color
          activeCtx.lineTo(
            (x - this.x - this.xOffset) / this.scaleFactor,
            (y - this.y - this.yOffset) / this.scaleFactor
          );
          activeCtx.stroke();
          activeCtx.beginPath();
          activeCtx.moveTo(
            (x - this.x - this.xOffset) / this.scaleFactor,
            (y - this.y - this.yOffset) / this.scaleFactor
          );
        } else {
          // Clear the area in a circular shape for foregroundCtx
          activeCtx.save();
          activeCtx.beginPath();
          activeCtx.arc(
            (x - this.x - this.xOffset) / this.scaleFactor,
            (y - this.y - this.yOffset) / this.scaleFactor,
            this.brushSize / this.scaleFactor, // radius in scale
            0,
            Math.PI * 2
          );
          activeCtx.closePath();
          activeCtx.globalCompositeOperation = "destination-out";
          activeCtx.fillStyle = "black"; // Any solid color will work here
          activeCtx.fill(); // Fill the circle to erase the area
          activeCtx.restore();
        }
      } else {
        // Normal drawing logic
        activeCtx.strokeStyle = strokeStyle;
        activeCtx.lineTo(
          (x - this.x - this.xOffset) / this.scaleFactor,
          (y - this.y - this.yOffset) / this.scaleFactor
        );
        activeCtx.stroke();
        activeCtx.beginPath();
        activeCtx.moveTo(
          (x - this.x - this.xOffset) / this.scaleFactor,
          (y - this.y - this.yOffset) / this.scaleFactor
        );
      }
    } else {
      // Reset paths for both contexts
      this.foregroundCtx.beginPath();
      this.backgroundCtx.beginPath();
    }

    // Draw layers in correct order, applying the scale factor
    ctx.save();
    ctx.scale(this.scaleFactor, this.scaleFactor);

    // Ensure the background canvas is drawn first
    ctx.drawImage(this.backgroundCanvas, this.x / this.scaleFactor, this.y / this.scaleFactor);

    // Then draw the foreground canvas on top
    ctx.drawImage(this.foregroundCanvas, this.x / this.scaleFactor, this.y / this.scaleFactor);

    if (this.isCheckerboardOn) drawAngledStrips(ctx, this.width, this.height, this.scaleFactor);

    ctx.restore();
  }

  handleDown() {
    if (this.isMouseIn()) {
      if (this.onPress) this.onPress();
      // Save the current state before starting to paint
      this.commitChange();
      //this.enterFreezeMode();
      this.isPainting = true;
    }
  }

  handleClick() {
    if (this.isMouseIn()) {
      if (this.onClick) this.onClick();
      //this.exitFreezeMode();
      this.isPainting = false;
    }
  }

  handleMove() {
    //this.enterFreezeMode();
    if (this.onUpdate) this.onUpdate();
  }

  isMouseIn() {
    const { x, y } = this.mousePos;
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  setNewSize(size, scale) {
    const newX = size.width * scale;
    const newY = size.height * scale;

    // Store the original dimensions
    this.originalWidth = newX;
    this.originalHeight = newY;

    // Determine the scale factor to fit within 512x512
    const maxPreviewSize = 512;
    const scaleFactorX = Math.min(1, maxPreviewSize / newX);
    const scaleFactorY = Math.min(1, maxPreviewSize / newY);
    this.scaleFactor = Math.min(scaleFactorX, scaleFactorY);

    // Center the canvas on the x and y axis of the node
    this.x = (this.node.width - newX * this.scaleFactor) / 2;
    this.y = (this.node.height + this.nodeYoffset - newY * this.scaleFactor) / 2;

    // Update the width and height properties
    this.width = newX;
    this.height = newY;

    // Resize the foreground canvas and redraw the content
    const oldForegroundWidth = this.foregroundCanvas.width;
    const oldForegroundHeight = this.foregroundCanvas.height;

    // Create a temporary canvas to store the old content
    const tempForegroundCanvas = document.createElement("canvas");
    tempForegroundCanvas.width = oldForegroundWidth;
    tempForegroundCanvas.height = oldForegroundHeight;
    const tempForegroundCtx = tempForegroundCanvas.getContext("2d");
    tempForegroundCtx.drawImage(this.foregroundCanvas, 0, 0);

    // Resize the foreground canvas
    this.foregroundCanvas.width = newX;
    this.foregroundCanvas.height = newY;

    // Draw the old content centered on the new canvas
    if (oldForegroundWidth > 0 && oldForegroundHeight > 0) {
      const offsetX = (newX - oldForegroundWidth) / 2;
      const offsetY = (newY - oldForegroundHeight) / 2;
      this.foregroundCtx.drawImage(
        tempForegroundCanvas,
        0,
        0,
        oldForegroundWidth,
        oldForegroundHeight,
        offsetX,
        offsetY,
        oldForegroundWidth,
        oldForegroundHeight
      );
    }

    // Resize the background canvas and redraw the content
    const oldBackgroundWidth = this.backgroundCanvas.width;
    const oldBackgroundHeight = this.backgroundCanvas.height;

    // Create a temporary canvas to store the old content
    const tempBackgroundCanvas = document.createElement("canvas");
    tempBackgroundCanvas.width = oldBackgroundWidth;
    tempBackgroundCanvas.height = oldBackgroundHeight;
    const tempBackgroundCtx = tempBackgroundCanvas.getContext("2d");
    tempBackgroundCtx.drawImage(this.backgroundCanvas, 0, 0);

    // Resize the background canvas
    this.backgroundCanvas.width = newX;
    this.backgroundCanvas.height = newY;

    // Draw the old content centered on the new canvas
    if (oldBackgroundWidth > 0 && oldBackgroundHeight > 0) {
      const offsetX = (newX - oldBackgroundWidth) / 2;
      const offsetY = (newY - oldBackgroundHeight) / 2;
      this.backgroundCtx.drawImage(
        tempBackgroundCanvas,
        0,
        0,
        oldBackgroundWidth,
        oldBackgroundHeight,
        offsetX,
        offsetY,
        oldBackgroundWidth,
        oldBackgroundHeight
      );
    }

    // Redraw the background with the default color only on transparent parts
    const backgroundData = this.backgroundCtx.getImageData(0, 0, newX, newY);
    const data = backgroundData.data;

    for (let i = 0; i < data.length; i += 4) {
      // If the alpha channel (data[i + 3]) is less than fully opaque (255), set it to white
      if (data[i + 3] < 255) {
        data[i] = 255; // Red channel
        data[i + 1] = 255; // Green channel
        data[i + 2] = 255; // Blue channel
        data[i + 3] = 255; // Alpha channel (fully opaque)
      }
    }

    this.backgroundCtx.putImageData(backgroundData, 0, 0);
    // if (allow_debug) {
    //   console.log("scaleFactor", this.scaleFactor);
    //   console.log("pa.width, pa.height", this.width, this.height);
    // }
  }

  switchLayer() {
    this.isPaintingBackground = !this.isPaintingBackground;
  }

  clearWithColor(color) {
    if (this.isPaintingBackground) {
      // Fill the background with the color
      this.backgroundCtx.fillStyle = color;
      this.backgroundCtx.fillRect(0, 0, this.width, this.height);
    } else {
      // // Fill the background with the color
      // this.backgroundCtx.fillStyle = color;
      // this.backgroundCtx.fillRect(0, 0, this.width, this.height);
      // Reinitialize foreground to be transparent
      this.foregroundCtx.clearRect(0, 0, this.width, this.height);
    }
  }

  fillWithColor(color) {
    if (this.isPaintingBackground) {
      // Fill the background with the color
      this.backgroundCtx.fillStyle = color;
      this.backgroundCtx.fillRect(0, 0, this.width, this.height);
    } else {
      this.foregroundCtx.fillStyle = color;
      this.foregroundCtx.fillRect(0, 0, this.width, this.height);
    }
  }

  saveTempImage() {
    this.tempForeground = this.foregroundCanvas.toDataURL();
    this.tempBackground = this.backgroundCanvas.toDataURL();
  }

  loadTempImage() {
    if (this.tempForeground) {
      let fgImg = new Image();
      fgImg.src = this.tempForeground;
      fgImg.onload = () => {
        this.foregroundCtx.clearRect(0, 0, this.width, this.height);
        this.foregroundCtx.drawImage(fgImg, 0, 0);
      };
    }

    if (this.tempBackground) {
      let bgImg = new Image();
      bgImg.src = this.tempBackground;
      bgImg.onload = () => {
        this.backgroundCtx.clearRect(0, 0, this.width, this.height);
        this.backgroundCtx.drawImage(bgImg, 0, 0);
      };
    }
  }

  /* post structure
  {
  "status": "success",
  "data": {
    "foreground": "base64_encoded_string_of_foreground_image",
    "background": "base64_encoded_string_of_background_image"
    }
  }
  */

  // send foreground/background images to be saved by python
  async sendDrawingToAPI() {
    const filenamePrefix = "iToolsPaintedImage";

    // Convert both foreground and background canvases to data URLs
    const foregroundDataURL = this.foregroundCanvas.toDataURL("image/png");
    const backgroundDataURL = this.backgroundCanvas.toDataURL("image/png");

    // Check if the current data is the same as the last saved data
    if (this.lastForegroundData === foregroundDataURL && this.lastBackgroundData === backgroundDataURL) {
      if (allow_debug) console.log("No changes detected; skipping save.");
      return; // Exit early if no changes
    }

    // Update the last saved data references
    this.lastForegroundData = foregroundDataURL;
    this.lastBackgroundData = backgroundDataURL;

    // Convert data URLs to Blobs
    const foregroundBlob = await fetch(foregroundDataURL).then((res) => res.blob());
    const backgroundBlob = await fetch(backgroundDataURL).then((res) => res.blob());

    // Create a FormData object to send both files
    const formData = new FormData();
    formData.append("foreground", foregroundBlob, `${filenamePrefix}_foreground.png`);
    formData.append("background", backgroundBlob, `${filenamePrefix}_background.png`);

    try {
      // Send the file to the API endpoint
      const response = await api.fetchApi("/itools/request_save_paint", {
        method: "POST",
        body: formData,
      });
      if (allow_debug) console.log("Drawing sent successfully.");
    } catch (error) {
      console.error("Error sending the drawing:", error);
    }
  }
  //get foreground/background images from python
  async getDrawingFromAPI() {
    const filenamePrefix = "iToolsPaintedImage";

    const formData = new FormData();
    formData.append("filename_prefix", filenamePrefix);

    try {
      const response = await api.fetchApi("/itools/request_the_paint_file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "success") {
        const { foreground, background } = result.data;

        // Helper function to convert hex to base64
        function hexToBase64(hexString) {
          if (!hexString || typeof hexString !== "string") {
            console.error("Invalid hexadecimal string provided.");
            return "";
          }
          const chunkSize = 1024 * 1024; // Process in chunks of 1MB
          let base64 = "";
          for (let i = 0; i < hexString.length; i += chunkSize * 2) {
            const chunk = hexString.slice(i, i + chunkSize * 2);
            let binaryString = "";
            for (let c = 0; c < chunk.length; c += 2) {
              const byte = parseInt(chunk.substr(c, 2), 16);
              binaryString += String.fromCharCode(byte);
            }
            base64 += btoa(binaryString);
          }
          return base64;
        }

        // Load the foreground image
        const fgImg = new Image();
        fgImg.src = `data:image/png;base64,${hexToBase64(foreground)}`;
        fgImg.onload = () => {
          // calc scale
          const longSide = Math.max(fgImg.height, fgImg.width);
          let scale = 1;
          if (longSide <= 512) {
            scale = 1;
          } else if (longSide <= 1024) {
            scale = 2;
          } else if (longSide <= 2048) {
            scale = 4;
          }

          this.setNewSize({ width: fgImg.width / scale, height: fgImg.height / scale }, scale);

          if (this.onReInit) this.onReInit();

          this.foregroundCtx.clearRect(0, 0, this.width, this.height);
          // Center the foreground image
          const fgX = (this.width - fgImg.width) / 2;
          const fgY = (this.height - fgImg.height) / 2;
          this.foregroundCtx.drawImage(fgImg, fgX, fgY);
        };

        // Load the background image
        const bgImg = new Image();
        bgImg.src = `data:image/png;base64,${hexToBase64(background)}`;
        bgImg.onload = () => {
          this.backgroundCtx.clearRect(0, 0, this.width, this.height);
          if (allow_debug) {
            console.log("Old Image Loaded");
          }
          // Center the background image
          const bgX = (this.width - bgImg.width) / 2;
          const bgY = (this.height - bgImg.height) / 2;
          this.backgroundCtx.drawImage(bgImg, bgX, bgY);
        };
        if (allow_debug) console.log("Drawing received successfully.");
      } else {
        console.error("Error:", result.message);
      }
    } catch (error) {
      console.error("Error fetching the drawing:", error);
    }
  }

  // Check if both images are loaded
  checkImagesLoaded() {
    if (this.isForegroundLoaded && this.isBackgroundLoaded) {
      this.lastImageLoaded = true; // Mark as fully loaded
      if (allow_debug) console.log("All images loaded successfully.");
    }
  }

  //DEPRECATED
  async sendDrawingToAPI_Single() {
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
      //if (allow_debug) console.log(response.json());
      if (allow_debug) console.log("Drawing sent successfully.");
    } catch (error) {
      console.error("Error sending the drawing:", error);
    }
  }
  // DEPRECATED
  async getDrawingFromAPI_Single() {
    const filename = "iToolsPaintedImage.png";

    const formData = new FormData();
    formData.append("filename", filename);
    try {
      const response = await api.fetchApi("/itools/request_the_paint_file", {
        method: "POST",
        body: formData,
      });

      // if (allow_debug) console.log("response", response);

      // Ensure the response is properly parsed as JSON
      const result = await response.json();

      // Check if the response is successful
      if (result.status === "success") {
        this.loadedImage = hexDataToImage(result["data"]);
      } else {
        console.error("Error:", result.message);
      }
    } catch (error) {
      console.error("iTools No Temp Drawing Found", error);
    }
  }

  // Save the current state of the canvases to the undo stack
  saveState() {
    if (this.undoStack.length >= this.maxUndoSteps) {
      // Remove the oldest state if the stack exceeds the limit
      this.undoStack.shift();
    }
    // Save the current state to the undo stack
    this.undoStack.push({
      foreground: this.foregroundCanvas.toDataURL(),
      background: this.backgroundCanvas.toDataURL(),
    });
    // Clear the redo stack when a new state is saved
    this.redoStack = [];
  }

  // Load a saved state from the undo stack
  loadState(state) {
    if (state.foreground) {
      let fgImg = new Image();
      fgImg.src = state.foreground;
      fgImg.onload = () => {
        this.foregroundCtx.clearRect(0, 0, this.width, this.height);
        this.foregroundCtx.drawImage(fgImg, 0, 0);
      };
    }
    if (state.background) {
      let bgImg = new Image();
      bgImg.src = state.background;
      bgImg.onload = () => {
        this.backgroundCtx.clearRect(0, 0, this.width, this.height);
        this.backgroundCtx.drawImage(bgImg, 0, 0);
      };
    }
  }

  // Undo the last action
  undo() {
    if (this.undoStack.length > 0) {
      // Push the current state to the redo stack
      this.redoStack.push({
        foreground: this.foregroundCanvas.toDataURL(),
        background: this.backgroundCanvas.toDataURL(),
      });

      // Pop the last state from the undo stack and apply it
      const lastState = this.undoStack.pop();
      this.loadState(lastState);
    }
  }

  // Redo the last undone action
  redo() {
    if (this.redoStack.length > 0) {
      // Pop the last state from the redo stack and apply it
      const lastState = this.redoStack.pop();
      this.loadState(lastState);

      // Push the current state back to the undo stack
      this.undoStack.push({
        foreground: this.foregroundCanvas.toDataURL(),
        background: this.backgroundCanvas.toDataURL(),
      });
    }
  }

  // Call this function whenever a change is made to the canvas
  commitChange() {
    this.saveState();
  }
}

export class SmartPreview extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.brushSize = 10;
    this.color = "rgba(128, 128, 128, 0.2)"; // 50% transparent gray
    this.dashColor = "black";
    this.widthLimit = this.width;
    this.heightLimit = this.height;
    this.yOffset = 80;
    this.xOffset = 0;
    this.isVisible = true;
    this.allowInnerCircle = false;
    this.init();

    // add self to the node
    node.addCustomWidget(this);
  }

  updateBrushSize(size) {
    this.brushSize = size;
  }

  init() {
    //init preview canvas
    this.previewCanvas = document.createElement("canvas");
    this.previewCanvas.width = this.brushSize; //app.canvasContainer.width;
    this.previewCanvas.height = this.brushSize; //app.canvasContainer.height;
    this.previewCtx = this.previewCanvas.getContext("2d");
  }

  draw(ctx) {
    const { x, y } = this.mousePos;
    if (!this.isVisible) return;
    // if (x > this.widthLimit) return;
    // if (y > this.heightLimit) return;
    if (y < this.yOffset) return;
    if (!this.isMouseIn(x, y)) return;
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
    ctx.fillStyle = this.allowInnerCircle ? this.color : "rgba(255, 255, 255, 0)";
    ctx.fill();

    // Draw dotted outline
    ctx.setLineDash([3, 3]); // [dash length, gap length]
    ctx.strokeStyle = this.dashColor; // Outline color
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash to solid
  }
  isMouseIn(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }
  handleMove() {
    // AUTO PIN
    const safeZone = 50;
    const { x, y } = this.mousePos;
    if (y > 30 && y < this.node.height + safeZone) {
      if (x > this.node.width + safeZone || x < -safeZone) {
        this.node.flags.pinned = false;
      } else {
        this.node.flags.pinned = true;
      }
    } else {
      this.node.flags.pinned = false;
    }
  }
}

export class SmartColorPicker extends BaseSmartWidget {
  constructor(x, y, width, height, node) {
    super(node);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.ctx = null;
    this.heightDisplay = 20;
    this.selectedColor = null;
    this.isVisible = false;
    this.allowDisplayColor = true;
    this.isSelecting = false;

    // Add self to the node
    node.addCustomWidget(this);
  }

  openHidden() {
    this.isVisible = true;
    this.isGhost = true;
  }

  open() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.isSelecting = false;
    this.isGhost = false;
  }

  handleDown(e) {}

  handleMove(e) {
    if (!this.isMouseDown()) {
      this.isVisible = false;
      this.isGhost = false;
      this.isSelecting = false;
    } else {
      this.isSelecting = true;
    }
  }

  handleDrag(e) {
    // BUGGED
    //if(this.allowPickVis) app.canvas.canvas.style.cursor = "url('/cursor/colorSelect.png') 15 25, auto";
  }

  toggleShow() {
    this.isVisible = !this.isVisible;
  }

  draw(ctx) {
    const transparentColor = "rgba(0, 0, 0, 0.0)"; // 100% transparency (semi-transparent red)

    // Ensure the context is set
    if (this.ctx === null) this.ctx = ctx;
    if (!this.isVisible) return;

    // Create a horizontal gradient for hue
    const hueGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
    hueGradient.addColorStop(0, "red");
    hueGradient.addColorStop(0.17, "orange");
    hueGradient.addColorStop(0.34, "yellow");
    hueGradient.addColorStop(0.51, "green");
    hueGradient.addColorStop(0.68, "blue");
    hueGradient.addColorStop(0.85, "indigo");
    hueGradient.addColorStop(1, "violet");

    // Fill the canvas with the hue gradient
    ctx.fillStyle = this.isGhost ? transparentColor : hueGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Create a vertical gradient for brightness
    const brightnessGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    brightnessGradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // White
    brightnessGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)"); // Transparent
    brightnessGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)"); // Transparent
    brightnessGradient.addColorStop(1, "rgba(0, 0, 0, 1)"); // Black

    // Use global composite operation to blend the gradients
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = this.isGhost ? transparentColor : brightnessGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Reset the global composite operation to default
    ctx.globalCompositeOperation = "source-over";

    if (this.allowDisplayColor && !this.isGhost) this.displaySelectedColor(ctx);
  }

  setColorUnderCursor(event) {
    if (!this.isSelecting) return;
    if (!this.ctx) return;
    const rect = this.ctx.canvas.getBoundingClientRect();

    const scaleX = this.ctx.canvas.width / rect.width;
    const scaleY = this.ctx.canvas.height / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    const pixel = this.ctx.getImageData(canvasX, canvasY, 1, 1).data;
    this.selectedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  }

  displaySelectedColor(ctx) {
    // // Clear a small area below the canvas to display the selected color
    // this.ctx.clearRect(0, this.canvas.height - 30, this.canvas.width, 30); // Adjusted coordinates
    //if(!this.selectedColor) return;
    ctx.fillStyle = this.selectedColor;
    ctx.fillRect(this.x, this.y + this.height, this.width, this.heightDisplay); // Adjusted coordinates
    // // Add text to show the RGB value
    // this.ctx.fillStyle = "#000";
    // this.ctx.font = "16px Arial";
    // this.ctx.fillText(
    //   `Selected Color: ${this.selectedColor}`,
    //   10,
    //   this.canvas.height - 10
    // ); // Adjusted coordinates
  }

  isMouseIn(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }
}

export class SmartDropdownMenu extends BaseSmartWidget {
  constructor(x, y, width, height, node, title, items) {
    super(node);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.items = items;
    this.isOpen = false;
    this.selectedItemIndex = -1;
    this.title = title;
    this.isVisible = true;

    this.handleColor = "#80a1c0";
    this.bgColor = LiteGraph.WIDGET_BGCOLOR || "crimson";
    this.textColor = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR || "white";
    this.font = "14px Arial Bold";
    this.textAlign = "center";
    this.textBaseline = "middle";

    this.textYOffset = 0.8;
    this.dropMenuOffset = 6;
    this.dropMenuGap = 1;
    this.dropMenuBg = lightenColor(LiteGraph.WIDGET_BGCOLOR, 20);

    this.outline = true;
    this.outlineColor = "#434343";
    this.outlineWidth = 0.8;

    this.onSelect = null;
    node.addCustomWidget(this);
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  select(index) {
    this.selectedItemIndex = index;
    this.isOpen = false;
    if (this.onSelect) this.onSelect();
  }

  draw(ctx) {
    if (!this.isVisible) return;
    this.drawButton(ctx);
    if (this.isOpen) {
      this.drawMenu(ctx);
    }
  }

  drawButton(ctx) {
    ctx.fillStyle = this.bgColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    // Draw outline if enabled
    if (this.outline) {
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = this.outlineWidth;
      ctx.stroke();
    }

    ctx.font = this.font;
    ctx.fillStyle = this.textColor;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    const text = this.selectedItemIndex >= 0 ? this.items[this.selectedItemIndex] : this.title;
    ctx.fillText(text, this.x + this.width / 2, this.y + this.height / 2 + this.textYOffset);
  }

  drawMenu(ctx) {
    const menuHeight = this.items.length * this.height + (this.items.length - 1) * this.dropMenuGap + 2;
    const menuWidth = this.width + 2;

    ctx.fillStyle = this.dropMenuBg;
    ctx.beginPath();
    ctx.roundRect(this.x - 1, this.y - 1 + this.height + this.dropMenuOffset, menuWidth, menuHeight, 5);
    ctx.fill();

    for (let i = 0; i < this.items.length; i++) {
      const itemY = this.y + this.height * (i + 1) + this.dropMenuOffset + i * this.dropMenuGap;
      ctx.fillStyle = i === this.selectedItemIndex ? this.handleColor : this.bgColor;
      ctx.beginPath();
      ctx.roundRect(this.x, itemY, this.width, this.height, 5);
      ctx.fill();

      ctx.fillStyle = i === this.selectedItemIndex ? "black" : this.textColor;
      ctx.fillText(this.items[i], this.x + this.width / 2, itemY + this.height / 2 + this.textYOffset);
    }
  }

  handleClick(event) {
    const { x, y } = this.mousePos;
    if (this.isMouseIn()) {
      this.toggle();
    } else if (this.isOpen) {
      for (let i = 0; i < this.items.length; i++) {
        const itemY = this.y + this.height * (i + 1) + this.dropMenuOffset + i * this.dropMenuGap;
        if (y >= itemY && y <= itemY + this.height) {
          this.select(i);
          break;
        }
      }
    }
  }

  isMouseIn() {
    const { x, y } = this.mousePos;
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  isMouseInMenu() {
    const { x, y } = this.mousePos;
    if (!this.isOpen) return false; // Only check if the menu is open

    // Check if mouse is within the bounds of the menu
    const menuHeight = this.items.length * this.height + (this.items.length - 1) * this.dropMenuGap + 2;
    const menuWidth = this.width + 2;

    // Check if the mouse is inside the dropdown menu area
    if (
      x >= this.x - 1 &&
      x <= this.x - 1 + menuWidth &&
      y >= this.y - 1 + this.height + this.dropMenuOffset &&
      y <= this.y - 1 + this.height + this.dropMenuOffset + menuHeight
    ) {
      return true;
    }
    return false;
  }
}

// MANAGERS
export class CanvasButtonManager {
  // constructor(node) {
  //   //super(node)
  //   this.isVisible = false;
  //   this.buttons = [];
  //   // create canvas buttons
  //   this.bcw = 40;
  //   this.bch = 20;
  //   this.bcx = 512 / 2 - this.bcw / 2;
  //   this.bcy = 592 - 40;
  //   this.bCloseCanvas = new SmartButton(this.bcx - this.bcw * 2, this.bcy, this.bcw, this.bch, node, "Close", {
  //     textXoffset: 0,
  //     shape: Shapes.ROUND_L,
  //   });
  //   buttons.push(this.bCloseCanvas);
  //   this.bCloseCanvas.onClick = () => {
  //     if (allow_debug) {
  //       console.log("bCloseCanvas");
  //     }
  //   };
  //   // // add self to the node
  //   // node.addCustomWidget(this);
  // }
  // draw(ctx) {
  //   this.buttons.forEach((button) => {
  //     button.draw(ctx); // Assuming SmartButton has a draw method
  //   });
  // }
  // openCanvasManager() {}
  // closeCanvasManager() {}
  // showButtons() {
  //   this.buttons.forEach((b) => (b.isVisible = true));
  // }
  // hideButtons() {
  //   this.buttons.forEach((b) => (b.isVisible = false));
  // }
  // createCanvasButtons() {
  //   this.bCloseCanvas = new SmartButton(this.bcx - this.bcw * 2, this.bcy, this.bcw, this.bch, node, "Close", {
  //     textXoffset: 0,
  //     shape: Shapes.ROUND_L,
  //   });
  //   buttons.push(this.bCloseCanvas);
  //   this.bCloseCanvas.onClick = () => {
  //     if (allow_debug) {
  //       console.log("bCloseCanvas");
  //     }
  //   };
  //   this.bMaskCanvas = new SmartButton(this.bcx - this.bcw * 1, this.bcy, this.bcw, this.bch, node, "Mask", {
  //     textXoffset: 0,
  //     shape: Shapes.SQUARE,
  //   });
  //   buttons.push(this.bMaskCanvas);
  //   this.bStampCanvas = new SmartButton(this.bcx, this.bcy, this.bcw, this.bch, node, "Stamp", {
  //     textXoffset: 0,
  //     shape: Shapes.SQUARE,
  //   });
  //   buttons.push(bStampCanvas);
  //   this.bFitWCanvas = new SmartButton(this.bcx + this.bcw * 1, this.bcy, this.bcw, this.bch, node, "FitW", {
  //     textXoffset: 0,
  //     shape: Shapes.SQUARE,
  //   });
  //   buttons.push(this.bFitWCanvas);
  //   this.bFitHCanvas = new SmartButton(this.bcx + this.bcw * 2, this.bcy, this.bcw, this.bch, node, "FitH", {
  //     textXoffset: 0,
  //     shape: Shapes.ROUND_R,
  //   });
  //   buttons.push(this.bFitHCanvas);
  // }
}

// TODO CLASSES
export class TextObject {
  constructor(text) {
    this.x = 0;
    this.y = 0;
    this.width = 50;
    this.height = 50;
    this.text = text;
    this.textColor = "white";
    this.textYoffset = 0.0;
    this.textXoffset = 0.0;
    this.textAlign = "left";
    this.textBaseline = "top";
    this.font = "12px Arial Bold";
    this.textWidth = null;
  }

  changeFontSize(size) {}
}

class LayerSystem {}

class SaveObject {
  constructor(params) {}
}

class UndoSystem {
  constructor(maxUndo) {
    // Initialize undo and redo stacks
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = maxUndo || 10; // Limit undo steps to 10
  }

  // Save the current state of the canvases to the undo stack
  saveState() {
    if (this.undoStack.length >= this.maxUndoSteps) {
      // Remove the oldest state if the stack exceeds the limit
      this.undoStack.shift();
    }
    // Save the current state to the undo stack
    this.undoStack.push({
      foreground: this.foregroundCanvas.toDataURL(),
      background: this.backgroundCanvas.toDataURL(),
    });
    // Clear the redo stack when a new state is saved
    this.redoStack = [];
  }

  // Load a saved state from the undo stack
  loadState(state) {
    if (state.foreground) {
      let fgImg = new Image();
      fgImg.src = state.foreground;
      fgImg.onload = () => {
        this.foregroundCtx.clearRect(0, 0, this.width, this.height);
        this.foregroundCtx.drawImage(fgImg, 0, 0);
      };
    }
    if (state.background) {
      let bgImg = new Image();
      bgImg.src = state.background;
      bgImg.onload = () => {
        this.backgroundCtx.clearRect(0, 0, this.width, this.height);
        this.backgroundCtx.drawImage(bgImg, 0, 0);
      };
    }
  }

  // Undo the last action
  undo() {
    if (this.undoStack.length > 0) {
      // Push the current state to the redo stack
      this.redoStack.push({
        foreground: this.foregroundCanvas.toDataURL(),
        background: this.backgroundCanvas.toDataURL(),
      });

      // Pop the last state from the undo stack and apply it
      const lastState = this.undoStack.pop();
      this.loadState(lastState);
    }
  }

  // Redo the last undone action
  redo() {
    if (this.redoStack.length > 0) {
      // Pop the last state from the redo stack and apply it
      const lastState = this.redoStack.pop();
      this.loadState(lastState);

      // Push the current state back to the undo stack
      this.undoStack.push({
        foreground: this.foregroundCanvas.toDataURL(),
        background: this.backgroundCanvas.toDataURL(),
      });
    }
  }
}

export class AdvancedLabel extends BaseSmartWidget {
  constructor(node, textObject) {
    super(node);
    this.textObject = textObject;

    // add self to the node
    node.addCustomWidget(this);
  }

  draw(ctx) {
    // Draw text
    if (this.textObject.text) {
      ctx.fillStyle = this.textObject.textColor;
      ctx.font = this.textObject.font;
      ctx.textAlign = this.textObject.textAlign;
      ctx.textBaseline = this.textObject.textBaseline;
      ctx.fillText(
        this.textObject.text,
        this.textObject.x + this.textObject.textXoffset,
        this.textObject.y + this.textObject.textYoffset
      );
      if (this.textObject.textWidth === null) {
        const textMetrics = ctx.measureText(this.textObject.text);
        this.textObject.textWidth = textMetrics.width;
      }
    }
  }
}
