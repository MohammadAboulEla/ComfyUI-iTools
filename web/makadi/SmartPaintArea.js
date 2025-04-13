import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { app } from "../../../../scripts/app.js";
import { api } from "../../../../scripts/api.js";
import { allow_debug } from "../js_shared.js";
import {  drawAngledStrips } from "../utils.js";


export class SmartPaintArea extends BaseSmartWidget {
    constructor(x, y, width, height, node) {
      super(node);
  
      this.myX = x;
      this.myY = y;
      this.width = width;
      this.height = height;
  
      this.myYOffset = 0;
      this.myXOffset = 0;
  
      this.nodeYoffset = 50;
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
      this.node.setSize([512, 592]);
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
              (x - this.myX - this.myXOffset) / this.scaleFactor,
              (y - this.myY - this.myYOffset) / this.scaleFactor
            );
            activeCtx.stroke();
            activeCtx.beginPath();
            activeCtx.moveTo(
              (x - this.myX - this.myXOffset) / this.scaleFactor,
              (y - this.myY - this.myYOffset) / this.scaleFactor
            );
          } else {
            // Clear the area in a circular shape for foregroundCtx
            activeCtx.save();
            activeCtx.beginPath();
            activeCtx.arc(
              (x - this.myX - this.myXOffset) / this.scaleFactor,
              (y - this.myY - this.myYOffset) / this.scaleFactor,
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
            (x - this.myX - this.myXOffset) / this.scaleFactor,
            (y - this.myY - this.myYOffset) / this.scaleFactor
          );
          activeCtx.stroke();
          activeCtx.beginPath();
          activeCtx.moveTo(
            (x - this.myX - this.myXOffset) / this.scaleFactor,
            (y - this.myY - this.myYOffset) / this.scaleFactor
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
      ctx.drawImage(this.backgroundCanvas, this.myX / this.scaleFactor, this.myY / this.scaleFactor);
  
      // Then draw the foreground canvas on top
      ctx.drawImage(this.foregroundCanvas, this.myX / this.scaleFactor, this.myY / this.scaleFactor);
  
      if (this.isCheckerboardOn) drawAngledStrips(ctx, this.width, this.height, this.scaleFactor);
  
      ctx.restore();
    }
  
    handleDown(e) {
      if (e.button !== 0) return; // return if right mouse click
      if (this.isMouseIn()) {
        if (this.onPress) this.onPress();
        // Save the current state before starting to paint
        this.commitChange();
        this.isPainting = true;
      }
    }
  
    handleClick() {
      if (this.isMouseIn()) {
        if (this.onClick) this.onClick();
        this.isPainting = false;
      }
    }
  
    handleMove() {
      if (this.onUpdate) this.onUpdate();
    }
  
    isMouseIn() {
      const { x, y } = this.mousePos;
      return x >= this.myX && x <= this.myX + this.width && y >= this.myY && y <= this.myY + this.height;
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
      this.myX = (this.node.width - newX * this.scaleFactor) / 2;
      this.myY = (this.node.height + this.nodeYoffset - newY * this.scaleFactor) / 2;
  
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