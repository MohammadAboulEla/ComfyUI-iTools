import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { lightenColor } from "../utils.js";
import { allow_debug } from "../js_shared.js";

export class SmartDropdownMenu extends BaseSmartWidget {
    constructor(x, y, width, height, node, title, items) {
      super(node);
      this.myX = x;
      this.myY = y;
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
      ctx.roundRect(this.myX, this.myY, this.width, this.height, 5);
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
      ctx.fillText(text, this.myX + this.width / 2, this.myY + this.height / 2 + this.textYOffset);
    }
  
    drawMenu(ctx) {
      const menuHeight = this.items.length * this.height + (this.items.length - 1) * this.dropMenuGap + 2;
      const menuWidth = this.width + 2;
  
      ctx.fillStyle = this.dropMenuBg;
      ctx.beginPath();
      ctx.roundRect(this.myX - 1, this.myY - 1 + this.height + this.dropMenuOffset, menuWidth, menuHeight, 5);
      ctx.fill();
  
      for (let i = 0; i < this.items.length; i++) {
        const itemY = this.myY + this.height * (i + 1) + this.dropMenuOffset + i * this.dropMenuGap;
        ctx.fillStyle = i === this.selectedItemIndex ? this.handleColor : this.bgColor;
        ctx.beginPath();
        ctx.roundRect(this.myX, itemY, this.width, this.height, 5);
        ctx.fill();
  
        ctx.fillStyle = i === this.selectedItemIndex ? "black" : this.textColor;
        ctx.fillText(this.items[i], this.myX + this.width / 2, itemY + this.height / 2 + this.textYOffset);
      }
    }
  
    handleClick(event) {
      const { x, y } = this.mousePos;
      if (this.isMouseIn()) {
        this.toggle();
      } else if (this.isOpen) {
        for (let i = 0; i < this.items.length; i++) {
          const itemY = this.myY + this.height * (i + 1) + this.dropMenuOffset + i * this.dropMenuGap;
          if (y >= itemY && y <= itemY + this.height) {
            this.select(i);
            break;
          }
        }
      }
    }
  
    isMouseIn() {
      const { x, y } = this.mousePos;
      return x >= this.myX && x <= this.myX + this.width && y >= this.myY && y <= this.myY + this.height;
    }
  
    isMouseInMenu() {
      const { x, y } = this.mousePos;
      if (!this.isOpen) return false; // Only check if the menu is open
  
      // Check if mouse is within the bounds of the menu
      const menuHeight = this.items.length * this.height + (this.items.length - 1) * this.dropMenuGap + 2;
      const menuWidth = this.width + 2;
  
      // Check if the mouse is inside the dropdown menu area
      if (
        x >= this.myX - 1 &&
        x <= this.myX - 1 + menuWidth &&
        y >= this.myY - 1 + this.height + this.dropMenuOffset &&
        y <= this.myY - 1 + this.height + this.dropMenuOffset + menuHeight
      ) {
        return true;
      }
      return false;
    }
  }