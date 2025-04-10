import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidget, BaseSmartWidgetManager, SmartButton, SmartInfo } from "./makadi.js";
import { Shapes } from "./utils.js";

app.registerExtension({
  name: "iTools.compareNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsCompareImage") {
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsCompareImage") {
      return;
    }

    // init size
    node.size = [285, 330];

    // vars
    let a = null;
    let b = null;
    let c = null;
    let o = null;
    let compare = false;
    let imagesOriginal = null;
    let imagesTracked = [];

    async function analyzeImages() {
      if(imagesOriginal === node.imgs) return;
      
      // Wait up to 2s for node.imgs to be defined
      for (let i = 0; i < 20 && !node.imgs; i++) {
        if (allow_debug) console.log("wait..", i);
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!node.imgs) return;

      // Store original
      imagesOriginal = node.imgs;

      let img1 = null;
      let img2 = null;

      const len = node.imgs.length;
      if (len > 2) {
        const half = Math.floor(len / 2);
        img1 = node.imgs[0];
        img2 = node.imgs[half];
      } else if (len === 2) {
        img1 = node.imgs[0];
        img2 = node.imgs[1];
      }

      if (img1 && img2) {
        // Clear old
        imagesTracked = [];
        imagesTracked.push(img2, img1);
      }
    }

    async function togglingImages(imgName) {
      await analyzeImages();
      if (imagesTracked.length > 1) {
        if (imgName === "A") node.imgs = [imagesTracked[1]];
        if (imgName === "B") node.imgs = [imagesTracked[0]];
      }
    }

    function toggleButtonActivation(button) {
      // turn them all off
      const buttons = node.widgets.filter((widget) => widget instanceof SmartButton);
      buttons.forEach((b) => {
        b.isActive = false;
        b.color = b.originalColor;
        b.textColor = b.originalTextColor;
      });

      // activate this one
      if (button.isActive) {
        button.color = button.originalColor;
        button.textColor = button.originalTextColor;
      } else {
        button.color = "#80a1c0";
        button.textColor = "black";
      }
      button.isActive = !button.isActive;
    }

    function createButtons(startVisible = true) {
      const bx = 50;
      const by = 12;
      const r = 25;
      const offset = 30;
      const buttonFont = "14px Arial";

      a = new SmartButton(bx, by, r, 20, node, "A");
      a.allowVisualHover = true;
      a.textYoffset = 1.1;
      a.isVisible = startVisible;
      a.shape = Shapes.CIRCLE;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = buttonFont;
      a.onClick = async () => {
        if (imagesTracked.length === 0) return;
        toggleButtonActivation(a);
        compare = false;
        togglingImages("A");
      };

      b = new SmartButton(bx + offset, by, r, 20, node, "B");
      b.allowVisualHover = true;
      b.textYoffset = 1.1;
      b.isVisible = startVisible;
      b.shape = Shapes.CIRCLE;
      b.outlineWidth = 1;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = buttonFont;
      b.onClick = async () => {
        if (imagesTracked.length === 0) return;
        toggleButtonActivation(b);
        compare = false;
        togglingImages("B");
      };

      c = new SmartButton(bx + offset + offset, by, r, 20, node, "|");
      c.allowVisualHover = true;
      c.textYoffset = -0.05;
      c.isVisible = startVisible;
      c.shape = Shapes.CIRCLE;
      c.outlineWidth = 1;
      c.outlineColor = "#656565";
      c.color = "#222222";
      c.font = buttonFont;
      c.onClick = () => {
        if (imagesTracked.length === 0) return;
        toggleButtonActivation(c);
        initCompare("|");
      };

      o = new SmartButton(bx + offset + offset + offset, by, r, 20, node, "O");
      o.allowVisualHover = true;
      o.textYoffset = 1.1;
      o.isVisible = startVisible;
      o.shape = Shapes.CIRCLE;
      o.outlineWidth = 1;
      o.outlineColor = "#656565";
      o.color = "#222222";
      o.font = buttonFont;
      o.onClick = () => {
        if (imagesTracked.length === 0) return;
        toggleButtonActivation(o);
        initCompare("O");
      };
    }

    createButtons();

    async function initCompare(compareMode) {
      await analyzeImages();
      if (compareMode === "|") {
        node.imgs = [imagesTracked[1]];
        compare = { mode: "|" };
      } else if (compareMode === "O") {
        node.imgs = [imagesTracked[1]];
        compare = { mode: "O" };
      }
    }

    // need thinking 🤔
    function swapHistory() {
      // await analyzeImages();
      node.imageIndex = 0;
      // node.imgs = [imagesTracked[1]];
      // node.setDirtyCanvas(true,false)
    }  

    node.onExecuted = async function (message) {
      // turn compare off
      compare = null;
      // turn all buttons off
      const buttons = node.widgets.filter((widget) => widget instanceof SmartButton);
      buttons.forEach((b) => {
        b.isActive = false;
        b.color = b.originalColor;
        b.textColor = b.originalTextColor;
      });

      await analyzeImages();

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
        compareThem(node, widget_width, y, ctx, imagesTracked, compare);
      };
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(285, newSize[0]);
    };

    node.onMouseEnter = (e) => {
    };

    const m = new BaseSmartWidgetManager(node, "iToolsCompareImage");
  },
});

function compareThem(node, widget_width, y, ctx, _imagesRef, compare) {
  if (!compare || !compare.mode) return;

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
  const mouseY = graphMouse[1] - node.pos[1];

  // Get previous image if available
  const prevImg = _imagesRef.length > 1 ? _imagesRef[_imagesRef.length - 2] : null;

  if (prevImg) {
    if (compare.mode === "|") {
      // Split mode
      const splitX = Math.max(imgX, Math.min(mouseX, imgX + w));
      const splitRatio = (splitX - imgX) / w;
      // Draw left part from img
      // ctx.drawImage(img, 0, 0, img.naturalWidth * splitRatio, img.naturalHeight, imgX, imgY, w * splitRatio, h);
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
    } else if (compare.mode === "O") {
      // Circle mode
      const radius = Math.min(w, h) * 0.15; // 30% of image size
      const centerX = Math.max(imgX + radius, Math.min(mouseX, imgX + w - radius));
      const centerY = Math.max(imgY + radius, Math.min(mouseY, imgY + h - radius));

      // Save the current context
      ctx.save();

      // Create a circular path
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();

      // Clip to the circle
      ctx.clip();

      // Draw the previous image inside the circle
      ctx.drawImage(prevImg, 0, 0, prevImg.naturalWidth, prevImg.naturalHeight, imgX, imgY, w, h);

      // Restore the context to remove the clip
      ctx.restore();
    }
  }
}
