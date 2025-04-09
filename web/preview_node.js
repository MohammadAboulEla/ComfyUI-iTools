import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidget, BaseSmartWidgetManager, SmartButton, SmartInfo } from "./makadi.js";
import { Shapes } from "./utils.js";

app.registerExtension({
  name: "iTools.previewNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsPreviewImage") {
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPreviewImage") {
      return;
    }

    // init size
    node.size = [280, 330];

    if (allow_debug) console.log("node", node);

    // vars
    node.a = null;
    node.b = null;
    node.c = null;
    node.compare = false;
    node.imagesTracked = [];
    const MAX_IMAGES = 8;

    function pushToImgs(newImage) {
      // Check if image is undefined or null
      if (!newImage || !newImage.naturalWidth) {
        if (allow_debug) console.log("Undefined or null image, skipping");
        return node.imagesTracked;
      }

      // Check if image already exists in the array
      // if (allow_debug) {
      //   console.log('New image src:', newImage.src);
      //   console.log('Existing node.imagesTracked src:', node.imagesTracked.map(img => img.src));
      // }

      const imageExists = node.imagesTracked.some((img) => {
        // Extract filename from URLs by removing the random parameter
        const getFilename = (url) => {
          if (!url) return "";
          const match = url.match(/filename=([^&]+)/);
          return match ? match[1] : "";
        };

        const newImageFilename = getFilename(newImage.src);
        const existingImageFilename = getFilename(img.src);

        return newImageFilename === existingImageFilename;
      });

      if (imageExists) {
        if (allow_debug) console.log("Image already exists, skipping");
        return node.imagesTracked;
      }

      node.imagesTracked.push(newImage);
      // If array exceeds MAX_IMAGES, remove oldest image(s)
      if (node.imagesTracked.length > MAX_IMAGES) {
        node.imagesTracked.shift(); // removes first (oldest) element
      }
      if (allow_debug) console.log("node.imagesTracked list updated, length:", node.imagesTracked.length);
      if(allow_debug) console.log('node.imagesTracked',node.imagesTracked);
      return node.imagesTracked;
    }

    function cycleImgs() {
      // Switch to previous node.imagesTracked if available
      if (node.imgs && node.imagesTracked.length > 1) {
        node.imgs = node.imagesTracked; // Show previous image
      }else{
        app.extensionManager.toast.add({
          severity: "info",
          summary: "iTools!",
          detail: "No images in this node history",
          life: 2000,
        });
      }
    }

    function togglingLastTwoImages() {
      if(allow_debug) console.log('node.imagesTracked',node.imagesTracked);
      // Only cycle between last two node.imagesTracked
      if (node.imagesTracked.length > 1) {
        node.imageIndex = 0;

        // Get current image
        const currentImg = node.imgs[0];

        // Get last two node.imagesTracked from history
        const lastTwo = node.imagesTracked.slice(-2);

        // If current is last image, show second to last
        // If current is second to last, show last
        const nextImg = currentImg === lastTwo[1] ? lastTwo[0] : lastTwo[1];

        // Update display
        node.imgs = [nextImg];

        // Update button text with underline using Unicode
        const isShowingCurrent = nextImg === lastTwo[1];
        node.b.text = isShowingCurrent ? "[Current] | Previous" : "Current | [Previous]";

        if (allow_debug) console.log("Toggling between last two node.imagesTracked");
      } else {
        app.extensionManager.toast.add({
          severity: "info",
          summary: "iTools!",
          detail: "You must execute this node at least twice",
          life: 2000,
        });
      }
    }

    function toggleButtonActivation() {
      node.c.isActive = node.compare;
      if (!node.compare) {
        node.c.color = node.c.originalColor;
        node.c.textColor = node.c.originalTextColor;
      } else {
        node.c.color = "#80a1c0";
        node.c.textColor = "black";
      }
    }

    function showButtons() {
      node.a.isVisible = true;
      node.b.isVisible = true;
      node.c.isVisible = true;
    }

    function createButtons(startVisible= false) {
      node.a = new SmartButton(80, 8, 55, 20, node, "History");
      node.a.allowVisualHover = true;
      node.a.textYoffset = -0;
      node.a.isVisible = startVisible;
      node.a.shape = Shapes.ROUND_L;
      node.a.roundRadius = 5;
      node.a.outlineWidth = 1;
      node.a.outlineColor = "#656565";
      node.a.color = "#222222";
      node.a.font = "12px Arial";
      node.a.onClick = () => {
        if (node.compare) {
          // cancel node.compare
          node.compare = !node.compare;
          toggleButtonActivation(node.c, node.compare);
        }
        if (node.imgs.length > 1) {
          togglingLastTwoImages();
        } else {
          cycleImgs();
        }
      };

      node.b = new SmartButton(80 + 55, 8, 120, 20, node, "[Current] | Previous");
      node.b.allowVisualHover = true;
      node.b.textYoffset = -0;
      node.b.isVisible = startVisible;
      node.b.shape = Shapes.ROUND_R;
      node.b.roundRadius = 5;
      node.b.outlineWidth = 1;
      node.b.outlineColor = "#656565";
      node.b.color = "#222222";
      node.b.font = "12px Arial";
      node.b.onClick = () => {
        if (node.compare) {
          // cancel node.compare
          node.compare = !node.compare;
          toggleButtonActivation(node.c, node.compare);
        }
        togglingLastTwoImages();
      };

      node.c = new SmartButton(80 + 55 + 125, 8 + 1, 18, 20, node, "|");
      node.c.allowVisualHover = true;
      node.c.textYoffset = -0.05;
      node.c.isVisible = startVisible;
      node.c.shape = Shapes.CIRCLE;
      //node.c.roundRadius = 5;
      node.c.outlineWidth = 1;
      node.c.outlineColor = "#656565";
      node.c.color = "#222222";
      node.c.activeColor = node.c.font = "12px Arial";
      node.c.onClick = () => {
        // reset togglingLastTwoImages
        if (node.b.text !== "[Current] | Previous") togglingLastTwoImages();

        // start node.compare
        if (node.imagesTracked.length <= 1) {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "iTools!",
            detail: "You must execute this node at least twice",
            life: 2000,
          });
          return;
        }
        node.compare = !node.compare;
        toggleButtonActivation(node.c, node.compare);
      };
    }

    createButtons();

    node.onExecuted = async function (message) {
      
      // Wait for image to be loaded
      for (let i = 0; i < 20 && !node.imgs; i++) {
        if (allow_debug) console.log("wait..", i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!node.imgs) return;
      
      showButtons();

      // Reset togglingLastTwoImages
      if (node.b.text !== "[Current] | Previous") togglingLastTwoImages();
      node.setDirtyCanvas(true, false);

      setTimeout(() => {
        // push last image
        const lastImage = node.imgs?.at(-1);
        if (!node.imagesTracked.some((img) => img === lastImage)) {
          pushToImgs(lastImage);
        }

        // Override draw function in ImagePreviewWidget
        const previewWidget = node.widgets.find(widget => !(widget instanceof BaseSmartWidget));
        if (!previewWidget) {
          if (allow_debug) console.log("ImagePreviewWidget not found");
          return;
        }
        const originalDraw = previewWidget.draw;
        previewWidget.draw = function (ctx, node, widget_width, y, widget_height, ...args) {
          // Call the original draw function first
          originalDraw.apply(this, [ctx, node, widget_width, y, widget_height, ...args]);
          drawImgOverlay(node, widget_width, y, ctx, node.imagesTracked, node.compare);
        };
      }, 300);
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(285, newSize[0]);
    };

    const m = new BaseSmartWidgetManager(node, "iToolsPreviewImage");

  },
});

