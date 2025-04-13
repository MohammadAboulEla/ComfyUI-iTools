import { BaseSmartWidget } from "./BaseSmartWidget.js";
import { allow_debug } from "../js_shared.js";

export class BaseDraggableRotatableWidget extends BaseSmartWidget {
    constructor(node) {
        super(node);

        this.isPicked = false;
        this.isResizing = false;
        this.resizeAnchor = null;
        this.resizeThreshold = 10;

        this.rotateThreshold = 15;
        this.rotateDrawMargin = this.rotateThreshold - 2.5;
        this.rotationAngle = 0;
        this.initialRotationAngle = 0;
        this.isRotating = false;
        this.rotationCenter = { x: 0, y: 0 };
    }

    // Check if mouse is in the rotated area
    isMouseInRotatedArea() {
        const { x: mouseX, y: mouseY } = this.mousePos;
        const threshold = this.rotateThreshold;
        const margin = this.rotateDrawMargin - 5;

        const dx = mouseX - (this.x + this.width / 2);
        const dy = mouseY - (this.y + this.height / 2);

        const radianAngle = -(this.rotationAngle * Math.PI) / 180;
        const cosA = Math.cos(radianAngle);
        const sinA = Math.sin(radianAngle);

        const rotatedX = dx * cosA - dy * sinA;
        const rotatedY = dx * sinA + dy * cosA;

        const rx = rotatedX + this.width / 2;
        const ry = rotatedY + this.height / 2;

        const topLeft = rx >= margin && rx <= margin + threshold && ry >= margin && ry <= margin + threshold;
        const topRight = rx >= this.width - margin - threshold && rx <= this.width - margin && ry >= margin && ry <= margin + threshold;
        const bottomLeft = rx >= margin && rx <= margin + threshold && ry >= this.height - margin - threshold && ry <= this.height - margin;
        const bottomRight = rx >= this.width - margin - threshold && rx <= this.width - margin && ry >= this.height - margin - threshold && ry <= this.height - margin;

        return topLeft || topRight || bottomLeft || bottomRight;
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
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const dx = this.mousePos.x - centerX;
            const dy = this.mousePos.y - centerY;

            const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

            const startDx = this.rotationStartPos.x - this.rotationCenter.x;
            const startDy = this.rotationStartPos.y - this.rotationCenter.y;
            const startAngle = Math.atan2(startDy, startDx) * (180 / Math.PI);

            this.rotationAngle = (this.initialRotationAngle + (currentAngle - startAngle)) % 360;

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

    // Handles the image resize
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

    // Determines if mouse is in the resize area
    isMouseInResizeArea() {
      const { x: mouseX, y: mouseY } = this.mousePos;
      const threshold = this.resizeThreshold;

      const dx = mouseX - (this.x + this.width / 2);
      const dy = mouseY - (this.y + this.height / 2);

      const radianAngle = -(this.rotationAngle * Math.PI) / 180;
      const cosA = Math.cos(radianAngle);
      const sinA = Math.sin(radianAngle);

      const rotatedX = dx * cosA - dy * sinA;
      const rotatedY = dx * sinA + dy * cosA;

      const rx = rotatedX + this.width / 2;
      const ry = rotatedY + this.height / 2;

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

    // Returns the correct resize anchor
    getResizeAnchor() {
      const { x: mouseX, y: mouseY } = this.mousePos;
      const threshold = this.resizeThreshold;

      const dx = mouseX - (this.x + this.width / 2);
      const dy = mouseY - (this.y + this.height / 2);

      const radianAngle = -(this.rotationAngle * Math.PI) / 180;
      const cosA = Math.cos(radianAngle);
      const sinA = Math.sin(radianAngle);

      const rotatedX = dx * cosA - dy * sinA;
      const rotatedY = dx * sinA + dy * cosA;

      const rx = rotatedX + this.width / 2;
      const ry = rotatedY + this.height / 2;

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

      return null;
    }

    // Handles drag event
    handleDrag() {
        if (this.isMouseInResizeArea()) {
            const dir = this.getResizeAnchor();
            const cursorMap = {
                'bottom-right': 'se-resize',
                'bottom': 's-resize',
                'bottom-left': 'sw-resize',
                'top-right': 'ne-resize',
                'top': 'n-resize',
                'top-left': 'nw-resize',
                'right': 'e-resize',
                'left': 'w-resize',
            };
            app.canvas.canvas.style.cursor = cursorMap[dir] || 'default';
        } else if (this.isMouseInRotatedArea()) {
            app.canvas.canvas.style.cursor = 'grabbing';
        } else {
            app.canvas.canvas.style.cursor = 'default'; // Reset cursor
        }
    }

    // Common logic for handling mouse down
    handleDown() {
        if (this.isUnderCover) return;

        if (this.closeButton && this.isMouseInCloseButtonArea()) {
            this.markDelete = true;
            if (this.onImgClosed) this.onImgClosed();
            return;
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

    // Common logic for handling mouse move
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

            this.x = Math.max(canvasX, Math.min(newX, canvasX + width));
            this.y = Math.max(canvasY, Math.min(newY, canvasY + height));
        }
    }

    // Common logic for handling mouse click
    handleClick() {
        this.isPicked = false;
        this.isResizing = false;
        this.resizeAnchor = null;
        this.handleRotateEnd();
    }
}