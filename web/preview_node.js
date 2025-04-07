import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { SmartButton } from "./makadi.js";
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

    // while (node.graph === null) {
    //   await new Promise((resolve) => setTimeout(resolve, 5000));
    // }

    // vars
    let a = null;
    let b = null;
    let images = [];
    const MAX_IMAGES = 8;

    function pushToImgs(newImage) {
      // Check if image is undefined or null
      if (!newImage || !newImage.naturalWidth) {
        if (allow_debug) console.log("Undefined or null image, skipping");
        return images;
      }
      images.push(newImage);
      // If array exceeds MAX_IMAGES, remove oldest image(s)
      if (images.length > MAX_IMAGES) {
        images.shift(); // removes first (oldest) element
      }
      if (allow_debug) console.log("Images list updated, length:", images.length);
      return images;
    }

    function cycleImgs() {
      // Switch to previous images if available
      if (node.imgs && images.length > 1) {
        node.imgs = images; // Show previous image
      }
    }

    function showPrev() {
      // Only cycle between last two images
      if (images.length > 1) {
        node.imageIndex = 0
        
        // Get current image
        const currentImg = node.imgs[0];

        // Get last two images from history
        const lastTwo = images.slice(-2);

        // If current is last image, show second to last
        // If current is second to last, show last
        const nextImg = currentImg === lastTwo[1] ? lastTwo[0] : lastTwo[1];
        
        // Update display
        node.imgs = [nextImg];

        // Update button text with underline using Unicode
        const isShowingCurrent = nextImg === lastTwo[1];
        b.text = isShowingCurrent ? "[Current] | Previous" : "Current | [Previous]";

        if (allow_debug) console.log("Toggling between last two images");
      }
    }

    function showButtons() {
      a.isVisible = true;
      b.isVisible = true;
    }

    function createButtons() {
      a = new SmartButton(80, 8, 55, 20, node, "History");
      a.allowVisualHover = true;
      a.textYoffset = -0;
      a.isVisible = false;
      a.shape = Shapes.ROUND_L;
      a.roundRadius = 5;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = "12px Arial";
      a.onClick = () => cycleImgs();

      b = new SmartButton(80 + 55, 8, 120, 20, node, "[Current] | Previous");
      b.allowVisualHover = true;
      b.textYoffset = -0;
      b.isVisible = false;
      b.shape = Shapes.ROUND_R;
      b.roundRadius = 5;
      b.outlineWidth = 1;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = "12px Arial";
      b.onClick = () => showPrev();
    }

    createButtons();

    node.onExecuted = async function (message) {
      if (allow_debug) console.log("node", node);
      while (!node.imgs) {
        if (allow_debug) console.log("wait..");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      node.widgets[2].computedHeight = 26;
      showButtons();
      node.setDirtyCanvas(true, false);
      setTimeout(() => {
        const lastImage = node.imgs?.at(-1);
        if (!images.some((img) => img === lastImage)) {
          pushToImgs(lastImage);
        }
      }, 300);
    };

    node.onResize = function (newSize) {
      node.size[0] = Math.max(280, newSize[0]);
      if (allow_debug) console.log("newSize", newSize);
    };

    // Store the original onMouseDown handler
    const originalOnMouseDown = app.canvas.onMouseDown;
    app.canvas.onMouseDown = (e) => {
      // Call original handler if it exists
      if (originalOnMouseDown) {
        originalOnMouseDown.call(app.canvas, e);
      }
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsPreviewImage") {
          n.widgets.forEach((w) => {
            w.handleDown?.(e);
          });
        }
      });
    };

    // Store the original onDrawForeground handler
    const originalOnDrawForeground = app.canvas.onDrawForeground;
    app.canvas.onDrawForeground = (ctx) => {
      // Call original handler if it exists
      if (originalOnDrawForeground) {
        originalOnDrawForeground.call(app.canvas, ctx);
      }
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsPreviewImage") {
          n.widgets.forEach((w) => {
            w.handleMove?.(ctx);
          });
        }
      });
    };

    // Store the original onclick handler
    const originalOnClick = app.canvas.canvas.onclick;
    app.canvas.canvas.onclick = (e) => {
      // Call original handler if it exists
      if (originalOnClick) {
        originalOnClick.call(app.canvas.canvas, e);
      }
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsPreviewImage") {
          n.widgets.forEach((w) => {
            w.handleClick?.(e);
          });
        }
      });
    };
  },
});
// b.text = isShowingCurrent ? "C\u0332u\u0332r\u0332r\u0332e\u0332n\u0332t\u0332 / Previous" : "Current / P\u0332r\u0332e\u0332v\u0332i\u0332o\u0332u\u0332s\u0332";