function drawImgOverlay(node, widget_width, y, ctx, _imagesRef, compareMode = false) {
  if (!compareMode) return;

  const img = node.imgs[0];
  const dw = widget_width;
  const dh = node.size[1] - y;
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  const scaleX = dw / w;
  const scaleY = dh / h;
  const scale = Math.min(scaleX, scaleY, 1);

  w *= scale;
  h *= scale;

  // Centered position within the widget
  const imgX = (dw - w) / 2;
  const imgY = (dh - h) / 2 + y; // +y to offset within canvas

  const graphMouse = app.canvas.graph_mouse;
  const mouseX = graphMouse[0] - node.pos[0];
  const splitX = Math.max(imgX, Math.min(mouseX, imgX + w));
  const splitRatio = (splitX - imgX) / w;

  // Get previous image if available
  const prevImg = _imagesRef.length > 1 ? _imagesRef[_imagesRef.length - 2] : null;

  if (prevImg && compareMode) {
    // Draw left part from img
    // Not needed use original draw instead ===>// ctx.drawImage(img, 0, 0, img.naturalWidth * splitRatio, img.naturalHeight, imgX, imgY, w * splitRatio, h);
    // Draw right part from prevImg
    ctx.drawImage(
      prevImg,
      prevImg.naturalWidth * splitRatio,
      0,
      prevImg.naturalWidth * (1 - splitRatio),
      prevImg.naturalHeight,
      imgX + w * splitRatio,
      imgY,
      w * (1 - splitRatio),
      h
    );
  }
}

// node.b.text = isShowingCurrent ? "node.c\u0332u\u0332r\u0332r\u0332e\u0332n\u0332t\u0332 / Previous" : "Current / P\u0332r\u0332e\u0332v\u0332i\u0332o\u0332u\u0332s\u0332";
