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
    node.size = [285, 330];

    if (allow_debug) console.log("node", node);

    // vars
    let a = null;
    let b = null;
    let c = null;
    let compare = false;
    let imagesTracked = [];
    const MAX_IMAGES = 8;

    function pushToImgs(newImage) {
      // Check if image is undefined or null
      if (!newImage || !newImage.naturalWidth) {
        if (allow_debug) console.log("Undefined or null image, skipping");
        return imagesTracked;
      }

      // Check if image already exists in the array
      // if (allow_debug) {
      //   console.log('New image src:', newImage.src);
      //   console.log('Existing imagesTracked src:', imagesTracked.map(img => img.src));
      // }

      const imageExists = imagesTracked.some((img) => {
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
        return imagesTracked;
      }

      imagesTracked.push(newImage);
      // If array exceeds MAX_IMAGES, remove oldest image(s)
      if (imagesTracked.length > MAX_IMAGES) {
        imagesTracked.shift(); // removes first (oldest) element
      }
      if (allow_debug) console.log("imagesTracked list updated, length:", imagesTracked.length);
      return imagesTracked;
    }

    function cycleImgs() {
      if (imagesTracked.length === 1) {
        app.extensionManager.toast.add({
          severity: "info",
          summary: "iTools!",
          detail: "Only this image exist in this node history",
          life: 2000,
        });
        return;
      }

      // Switch to previous imagesTracked if available
      if (node.imgs && imagesTracked.length > 1) {
        node.imgs = imagesTracked; // Show previous image
      }
    }

    function togglingLastTwoImages() {
      if (allow_debug) console.log("imagesTracked", imagesTracked);
      // Only cycle between last two imagesTracked
      if (imagesTracked.length > 1) {
        node.imageIndex = 0;

        // Get current image
        const currentImg = node.imgs[0];

        // Get last two imagesTracked from history
        const lastTwo = imagesTracked.slice(-2);

        // If current is last image, show second to last
        // If current is second to last, show last
        const nextImg = currentImg === lastTwo[1] ? lastTwo[0] : lastTwo[1];

        // Update display
        node.imgs = [nextImg];

        // Update button text with underline using Unicode
        const isShowingCurrent = nextImg === lastTwo[1];
        b.text = isShowingCurrent ? "[Current] | Previous" : "Current | [Previous]";

        if (allow_debug) console.log("Toggling between last two imagesTracked");
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
      c.isActive = compare;
      if (!compare) {
        c.color = c.originalColor;
        c.textColor = c.originalTextColor;
      } else {
        c.color = "#80a1c0";
        c.textColor = "black";
      }
    }

    function showButtons() {
      a.isVisible = true;
      b.isVisible = true;
      c.isVisible = true;
    }

    function createButtons(startVisible = true) {
      a = new SmartButton(75, 8, 55, 20, node, "History");
      a.allowVisualHover = true;
      a.textYoffset = -0;
      a.isVisible = startVisible;
      a.shape = Shapes.ROUND_L;
      a.roundRadius = 5;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = "12px Arial";
      a.onClick = () => {
        if (compare) {
          // cancel compare
          compare = !compare;
          toggleButtonActivation(c, compare);
        }
        if (!node.imgs) {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "iTools!",
            detail: "No images in this node history",
            life: 2000,
          });
          return;
        }
        if (node.imgs.length > 1) {
          togglingLastTwoImages();
        } else {
          cycleImgs();
        }
      };

      b = new SmartButton(75 + 55, 8, 120, 20, node, "[Current] | Previous");
      b.allowVisualHover = true;
      b.textYoffset = -0;
      b.isVisible = startVisible;
      b.shape = Shapes.ROUND_R;
      b.roundRadius = 5;
      b.outlineWidth = 1;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = "12px Arial";
      b.onClick = () => {
        if (compare) {
          // cancel compare
          compare = !compare;
          toggleButtonActivation(c, compare);
        }
        togglingLastTwoImages();
      };

      c = new SmartButton(75 + 55 + 125, 8 + 1, 18, 20, node, "|");
      c.allowVisualHover = true;
      c.textYoffset = -0.05;
      c.isVisible = startVisible;
      c.shape = Shapes.CIRCLE;
      //c.roundRadius = 5;
      c.outlineWidth = 1;
      c.outlineColor = "#656565";
      c.color = "#222222";
      c.activeColor = c.font = "12px Arial";
      c.onClick = () => {
        // reset togglingLastTwoImages
        if (b.text !== "[Current] | Previous") togglingLastTwoImages();

        // start compare
        if (imagesTracked.length <= 1) {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "iTools!",
            detail: "You must execute this node at least twice",
            life: 2000,
          });
          return;
        }
        compare = !compare;
        toggleButtonActivation(c, compare);
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
      if (b.text !== "[Current] | Previous") togglingLastTwoImages();
      node.setDirtyCanvas(true, false);

      setTimeout(() => {
        // push last image
        const lastImage = node.imgs?.at(-1);
        if (!imagesTracked.some((img) => img === lastImage)) {
          pushToImgs(lastImage);
        }

        // Override draw function in ImagePreviewWidget
        const previewWidget = node.widgets.find((widget) => !(widget instanceof BaseSmartWidget));
        if (!previewWidget) {
          if (allow_debug) console.log("ImagePreviewWidget not found");
          return;
        }
        const originalDraw = previewWidget.draw;
        previewWidget.draw = function (ctx, node, widget_width, y, widget_height, ...args) {
          // Call the original draw function first
          originalDraw.apply(this, [ctx, node, widget_width, y, widget_height, ...args]);
          drawImgOverlay(node, widget_width, y, ctx, imagesTracked, compare);
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

// b.text = isShowingCurrent ? "c\u0332u\u0332r\u0332r\u0332e\u0332n\u0332t\u0332 / Previous" : "Current / P\u0332r\u0332e\u0332v\u0332i\u0332o\u0332u\u0332s\u0332";
