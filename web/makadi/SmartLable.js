import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class SmartLabel extends BaseSmartWidget {
    constructor(x, y, width, height, node, text, options = {}) {
      super(node);
  
      this.myX = x;
      this.myY = y;
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
        ctx.fillText(this.text, this.myX + this.textXoffset, this.myY + this.textYoffset);
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