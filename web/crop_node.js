import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

import {
  Shapes,
  Colors,
  lightenColor,
  canvasRatios,
  canvasScales,
  commonColors,
  trackMouseColor,
  fakeMouseDown,
  getIndexByDimensions,
} from "./utils.js";
import { BaseSmartWidget, SmartInfo } from "./makadi.js";

function fakeGraphClick(graph, x, y) {
  const canvas = graph.canvas;
  if (!canvas) return;

  const eventProps = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: "mouse",
  };

  // const pointerDownEvent = new PointerEvent("pointerdown", eventProps);
  // canvas.dispatchEvent(pointerDownEvent);
  setTimeout(() => {
    // const upEvent = new MouseEvent("pointerup", eventProps);
    // canvas.dispatchEvent(upEvent);
    const clickEvent = new MouseEvent("click", eventProps);
    canvas.dispatchEvent(clickEvent);
  }, 50);
}

export class LiteInfo extends BaseSmartWidget {
  constructor(x, y, width, height, node, text, options = {}) {
    super(node);

    this.myX = x;
    this.myY = y;
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
    this.isVisible = false;

    // Apply options if provided
    Object.assign(this, options);
    this.originalColor = this.color; // Store original color
    this.originalTextColor = this.textColor;

    // add self to the node
    //node.addCustomWidget(this);
  }

  handleDown() {}

  handleClick() {}

  handleMove() {}

  draw(ctx) {
    if (!this.isVisible || !this.text) return;

    // Draw rounded rectangle
    if (this.shape === Shapes.ROUND) {
      const radius = Math.min(this.width, this.height) / 5; // Adjust rounding level
      ctx.beginPath();
      ctx.moveTo(this.myX + radius, this.myY);
      ctx.lineTo(this.myX + this.width - radius, this.myY);
      ctx.arcTo(this.myX + this.width, this.myY, this.myX + this.width, this.myY + radius, radius);
      ctx.lineTo(this.myX + this.width, this.myY + this.height - radius);
      ctx.arcTo(this.myX + this.width, this.myY + this.height, this.myX + this.width - radius, this.myY + this.height, radius);
      ctx.lineTo(this.myX + radius, this.myY + this.height);
      ctx.arcTo(this.myX, this.myY + this.height, this.myX, this.myY + this.height - radius, radius);
      ctx.lineTo(this.myX, this.myY + radius);
      ctx.arcTo(this.myX, this.myY, this.myX + radius, this.myY, radius);
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

    // Draw text
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, this.myX + this.width / 2 + this.textXoffset, this.myY + this.height / 2 + this.textYoffset);
    }
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

class CropWidget {
  constructor(node) {
    this.node = node;
    this.value = {};
    this.myX = 0;
    this.myY = 80 + 20 + 20;
    this.yOffset = this.myY + 30;
    this.width = 50;
    this.height = 50;

    this._markDelete = false;
    this._mousePos = { x: 0, y: 0 };
    this.color = "crimson";
    this.isVisible = true;

    this.img = null;
    this.imgOffsetX = 0;
    this.imgOffsetY = 0;

    this.cropFillColor = "rgba(255, 100, 0, 0.2)"; //"rgba(255, 81, 0, 0.2)";

    // NODE SETTINGS
    this.nodeSize = 384;
    node.setSize([this.nodeSize, this.nodeSize + this.myY]);
    node.resizable = false;
    this.resizeRatio = null;
    this.multipleFactor = 64;

    this.info = new LiteInfo(this.nodeSize / 2 - 40, this.myY + 5, 80, 15, node, "");

    this.cropping = false;
    this.isCroppingDone = false;
    this.drawCropPreview = false;
    this.startX = null;
    this.startY = null;
    this.endX = null;
    this.endY = null;

    this.resizing = null; // Track which handle is being resized
    this.resizeThreshold = 10; // Sensitivity for detecting resize handles

    if (node.widgets_values && node.widgets_values[4]) {
      if (allow_debug) console.log("node has crop data value");
      this.value = node.widgets_values[4];
      this.node.properties.value = node.widgets_values[4];
    } else {
      if (allow_debug) console.log("node does not has crop data value");
    }

    if (node.properties.value) {
      this.loadCropData();
      this.cropNewImage();
    } else {
      node.properties.value = {};
    }

    this.adjustNewImageSize(); // init
    this.setResizeRatio(); // init ratio
    
    // ON Ratio Changed
    this.node.widgets[0].callback = () => {
      this.setResizeRatio();
    };

    // ON Grid Step Changed
    this.node.widgets[1].callback = () => {
      this.adjustMultipleFactor();
    };

    // ON Image Changed
    const originalOnChanged = this.node.widgets[1].callback;
    this.node.widgets[1].callback = async (img) => {
      originalOnChanged.apply(this);
      this.img = null;
      //this.resetCroppingData(); // disabled
      while (this.img !== this.node.imgs[0]) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      this.cropNewImage();
    };

    this.node.onMouseUp = (e) => {
      this.hideInfo();
    };
    this.node.onMouseLeave = (e) => {};
  }

