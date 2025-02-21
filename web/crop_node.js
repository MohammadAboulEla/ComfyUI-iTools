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
import {
  BaseSmartWidgetManager,
  SmartButton,
  SmartWidget,
  SmartSlider,
  SmartLabel,
  SmartSwitch,
  SmartCheckBox,
  SmartPaintArea,
  SmartPreview,
  SmartColorPicker,
  SmartDropdownMenu,
  TextObject,
  AdvancedLabel,
  SmartInfo,
  SmartImage,
  CanvasButtonManager,
  SmartLoading,
  SmartText,
} from "./makadi.js";

class CropWidget {
  constructor(node) {
    this.x = 0;
    this.y = 80;
    this.yOffset = this.y + 30;
    this.width = 50;
    this.height = 50;
    this.node = node;
    this._markDelete = false;
    this._mousePos = { x: 0, y: 0 };
    this.color = "crimson";
    this.isVisible = true;

    this.lastLoadedImg = node.imgs[0];
    this.img = node.imgs[0];
    this.imgOffsetX = 0;
    this.imgOffsetY = 0;

    this.cropFillColor = "rgba(255, 81, 0, 0.3)";

    // NODE SETTINGS
    this.nodeSize = 384;
    node.setSize([this.nodeSize, this.nodeSize + this.y]);
    node.resizable = false;

    this.cropping = false;
    this.isCroppingDone = false;
    this.startX = null;
    this.startY = null;
    this.endX = null;
    this.endY = null;

    this.resizing = null; // Track which handle is being resized
    this.resizeThreshold = 10; // Sensitivity for detecting resize handles

    this.adjustNewImageSize();

    // Add self to the node
    node.addCustomWidget(this);
    this.init();
  }

  autoPinNode() {
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

  isImageChanged() {
    if (this.node.imgs[0] && this.lastLoadedImg.src !== this.node.imgs[0].src) {
      this.lastLoadedImg = this.node.imgs[0];
      this.img = this.node.imgs[0];
      return true;
    } else {
      return false;
    }
  }

  getResizeHandle(x, y) {
    const handleSize = 10;
    const cropX = Math.min(this.startX, this.endX);
    const cropY = Math.min(this.startY, this.endY);
    const cropW = Math.abs(this.endX - this.startX);
    const cropH = Math.abs(this.endY - this.startY);

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
    return null;
  }

  adjustNewImageSize() {
    const img = this.node.imgs[0];
    const longestSide = Math.max(img.width, img.height);
    const scale = this.nodeSize / longestSide;

    this.width = img.width * scale;
    this.height = img.height * scale;

    // Center the image correctly
    this.imgOffsetX = (this.node.width - this.width) / 2;
    this.imgOffsetY = this.y + (this.nodeSize - this.height) / 2;
  }

  init() {
    this.node.onMouseDown = (e) => this.handleDown(e);
    app.canvas.onDrawForeground = (ctx) => this.handleMove(ctx);
    app.canvas.canvas.onclick = (e) => this.handleClick(e);
  }

  draw(ctx) {
    if (!this.isVisible) return;

    if (this.isImageChanged()) this.adjustNewImageSize();

    // Clear original image
    ctx.clearRect(this.x, this.y, this.node.width, this.node.height - this.yOffset);

    // Fill with background color
    ctx.fillStyle = this.node.bgcolor;
    ctx.fillRect(this.x, this.y, this.node.width, this.node.height - this.yOffset);

    // Draw loaded image
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

      // Draw handles at corners
      const handleSize = 10;
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]); // Reset dash pattern for solid lines

