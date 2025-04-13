import { SmartWidget } from "./SmartWidget.js";
import { allow_debug } from "../js_shared.js";

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
          ctx.roundRect(this.myX + 0.5, this.myY + 0.5, this.withTagWidth, this.height - 1, [
            this.tagRound,
            0,
            0,
            this.tagRound,
          ]);
        } else {
          // Round only the right side
          ctx.roundRect(
            this.myX + this.width - this.withTagWidth - 0.5,
            this.myY + 0.5,
            this.withTagWidth,
            this.height - 1,
            [0, this.tagRound, this.tagRound, 0]
          );
        }
  
        ctx.fill();
      }
  
      // Draw text
      if (this.text) {
        ctx.fillStyle = this.textColor;
        ctx.font = this.font;
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;
        ctx.fillText(
          this.text,
          this.myX + this.width / 2 + this.textXoffset,
          this.myY + this.height / 2 + this.textYoffset
        );
      }
    }
  }