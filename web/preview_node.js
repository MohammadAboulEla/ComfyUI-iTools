import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidget, BaseSmartWidgetManager } from "./makadi/BaseSmartWidget.js";
import { SmartButton } from "./makadi/SmartButton.js";
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
    node.size = [350, 350];

    if (allow_debug) console.log("node", node);

    // vars
    let a = null;
    let b = null;
    let c = null;
    let compare = false;
    let imgsBeforeCompare = null;
    let imagesTracked = [];
    const MAX_IMAGES = 8;

    let mouse = {
      mouseInNode: false,
      x: 0,
      y: 0,
    };

    // other vars
    let toastShownCountH = 0;
    let toastShownCountPC = 0;
    let toastShownCountI = 0;
    const MAX_TOAST_SHOWS = 2;

    function pushToImgs(newImage) {
      // Check if image is undefined or null
      if (!newImage || !newImage.naturalWidth) {
        if (allow_debug) console.log("Undefined or null image, skipping");
        return imagesTracked;
      }

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
        if (toastShownCountPC < MAX_TOAST_SHOWS) {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "iTools!",
            detail: "You must execute this node at least twice",
            life: 2000,
          });
          toastShownCountPC++;
        }
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
      // c.isVisible = true;
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
          applyCompareState();
          toggleButtonActivation(c, compare);
        }
        if (!node.imgs) {
          if (toastShownCountH < MAX_TOAST_SHOWS) {
            app.extensionManager.toast.add({
              severity: "info",
              summary: "iTools!",
              detail: "No images in this node history",
              life: 2000,
            });
            toastShownCountH++;
          }
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
          applyCompareState();
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
          if (toastShownCountI < MAX_TOAST_SHOWS) {
            app.extensionManager.toast.add({
              severity: "info",
              summary: "iTools!",
              detail: "You must execute this node at least twice",
              life: 2000,
            });
            toastShownCountI++;
          }
          return;
        }
        compare = !compare;
        applyCompareState();
        toggleButtonActivation(c, compare);
      };
    }

    // iToolsPreviewImage gets one image per run, while iToolsCompareImage gets two.
    // Feeding node.imgs the last two tracked images puts this node in the same
    // two-image preview state compare_node draws from.
    function applyCompareState() {
      if (compare) {
        const lastTwo = imagesTracked.slice(-2);
        imgsBeforeCompare = node.imgs;
        node.imgs = [lastTwo[0], lastTwo[1]]; // A = previous, B = current
        node.imageIndex = null; // multi image view, same as compare node
      } else {
        node.imgs = imgsBeforeCompare || [imagesTracked.at(-1)];
        node.imageIndex = 0;
        imgsBeforeCompare = null;
      }
      patchPreviewWidget(); // widget may already be swapped by the assignment above
      node.setDirtyCanvas(true, true);
    }

    // Patches the image preview widget draw. Re-applied on demand because
    // assigning node.imgs makes the frontend rebuild the widget, dropping the patch.
    function patchPreviewWidget() {
      // ImagePreviewWidget is added by the frontend under this name
      const previewWidget =
        node.widgets?.find((widget) => widget.name === "$$canvas-image-preview") ||
        node.widgets?.find((widget) => !(widget instanceof BaseSmartWidget) && widget.drawWidget);
      if (!previewWidget) return;

      const comparing = () => compare && node.imgs?.length > 1;

      // The canvas uses widget.draw when it exists, otherwise widget.drawWidget,
      // so both entry points need the override
      // Only wrap draw if the widget already has one, adding it would change dispatch
      if (typeof previewWidget.draw === "function" && previewWidget.draw !== previewWidget._itoolsDrawWrapper) {
        const originalDraw = previewWidget.draw;
        const drawWrapper = function (ctx, node, widget_width, y, widget_height, lowQuality) {
          if (comparing()) {
            drawImgOverlay(mouse, node, widget_width, y, ctx, compare);
            return;
          }
          originalDraw.call(this, ctx, node, widget_width, y, widget_height, lowQuality);
        };
        previewWidget._itoolsDrawWrapper = drawWrapper;
        previewWidget.draw = drawWrapper;
      }

      if (previewWidget.drawWidget !== previewWidget._itoolsDrawWidgetWrapper) {
        const originalDrawWidget = previewWidget.drawWidget;
        const drawWidgetWrapper = function (ctx, options) {
          if (comparing()) {
            drawImgOverlay(mouse, node, options?.width ?? node.size[0], this.y, ctx, compare);
            return;
          }
          originalDrawWidget?.call(this, ctx, options);
        };
        previewWidget._itoolsDrawWidgetWrapper = drawWidgetWrapper;
        previewWidget.drawWidget = drawWidgetWrapper;
      }
    }

    // Canvas level hook, same approach as BaseSmartWidget: runs every frame so the
    // patch is re-applied as soon as the frontend rebuilds the preview widget
    const origCanvasDrawForeground = app.canvas.onDrawForeground;
    app.canvas.onDrawForeground = (ctx) => {
      if (origCanvasDrawForeground) origCanvasDrawForeground.call(app.canvas, ctx);
      if (node.graph) patchPreviewWidget();
    };

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

        // Keep comparing against the freshly generated image
        if (compare) applyCompareState();

        // Override draw function in ImagePreviewWidget
        patchPreviewWidget();
      }, 300);
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(285, newSize[0]);
      // if (allow_debug) console.log("Node", node);
    };

    const m = new BaseSmartWidgetManager(node, "iToolsPreviewImage");
    const origOnRemoved = node.onRemoved;
    node.onRemoved = function () {
      origOnRemoved?.apply(this, arguments);
      m.destroy();
    };

    node.onMouseEnter = (e) => {
      if(allow_debug) console.log('node.y',node.y);
      mouse.mouseInNode = true;
    };

    node.onMouseLeave = (e) => {

      mouse.mouseInNode = false;
    };

    node.onMouseMove = (e, pos) => {
      if (mouse.mouseInNode) {
        const graphMouse = app.canvas.graph_mouse;
        mouse.x = graphMouse[0] - node.pos[0];
        mouse.y = graphMouse[1] - node.pos[1];
      }
    };
  },
  
});