      ctx.strokeRect(cropX - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize); // Top-left
      ctx.strokeRect(cropX + cropW - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize); // Top-right
      ctx.strokeRect(cropX - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize); // Bottom-left
      ctx.strokeRect(cropX + cropW - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize); // Bottom-right
    }
  }

  handleDown(e) {
    const { x, y } = this.mousePos;

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

      this.dragging = true;
      this.dragOffsetX = x - cropX;
      this.dragOffsetY = y - cropY;
      return;
    }

    // Check if the mouse is over a resize handle
    if (this.isCroppingDone && this.getResizeHandle(x, y)) {
      this.resizing = this.getResizeHandle(x, y); // Start resizing
    } else if (!this.cropping) {
      this.cropping = true;
      this.isCroppingDone = false; // Reset cropping state
      this.startX = x;
      this.startY = y;
      this.endX = x; // Initialize endX and endY to the same values
      this.endY = y;
    }
  }
  handleMove(ctx) {
    const { x, y } = this.mousePos;
    if (this.dragging) {
      const cropW = this.endX - this.startX;
      const cropH = this.endY - this.startY;

      this.startX = Math.max(this.imgOffsetX, x - this.dragOffsetX);
      this.startY = Math.max(this.imgOffsetY, y - this.dragOffsetY);
      this.endX = this.startX + cropW;
      this.endY = this.startY + cropH;
      return;
    }

    if (this.cropping || this.resizing) {
      if (this.resizing) {
        // Resizing logic
        if (this.resizing === "top-left") {
          this.startX = Math.max(this.imgOffsetX, x); // Limit to image bounds
          this.startY = Math.max(this.imgOffsetY, y);
        } else if (this.resizing === "top-right") {
          this.endX = Math.min(this.imgOffsetX + this.width, x); // Limit to image bounds
          this.startY = Math.max(this.imgOffsetY, y);
        } else if (this.resizing === "bottom-left") {
          this.startX = Math.max(this.imgOffsetX, x); // Limit to image bounds
          this.endY = Math.min(this.imgOffsetY + this.height, y);
        } else if (this.resizing === "bottom-right") {
          this.endX = Math.min(this.imgOffsetX + this.width, x); // Limit to image bounds
          this.endY = Math.min(this.imgOffsetY + this.height, y);
        }

        // Ensure correct resizing logic
        if (this.resizing) {
          if (this.resizing === "top-left") {
            this.startX = Math.min(this.endX - 1, Math.max(this.imgOffsetX, x));
            this.startY = Math.min(this.endY - 1, Math.max(this.imgOffsetY, y));
          } else if (this.resizing === "top-right") {
            this.endX = Math.max(this.startX + 1, Math.min(this.imgOffsetX + this.width, x));
            this.startY = Math.min(this.endY - 1, Math.max(this.imgOffsetY, y));
          } else if (this.resizing === "bottom-left") {
            this.startX = Math.min(this.endX - 1, Math.max(this.imgOffsetX, x));
            this.endY = Math.max(this.startY + 1, Math.min(this.imgOffsetY + this.height, y));
          } else if (this.resizing === "bottom-right") {
            this.endX = Math.max(this.startX + 1, Math.min(this.imgOffsetX + this.width, x));
            this.endY = Math.max(this.startY + 1, Math.min(this.imgOffsetY + this.height, y));
          }
        }
      } else {
        // Regular cropping mode
        this.endX = x;
        this.endY = y;

        // // Swap startX/endX and startY/endY if necessary during drawing
        // if (this.startX > this.endX) {
        //   [this.startX, this.endX] = [this.endX, this.startX];
        // }
        // if (this.startY > this.endY) {
        //   [this.startY, this.endY] = [this.endY, this.startY];
        // }
        if (!this.resizing) {
          this.endX = Math.max(this.imgOffsetX, Math.min(this.imgOffsetX + this.width, this.endX));
          this.endY = Math.max(this.imgOffsetY, Math.min(this.imgOffsetY + this.height, this.endY));
        }
      }
    }
  }
  handleClick(e) {
    if (this.cropping && this.startX !== null && this.endX !== null) {
      this.cropping = false;
      this.isCroppingDone = true;
    }
    // Reset resizing state
    this.resizing = null;
    this.dragging = false;
  }

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  isMouseInCropArea(margin = 5) {
    const { x, y } = this.mousePos;
    const cropX = Math.min(this.startX, this.endX) + margin;
    const cropY = Math.min(this.startY, this.endY) + margin;
    const cropW = Math.abs(this.endX - this.startX) - 2 * margin;
    const cropH = Math.abs(this.endY - this.startY) - 2 * margin;

    return x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH;
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
    const window = globalThis;

    // if (allow_debug) {
    //   console.log("window", window);
    //   console.log("nodeType", nodeType);
    //   console.log("nodeData", nodeData);
    //   console.log("app", app);
    // }
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsCropImage") {
      return;
    }

    while (node.graph === null) {
      if (allow_debug) console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    //START POINT
    const cropPreview = new CropWidget(node);
    if (allow_debug) {
      console.log("node", node);
    }
  },
});
