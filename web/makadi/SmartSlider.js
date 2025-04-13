import { SmartWidget } from "./SmartWidget.js";
import { allow_debug } from "../js_shared.js";

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
        this.myX + ((this.value - this.minValue) / (this.maxValue - this.minValue)) * (this.width - this.handleWidth);
      this.handleY = this.myY + (this.height - this.handleHeight) / 2;
  
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
        this.handleX = Math.max(this.myX, Math.min(x - this.handleWidth / 2, this.myX + this.width - this.handleWidth));
        this.value =
          this.minValue + ((this.handleX - this.myX) / (this.width - this.handleWidth)) * (this.maxValue - this.minValue);
  
        if (this.onValueChange) {
          this.onValueChange(this.value);
        }
      }
    }
  
    callMove(v) {
      this.handleX = v;
      this.value = v;
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
        x >= this.myX &&
        x <= this.myX + this.width &&
        y >= this.myY + (this.height - this.trackHeight) / 2 &&
        y <= this.myY + (this.height + this.trackHeight) / 2
      );
    }
  
    draw(ctx) {
      const trackY = this.myY + (this.handleHeight - this.height) / 2;
  
      // Draw the track
      //ctx.fillStyle = this.trackColor;
      //ctx.fillRect(this.myX, trackY, this.width, this.height);
      ctx.fillStyle = this.trackColor;
      ctx.beginPath();
      ctx.roundRect(this.myX, trackY, this.width, this.height, 5);
      ctx.fill();
  
      // Calculate handle position correctly
      const handleX =
        this.myX + ((this.value - this.minValue) / (this.maxValue - this.minValue)) * (this.width - this.handleWidth);
  
      // Draw the progress
      if (this.isProgressBar) {
        const progressWidth = ((this.value - this.minValue) / (this.maxValue - this.minValue)) * this.width;
        ctx.fillStyle = this.handleColor; // You can change this to any color for the progress
        ctx.beginPath();
        ctx.roundRect(this.myX, trackY, progressWidth, this.height, 5);
        ctx.fill();
      } else {
        // Draw the handle
        ctx.fillStyle = this.handleColor;
        ctx.beginPath();
        ctx.roundRect(handleX, this.myY, this.handleWidth, this.handleHeight, 5);
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
          this.myX + this.width / 2,
          this.myY + this.height / 2 + this.textYoffset
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
        this.myX + this.width / 2,
        this.myY + this.height / 2 + this.textYoffset
      );
    }
  }