  loadCropData() {
    this.startX = this.node.properties.value.startX;
    this.startY = this.node.properties.value.startY;
    this.endX = this.node.properties.value.endX;
    this.endY = this.node.properties.value.endY;
    //if(allow_debug) console.log('loaded',this.node.properties.value);
    this.isCroppingDone = true;
    this.node.setDirtyCanvas(true, true);
  }

  saveCropData() {
    if (this.startX && this.endX && this.startY && this.endY) {
      this.value.startX = this.startX;
      this.value.startY = this.startY;
      this.value.endX = this.endX;
      this.value.endY = this.endY;

      this.node.properties.value.startX = this.startX;
      this.node.properties.value.startY = this.startY;
      this.node.properties.value.endX = this.endX;
      this.node.properties.value.endY = this.endY;

      if (allow_debug) console.log("crop data saved");
    }
  }

  autoPinNode() {
    const safeZone = 50;
    const { x, y } = this.mousePos;
    if (y > 50 && y < this.node.height + safeZone) {
      if (x > this.node.width + safeZone || x < -safeZone) {
        this.node.flags.pinned = false;
      } else {
        this.node.flags.pinned = true;
      }
    } else {
      this.node.flags.pinned = false;
    }
  }

  resetCroppingData() {
    this.croppedImage = null;
    this.value = {};
    this.value.data = null;
    this.cropping = false;
    this.isCroppingDone = false;
    this.startX = null;
    this.startY = null;
    this.endX = null;
    this.endY = null;
    this.resizing = null;
  }

  getResizeHandle(x, y) {
    const handleSize = 10;
    const cropX = Math.min(this.startX, this.endX);
    const cropY = Math.min(this.startY, this.endY);
    const cropW = Math.abs(this.endX - this.startX);
    const cropH = Math.abs(this.endY - this.startY);

    // Check corners
    if (x >= cropX - handleSize && x <= cropX + handleSize && y >= cropY - handleSize && y <= cropY + handleSize) {
      return "top-left";
    }
    if (
      x >= cropX + cropW - handleSize &&
      x <= cropX + cropW + handleSize &&
      y >= cropY - handleSize &&
      y <= cropY + handleSize
    ) {
      return "top-right";
    }
    if (
      x >= cropX - handleSize &&
      x <= cropX + handleSize &&
      y >= cropY + cropH - handleSize &&
      y <= cropY + cropH + handleSize
    ) {
      return "bottom-left";
    }
    if (
      x >= cropX + cropW - handleSize &&
      x <= cropX + cropW + handleSize &&
      y >= cropY + cropH - handleSize &&
      y <= cropY + cropH + handleSize
    ) {
      return "bottom-right";
    }

    // Only check midpoints if the ratio is set to "free"
    if (this.resizeRatio === null) {
      if (
        x >= cropX + cropW / 2 - handleSize &&
        x <= cropX + cropW / 2 + handleSize &&
        y >= cropY - handleSize &&
        y <= cropY + handleSize
      ) {
        return "top-mid";
      }
      if (
        x >= cropX + cropW / 2 - handleSize &&
        x <= cropX + cropW / 2 + handleSize &&
        y >= cropY + cropH - handleSize &&
        y <= cropY + cropH + handleSize
      ) {
        return "bottom-mid";
      }
      if (
        x >= cropX - handleSize &&
        x <= cropX + handleSize &&
        y >= cropY + cropH / 2 - handleSize &&
        y <= cropY + cropH / 2 + handleSize
      ) {
        return "left-mid";
      }
      if (
        x >= cropX + cropW - handleSize &&
        x <= cropX + cropW + handleSize &&
        y >= cropY + cropH / 2 - handleSize &&
        y <= cropY + cropH / 2 + handleSize
      ) {
        return "right-mid";
      }
    }

    return null;
  }