const compareWay = app.extensionManager.setting.get("iTools.Nodes.Compare Mode", "makadi");
function drawImgOverlay(mouse, node, widget_width, y, ctx, compareMode = false) {
  if (!compareMode || !node.imgs || node.imgs.length < 2) return;
  y = y ? y : 0; // Ensure y is defined

  const img1 = node.imgs[0]; // previous
  const img2 = node.imgs[1]; // current
  if (!img1 || !img2) {
    if (allow_debug) console.log("No previous image to compare with");
    return;
  }

  const dw = widget_width;
  const dh = node.size[1] - y;

  // Force both images to the same height (dh), scaling down if too wide
  const getParams = (img) => {
    const scale = dh / img.naturalHeight;
    const w = img.naturalWidth * scale;
    const finalScale = w > dw ? dw / w : 1;

    const finalW = w * finalScale;
    const finalH = dh * finalScale;

    return {
      x: (dw - finalW) / 2,
      y: y + (dh - finalH) / 2,
      w: finalW,
      h: finalH,
    };
  };

  const p1 = getParams(img1);
  const p2 = getParams(img2);

  // Shared interaction bounds (the container area)
  const viewW = Math.max(p1.w, p2.w);
  const imgX = (dw - viewW) / 2;

  let mouseX;
  if (compareWay === "makadi") {
    const graphMouse = app.canvas.graph_mouse;
    mouseX = graphMouse[0] - node.pos[0];
  } else {
    mouseX = mouse.mouseInNode ? mouse.x : dw / 2;
  }

  const splitX = Math.max(imgX, Math.min(mouseX, imgX + viewW));

  const left = compareWay === "makadi" ? { img: img1, p: p1 } : { img: img2, p: p2 };
  const right = compareWay === "makadi" ? { img: img2, p: p2 } : { img: img1, p: p1 };

  // Draw Left Side
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, splitX, dh);
  ctx.clip();
  ctx.drawImage(left.img, left.p.x, left.p.y, left.p.w, left.p.h);
  ctx.restore();

  // Draw Right Side
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, y, dw - splitX, dh);
  ctx.clip();
  ctx.drawImage(right.img, right.p.x, right.p.y, right.p.w, right.p.h);
  ctx.restore();
}