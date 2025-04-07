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

    if (allow_debug) console.log("node", node);

    // vars
    let a = null;
    let b = null;
    let c = null;
    let compare = false;
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
      compare = false;
      if (allow_debug) console.log("compare", compare);
      // Switch to previous images if available
      if (node.imgs && images.length > 1) {
        node.imgs = images; // Show previous image
      }
    }

    function showPrev() {
      // Only cycle between last two images
      if (images.length > 1) {
        node.imageIndex = 0;

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
      c.isVisible = true;
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

      c = new SmartButton(80 + 55 + 125, 8+1, 18, 20, node, "|");
      c.allowVisualHover = true;
      c.textYoffset = -0.05;
      c.isVisible = false;
      c.shape = Shapes.CIRCLE;
      //c.roundRadius = 5;
      c.outlineWidth = 1;
      c.outlineColor = "#656565";
      c.color = "#222222";
      c.activeColor = c.font = "12px Arial";
      c.onClick = () => {
        compare = !compare;
        if (b.text !== "[Current] | Previous") showPrev();
        c.color === "#80a1c0" ? (c.color = c.originalColor) : (c.color = "#80a1c0");
        c.textColor === "black" ? (c.textColor = c.originalTextColor) : (c.textColor = "black");
        c.isActive = compare;
      };
    }

    createButtons();

    node.onExecuted = async function (message) {
      while (!node.imgs) {
        if (allow_debug) console.log("wait..");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      showButtons();
      node.setDirtyCanvas(true, false);
      setTimeout(() => {
        if (allow_debug) console.log("node.widgets[3].draw", node.widgets[3].draw);
        // override
        const originalDraw = node.widgets[3].draw;
        node.widgets[3].draw = function (ctx, node, widget_width, y, widget_height, ...args) {
          // Call the original draw function first
          originalDraw.apply(this, [ctx, node, widget_width, y, widget_height, ...args]);
          drawImgOverlay(node, widget_width, y, ctx, images, compare);
        };
        // push last image
        const lastImage = node.imgs?.at(-1);
        if (!images.some((img) => img === lastImage)) {
          pushToImgs(lastImage);
        }
      }, 250);
    };

    node.onResize = function (newSize) {
      node.size[0] = Math.max(280, newSize[0]);
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

function drawImgOverlay(node, widget_width, y, ctx, images, compareMode = false) {
  if(!compareMode) return;

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
  const prevImg = images.length > 1 ? images[images.length - 2] : null;

  if (prevImg && compareMode) {
    // Draw left part from img
    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth * splitRatio,
      img.naturalHeight,
      imgX,
      imgY,
      w * splitRatio,
      h
    );
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

// b.text = isShowingCurrent ? "C\u0332u\u0332r\u0332r\u0332e\u0332n\u0332t\u0332 / Previous" : "Current / P\u0332r\u0332e\u0332v\u0332i\u0332o\u0332u\u0332s\u0332";