  adjustNewImageSize() {
    const img = this.node.imgs[0];
    if (this.img === img) return; // Avoid redundant assignment

    this.img = img;
    const longestSide = Math.max(img.width, img.height);
    const scale = this.nodeSize / longestSide;

    this.width = img.width * scale;
    this.height = img.height * scale;

    // Center the image correctly
    this.imgOffsetX = (this.node.width - this.width) / 2;
    this.imgOffsetY = this.myY + (this.nodeSize - this.height) / 2;

    this.node.setDirtyCanvas(true, true);
  }

  setResizeRatio() {
    function ratioToFraction(ratio) {
      if (ratio === "free") return null;
      if (ratio === "grid") return null;
      let [num, den] = ratio.split(":").map(Number);
      return num / den;
    }
    const ratio = ratioToFraction(this.node.widgets[0].value);
    this.resizeRatio = ratio;
  }

  draw(ctx) {
    if (!this.isVisible) return;

    // Clear original image
    ctx.clearRect(this.myX, this.myY, this.node.width, this.node.height - this.yOffset);

    // Fill with background color
    ctx.fillStyle = this.node.bgcolor;
    ctx.fillRect(this.myX, this.myY, this.node.width, this.node.height - this.yOffset);

    // Draw loaded image
    this.adjustNewImageSize();
    ctx.drawImage(this.img, this.imgOffsetX, this.imgOffsetY, this.width, this.height);

    // Draw crop rect fill area
    if (this.cropping || this.isCroppingDone) {
      // Calculate the crop area boundaries
      const cropX = Math.min(this.startX, this.endX);
      const cropY = Math.min(this.startY, this.endY);
      const cropW = Math.abs(this.endX - this.startX);
      const cropH = Math.abs(this.endY - this.startY);

      ctx.fillStyle = this.cropFillColor;
      ctx.fillRect(cropX, cropY, cropW, cropH);

      // Draw a dashed outline around the crop rect
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(cropX, cropY, cropW, cropH);

      // Draw handles at corners and midpoints
      const handleSize = 10;
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]); // Reset dash pattern for solid lines

      // Corner handles
      ctx.strokeRect(cropX - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize); // Top-left
      ctx.strokeRect(cropX + cropW - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize); // Top-right
      ctx.strokeRect(cropX - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize); // Bottom-left
      ctx.strokeRect(cropX + cropW - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize); // Bottom-right

      // Only draw midpoint handles if the ratio is set to "free"
      if (this.resizeRatio === null) {
        ctx.strokeRect(cropX + cropW / 2 - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize); // Top-mid
        ctx.strokeRect(cropX + cropW / 2 - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize); // Bottom-mid
        ctx.strokeRect(cropX - handleSize / 2, cropY + cropH / 2 - handleSize / 2, handleSize, handleSize); // Left-mid
        ctx.strokeRect(cropX + cropW - handleSize / 2, cropY + cropH / 2 - handleSize / 2, handleSize, handleSize); // Right-mid
      }
    }

