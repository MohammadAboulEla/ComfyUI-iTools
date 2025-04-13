import { Shapes, } from "./utils.js";
import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidget } from "./makadi/BaseSmartWidget.js";

// TODO CLASSES
class TextObject {
  constructor(text) {
    this.myX = 0;
    this.myY = 0;
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

class SaveObject {}

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

class AdvancedLabel extends BaseSmartWidget {
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