    if (this.croppedImage && this.drawCropPreview && !this.cropping && !this.resizing) {
      // Calculate the crop area dimensions
      const cropWidth = Math.abs(this.endX - this.startX);
      const cropHeight = Math.abs(this.endY - this.startY);

      // Define a maximum size for the preview (e.g., 100x100 pixels)
      const maxPreviewSize = 100;

      // Calculate the aspect ratio of the crop area
      const aspectRatio = cropWidth / cropHeight;

      // Determine the preview dimensions while maintaining the aspect ratio
      let croppedImageWidth, croppedImageHeight;
      if (cropWidth > cropHeight) {
        croppedImageWidth = maxPreviewSize;
        croppedImageHeight = maxPreviewSize / aspectRatio;
      } else {
        croppedImageHeight = maxPreviewSize;
        croppedImageWidth = maxPreviewSize * aspectRatio;
      }

      // Define the position for the cropped image in the left corner
      const croppedImageX = this.myX + 10; // 10 pixels from the left edge of the node
      const croppedImageY = this.myY + 10; // 10 pixels from the top edge of the node

      try {
        // Draw the cropped image
        ctx.drawImage(this.croppedImage, croppedImageX, croppedImageY, croppedImageWidth, croppedImageHeight);
      } catch (error) {}
    }
    this.info.draw(ctx);
  }

  cropNewImage() {
    if (!this.img) {
      this.adjustNewImageSize()
    };
    
    // Calculate the scale factors for the image
    const scaleX = this.img.naturalWidth / this.width;
    const scaleY = this.img.naturalHeight / this.height;

    // Calculate the crop area in the original image coordinates
    const cropX = (Math.min(this.startX, this.endX) - this.imgOffsetX) * scaleX;
    const cropY = (Math.min(this.startY, this.endY) - this.imgOffsetY) * scaleY;
    const cropWidth = Math.abs(this.endX - this.startX) * scaleX;
    const cropHeight = Math.abs(this.endY - this.startY) * scaleY;

    // Create a canvas to hold the cropped image
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");

    // Cash values
    this.cropWidth = cropWidth;
    this.cropHeight = cropHeight;

    // Draw the cropped portion of the image onto the canvas
    ctx.drawImage(
      this.img,
      cropX,
      cropY,
      cropWidth,
      cropHeight, // Source rectangle (cropped area)
      0,
      0,
      cropWidth,
      cropHeight // Destination rectangle (canvas)
    );

    // Create a new image from the canvas and store it
    this.croppedImage = new Image();
    this.croppedImage.src = canvas.toDataURL();

    // for python
    if (this.croppedImage) {
      if (
        this.croppedImage.src === "data:;" ||
        this.croppedImage.src.startsWith("data:,") ||
        this.croppedImage.src.length < 50
      ) {
        if (allow_debug) console.log("Image has small or empty data.");
        this.name = "crop";
        this.value.data = null;
        this.isCroppingDone = false;
      } else {
        this.name = "crop";
        this.value.data = this.croppedImage.src;
      }
    }
    if (allow_debug) console.log("cropped image");
  }

  handleDown(e) {
    const { x, y } = this.mousePos;
    this.adjustMultipleFactor();

    // if (this.isMouseOnImage()) {
    //   if (allow_debug) console.log("mouse in");
    // } else {
    //   if (allow_debug)console.log("mouse out");
    // }

    // Swap startX/endX and startY/endY if necessary during drawing
    if (this.startX > this.endX) {
      [this.startX, this.endX] = [this.endX, this.startX];
    }
    if (this.startY > this.endY) {
      [this.startY, this.endY] = [this.endY, this.startY];
    }

    if (this.isMouseInCropArea()) {
      const cropX = Math.min(this.startX, this.endX);
      const cropY = Math.min(this.startY, this.endY);
      const cropW = Math.abs(this.endX - this.startX);
      const cropH = Math.abs(this.endY - this.startY);
      if (allow_debug) {
        console.log("mouse in crop area");
      }
      this.dragging = true;
      this.dragOffsetX = x - cropX;
      this.dragOffsetY = y - cropY;
      return;
    }

    // Check if the mouse is over a resize handle
    if (this.isCroppingDone && this.getResizeHandle(x, y)) {
      this.resizing = this.getResizeHandle(x, y); // Start resizing
    } else if (!this.cropping && this.isMouseOnImage()) {
      this.cropping = true;
      this.isCroppingDone = false;
      this.startX = x;
      this.startY = y;
      this.endX = x;
      this.endY = y;
    }
  }

  handleMove(ctx) {
    this.autoPinNode();
    const { x, y } = this.mousePos;

    // Helper function to round a number to the nearest multiple of
    const roundToMultipleOf = (value) => {
      return Math.round(value / this.multipleFactor) * this.multipleFactor;
    };

    if (this.cropping || this.resizing) {
      if (this.resizing) {
        let newWidth, newHeight;
        const isCornerResizing =
          this.resizing === "top-left" ||
          this.resizing === "top-right" ||
          this.resizing === "bottom-left" ||
          this.resizing === "bottom-right";

        const shouldMaintainRatio = !["free", "grid"].includes(this.node.widgets[0].value);

        // Calculate new dimensions based on mouse movement
        if (this.resizing.includes("left") || this.resizing.includes("right")) {
          newWidth = Math.abs(this.resizing.includes("left") ? this.endX - x : x - this.startX);
          if (shouldMaintainRatio) {
            // For corners with aspect ratio, calculate height based on width
            newHeight = newWidth / this.resizeRatio;
          }
        }

        if (this.resizing.includes("top") || this.resizing.includes("bottom")) {
          newHeight = Math.abs(this.resizing.includes("top") ? this.endY - y : y - this.startY);
          if (shouldMaintainRatio) {
            // For corners with aspect ratio, calculate width based on height
            newWidth = newHeight * this.resizeRatio;
          }
        }

        // Round width and height to the nearest multiple of this.multipleFactor
        newWidth = roundToMultipleOf(newWidth);
        newHeight = roundToMultipleOf(newHeight);

        // Ensure the new dimensions respect the image boundaries
        if (this.resizing.includes("left")) {
          newWidth = Math.min(newWidth, this.endX - this.imgOffsetX);
        } else if (this.resizing.includes("right")) {
          newWidth = Math.min(newWidth, this.imgOffsetX + this.width - this.startX);
        }

        if (this.resizing.includes("top")) {
          newHeight = Math.min(newHeight, this.endY - this.imgOffsetY);
        } else if (this.resizing.includes("bottom")) {
          newHeight = Math.min(newHeight, this.imgOffsetY + this.height - this.startY);
        }

        // For corner resizing with ratio maintenance, choose the constraining dimension
        if (shouldMaintainRatio) {
          // Calculate which dimension is more constrained
          const widthRatio = newWidth / (newHeight * this.resizeRatio);

          if (widthRatio < 1) {
            // Width is more constrained, adjust height accordingly
            newHeight = newWidth / this.resizeRatio;
          } else {
            // Height is more constrained, adjust width accordingly
            newWidth = newHeight * this.resizeRatio;
          }

          // Re-round after aspect ratio adjustment
          newWidth = roundToMultipleOf(newWidth);
          newHeight = roundToMultipleOf(newHeight);
        }

        // Apply the new dimensions for the resizing handle
        switch (this.resizing) {
          case "top-left":
            this.startX = this.endX - newWidth;
            this.startY = this.endY - newHeight;
            break;
          case "top-right":
            this.endX = this.startX + newWidth;
            this.startY = this.endY - newHeight;
            break;
          case "bottom-left":
            this.startX = this.endX - newWidth;
            this.endY = this.startY + newHeight;
            break;
          case "bottom-right":
            this.endX = this.startX + newWidth;
            this.endY = this.startY + newHeight;
            break;
          case "top-mid":
            this.startY = this.endY - newHeight;
            break;
          case "bottom-mid":
            this.endY = this.startY + newHeight;
            break;
          case "left-mid":
            this.startX = this.endX - newWidth;
            break;
          case "right-mid":
            this.endX = this.startX + newWidth;
            break;
        }

        // Ensure the crop area stays within the image boundaries
        this.startX = Math.max(this.imgOffsetX, this.startX);
        this.startY = Math.max(this.imgOffsetY, this.startY);
        this.endX = Math.min(this.imgOffsetX + this.width, this.endX);
        this.endY = Math.min(this.imgOffsetY + this.height, this.endY);

        this.showInfo();
      } else {
        this.adjustMultipleFactor();

        // Calculate the new endX and endY based on the mouse position
        let newEndX = roundToMultipleOf(Math.max(this.imgOffsetX, Math.min(this.imgOffsetX + this.width, x)));
        let newEndY = roundToMultipleOf(Math.max(this.imgOffsetY, Math.min(this.imgOffsetY + this.height, y)));

        // Calculate the width and height of the crop area
        let cropWidth = newEndX - this.startX;
        let cropHeight = newEndY - this.startY;

        // Round the width and height to the nearest multiple of this.multipleFactor
        cropWidth = roundToMultipleOf(cropWidth);
        cropHeight = roundToMultipleOf(cropHeight);

        // Adjust the endX and endY to maintain the rounded width and height
        this.endX = this.startX + cropWidth;
        this.endY = this.startY + cropHeight;

        // Ensure the crop area stays within the image boundaries
        this.endX = Math.min(this.endX, this.imgOffsetX + this.width);
        this.endY = Math.min(this.endY, this.imgOffsetY + this.height);

        this.showInfo();
      }
    }

    if (this.dragging) {
      const cropW = Math.round(Math.abs(this.endX - this.startX));
      const cropH = Math.round(Math.abs(this.endY - this.startY));

      let newStartX = Math.round(Math.max(this.imgOffsetX, x - this.dragOffsetX));
      let newStartY = Math.round(Math.max(this.imgOffsetY, y - this.dragOffsetY));

      // Clamp to ensure the crop box stays within image boundaries
      newStartX = Math.round(Math.min(newStartX, this.imgOffsetX + this.width - cropW));
      newStartY = Math.round(Math.min(newStartY, this.imgOffsetY + this.height - cropH));

      this.startX = newStartX;
      this.startY = newStartY;
      this.endX = this.startX + cropW;
      this.endY = this.startY + cropH;
      return;
    }
  }

  showInfo() {
    this.info.isVisible = true;

    // Calculate the scale factors for the image
    const scaleX = this.img.naturalWidth / this.width;
    const scaleY = this.img.naturalHeight / this.height;

    // Calculate the crop area in the original image coordinates
    const cropWidth = Math.round(Math.abs(this.endX - this.startX) * scaleX);
    const cropHeight = Math.round(Math.abs(this.endY - this.startY) * scaleY);

    this.info.text = `${cropWidth} x ${cropHeight}`;
  }

  adjustMultipleFactor() {
    const mode = this.node.widgets[0].value;
    if (allow_debug) console.log("mode", mode);
    if (mode === "grid") {
      const value = this.node.widgets[1].value;
      // Calculate the scale factors for the image
      const scaleX = this.img.naturalWidth / this.width;
      const scaleY = this.img.naturalHeight / this.height;

      // Calculate the crop area in the original image coordinates
      const cropWidth = Math.floor(Math.abs(this.endX - this.startX) * scaleX);
      const cropHeight = Math.floor(Math.abs(this.endY - this.startY) * scaleY);

      // Adjust the multipleFactor based on the user's input and the scaling factors
      // The multipleFactor should be such that when multiplied by the scaling factor,
      // it results in the desired multiple in the true output image.
      this.multipleFactor = value / Math.min(scaleX, scaleY);
    } else {
      this.multipleFactor = 1;
    }
  }

  handleClick(e) {
    if (this.isMouseOnImage()) {
      if (this.startX && this.endX && this.startY && this.endY) {
        this.isCroppingDone = true;
        this.cropNewImage();
        this.saveCropData();
      }

      // Reset resizing state
      this.cropping = false;
      this.resizing = null;
      this.dragging = false;
    }
  }

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  hideInfo() {
    this.info.isVisible = true;
    setTimeout(() => {
      this.info.isVisible = false;
    }, 2000);
  }

  isMouseInCropArea(margin = 5) {
    const { x, y } = this.mousePos;
    const cropX = Math.min(this.startX, this.endX) + margin;
    const cropY = Math.min(this.startY, this.endY) + margin;
    const cropW = Math.abs(this.endX - this.startX) - 2 * margin;
    const cropH = Math.abs(this.endY - this.startY) - 2 * margin;

    return x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH;
  }

  isMouseOnImage() {
    const { x, y } = this.mousePos;
    return (
      x >= this.imgOffsetX &&
      x <= this.imgOffsetX + this.width &&
      y >= this.imgOffsetY &&
      y <= this.imgOffsetY + this.height
    );
  }

  isMouseInResizeArea() {
    const { x: mouseX, y: mouseY } = this.mousePos;
    const threshold = this.resizeThreshold;

    const cropX = Math.min(this.startX, this.endX);
    const cropY = Math.min(this.startY, this.endY);
    const cropW = Math.abs(this.endX - this.startX);
    const cropH = Math.abs(this.endY - this.startY);

    const dx = mouseX - (cropX + cropW / 2);
    const dy = mouseY - (cropY + cropH / 2);

    const radianAngle = -(this.rotationAngle * Math.PI) / 180;
    const cosA = Math.cos(radianAngle);
    const sinA = Math.sin(radianAngle);

    const rotatedX = dx * cosA - dy * sinA;
    const rotatedY = dx * sinA + dy * cosA;

    const rx = rotatedX + cropW / 2;
    const ry = rotatedY + cropH / 2;

    const topLeft = rx >= -threshold && rx <= threshold && ry >= -threshold && ry <= threshold;
    const topRight = rx >= cropW - threshold && rx <= cropW + threshold && ry >= -threshold && ry <= threshold;
    const bottomLeft = rx >= -threshold && rx <= threshold && ry >= cropH - threshold && ry <= cropH + threshold;
    const bottomRight =
      rx >= cropW - threshold && rx <= cropW + threshold && ry >= cropH - threshold && ry <= cropH + threshold;

    const top = rx >= 0 && rx <= cropW && ry >= -threshold && ry <= threshold;
    const bottom = rx >= 0 && rx <= cropW && ry >= cropH - threshold && ry <= cropH + threshold;
    const left = rx >= -threshold && rx <= threshold && ry >= 0 && ry <= cropH;
    const right = rx >= cropW - threshold && rx <= cropW + threshold && ry >= 0 && ry <= cropH;

    return topLeft || topRight || bottomLeft || bottomRight || top || bottom || left || right;
  }

  isLowQuality() {
    const canvas = app.canvas;
    const scale = canvas?.ds?.scale ?? 1; // Get scale, default to 1 if undefined
    return scale <= 0.5;
  }

  delete() {
    this.node.widgets = this.node.widgets.filter((widget) => widget !== this);
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

app.registerExtension({
  name: "iTools.cropImage",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsCropImage") {
      return;
    }
    // const originalOnExecuted = nodeType.prototype.onExecuted;
    // nodeType.prototype.onExecuted = async function (message) {
    //   originalOnExecuted?.apply(this, arguments);
    //   if(allow_debug) console.log('iToolsCropImage executed',message);
    // }
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsCropImage") {
      return;
    }

    // if (allow_debug) console.log("node.widgets_values", node.widgets_values);
    // wait for init
    const timeout = 3000; // 3 seconds
    const startTime = Date.now();
    while (!node.graph) {
      if (Date.now() - startTime > timeout) {
        if (allow_debug) console.error("Timeout: Failed to load graph.");
        break;
      }
      if (allow_debug) console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    //START POINT
    const cropPreview = new CropWidget(node);
    node.addCustomWidget(cropPreview);
    if (allow_debug) console.log("node", node);

    const originalOnExecuted = node.onExecuted;
    node.onExecuted = async function (message) {
      originalOnExecuted?.apply(this, arguments);
      if (allow_debug) console.log("iToolsCropImage executed", message);
    };

    node.clone = () => {
      console.warn("Cloning is disabled for this node.");
      return null;
    };

    // Store the original onMouseDown handler
    const originalOnMouseDown = app.canvas.onMouseDown;
    app.canvas.onMouseDown = (e) => {
      // Call original handler if it exists
      if (originalOnMouseDown) {
        originalOnMouseDown.call(app.canvas, e);
      }
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsCropImage") {
          n.widgets.forEach(w=>{
            w.handleDown?.(e);
          })
        }
      });
    };
    
    // Store the original onDrawForeground handler
    const originalOnDrawForeground = app.canvas.onDrawForeground;
    app.canvas.onDrawForeground = (ctx) => {
      // Call original handler if it exists
      if (originalOnDrawForeground) {
        originalOnDrawForeground.call(app.canvas, ctx);
      }
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsCropImage") {
          n.widgets.forEach(w=>{
            w.handleMove?.(ctx);
          })
        }
      });
    };

    // Store the original onclick handler
    const originalOnClick = app.canvas.canvas.onclick;
    app.canvas.canvas.onclick = (e) => {
      // Call original handler if it exists
      if (originalOnClick) {
        originalOnClick.call(app.canvas.canvas, e);
      }
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsCropImage") {
          n.widgets.forEach(w=>{
            w.handleClick?.(e);
          })
        }
      });
    };

    app.canvas.onMouseUp = (e) => {
      if (allow_debug) {
        console.log("mouse up");
      }
    };
  },
});
