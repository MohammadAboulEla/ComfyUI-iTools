import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { Shapes } from "./utils.js";
import { BaseSmartWidget, BaseSmartWidgetManager,} from "./makadi/BaseSmartWidget.js";
import { SmartButton } from "./makadi/SmartButton.js";

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

    let compare = null;
    let mouse = {
      mouseInNode: false,
      x: 0,
      y: 0,
    };
    

    function turnAllButtonsOff() {
      const buttons = node.widgets.filter((widget) => widget instanceof SmartButton);
      buttons.forEach((b) => {
        b.isActive = false;
        b.color = b.originalColor;
        b.textColor = b.originalTextColor;
      });
    }

    function toggleButtonActivation(button) {
      // turn them all off
      turnAllButtonsOff();
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

      const a = new SmartButton(bx, by, r, 20, node, "A");
      a.allowVisualHover = true;
      a.textYoffset = 1.1;
      a.isVisible = startVisible;
      a.shape = Shapes.CIRCLE;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = buttonFont;
      a.onClick = async () => {
        toggleButtonActivation(a);
        initCompare("A");
      };

      const b = new SmartButton(bx + offset, by, r, 20, node, "B");
      b.allowVisualHover = true;
      b.textYoffset = 1.1;
      b.isVisible = startVisible;
      b.shape = Shapes.CIRCLE;
      b.outlineWidth = 1;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = buttonFont;
      b.onClick = async () => {
        toggleButtonActivation(b);
        initCompare("B");
      };

      const c = new SmartButton(bx + 2 * offset, by, r, 20, node, "|");
      c.allowVisualHover = true;
      c.textYoffset = -0.05;
      c.isVisible = startVisible;
      c.shape = Shapes.CIRCLE;
      c.outlineWidth = 1;
      c.outlineColor = "#656565";
      c.color = "#222222";
      c.font = buttonFont;
      c.onClick = () => {
        toggleButtonActivation(c);
        initCompare("|");
      };

      const o = new SmartButton(bx + 3 * offset, by, r, 20, node, "O");
      o.allowVisualHover = true;
      o.textYoffset = 1.1;
      o.isVisible = startVisible;
      o.shape = Shapes.CIRCLE;
      o.outlineWidth = 1;
      o.outlineColor = "#656565";
      o.color = "#222222";
      o.font = buttonFont;
      o.onClick = () => {
        toggleButtonActivation(o);
        initCompare("O");
      };
    }

    createButtons();

    async function initCompare(compareMode) {
      if (compareMode === "|") {
        compare = { mode: "|" };
      } else if (compareMode === "O") {
        compare = { mode: "O" };
      } else if (compareMode === "A") {
        compare = { mode: "A" };
      } else if (compareMode === "B") {
        compare = { mode: "B" };
      }
    }

    node.onExecuted = async function (message) {
      // await for !node.imgs
      for (let i = 0; i < 30 && !node.imgs; i++) {
        if (allow_debug) console.log("wait...", i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // await for ImagePreviewWidget
      const previewWidget = node.widgets.find((widget) => !(widget instanceof BaseSmartWidget));
      for (let i = 0; i < 30 && !previewWidget; i++) {
        if (allow_debug) console.log("wait...", i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!previewWidget) {
        if (allow_debug) console.log("ImagePreviewWidget not found");
        return;
      }

      // Override draw function in ImagePreviewWidget
      const originalDraw = previewWidget.draw;
      previewWidget.draw = function (ctx, node, widget_width, y, widget_height, ...args) {
        // originalDraw.apply(this, [ctx, node, widget_width, y, widget_height, ...args]);
        overrideDraw(node, widget_width, y, ctx, compare, mouse);
      };

      // if no compare mode use default
      if (!compare && node.imgs) {
        compare = { mode: "|" };
        const cB = node.widgets.find((widget) => widget.text === "|");
        toggleButtonActivation(cB);
      }
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(285, newSize[0]);
    };

    const originalClick = app.canvas.canvas.onclick;
    app.canvas.canvas.onclick = (e) => {
      if (originalClick) {
        originalClick.call(app.canvas.canvas, e);
      }
    };

    // not ready yet 🤔
    async function swapO(originalOrder) {
      // await new Promise((resolve) => setTimeout(resolve, 200));
      if (compare && compare.mode === "O" && node.imgs && node.imgs.length > 1) {
        // Swap the first two images
        [node.imgs[0], node.imgs[1]] = [node.imgs[1], node.imgs[0]];
        // Force canvas redraw
        node.setDirtyCanvas(true, false);
      } else {
        // Restore original order
        node.imgs = originalOrder;
        node.setDirtyCanvas(true, false);
      }
    }

    // not ready yet
    function cycleZoom() {
      if (compare.mode === "|" && node.imgs && node.imgs.length > 1) {
        // cycle through all zooming steps
        node.setDirtyCanvas(true, false);
      }
    }

    node.onMouseEnter = (e) => {
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

    const originalMenuOptions = node.getExtraMenuOptions;
    node.getExtraMenuOptions = function (_, options) {
      if (originalMenuOptions) {
        originalMenuOptions.call(node, _, options);
      }
      if (node.imgs) {
        // If node node has images then we add an open in new tab item
        let img = null;

        if (compare.mode === "A") {
          img = node.imgs[0];
        } else if (compare.mode === "B") {
          img = node.imgs[1];
        }

        if (img) {
          options.unshift(
            {
              content: "Open Image",
              callback: () => {
                const url = new URL(img.src);
                url.searchParams.delete("preview");
                window.open(url, "_blank");
              },
            },
            ...getCopyImageOption(img),
            {
              content: "Save Image",
              callback: () => {
                const a = document.createElement("a");
                const url = new URL(img.src);
                url.searchParams.delete("preview");
                a.href = url.toString();
                a.setAttribute("download", new URLSearchParams(url.search).get("filename"));
                document.body.append(a);
                a.click();
                requestAnimationFrame(() => a.remove());
              },
            }
          );
        }
      }
    };

    const m = new BaseSmartWidgetManager(node, "iToolsCompareImage");
    const origOnRemoved = node.onRemoved;
    node.onRemoved = function () {
      origOnRemoved?.apply(this, arguments);
      m.destroy()
    }
  },
});

const compareWay = app.extensionManager.setting.get("iTools.Nodes.Compare Mode", "makadi");
function overrideDraw(node, widget_width, y, ctx, compare, mouse) {
  if (!compare || !compare.mode || !node.imgs || node.imgs.length < 2) return;

  let img1 = node.imgs[0];
  let img2 = node.imgs[node.imgs.length > 2 ? Math.floor(node.imgs.length / 2) : 1];

  const dw = widget_width;
  const dh = node.size[1] - y;

  // 1. Calculate parameters to force both images to the same height (dh)
  const getParams = (img) => {
    const scale = dh / img.naturalHeight;
    const w = img.naturalWidth * scale;
    // If the resulting width is wider than the widget, scale down further
    const finalScale = w > dw ? dw / w : 1; 
    
    const finalW = w * finalScale;
    const finalH = dh * finalScale;

    return {
      x: (dw - finalW) / 2,
      y: y + (dh - finalH) / 2,
      w: finalW,
      h: finalH
    };
  };

  const p1 = getParams(img1);
  const p2 = getParams(img2);

  // 2. Determine the shared interaction bounds (the container area)
  const viewW = Math.max(p1.w, p2.w);
  const viewH = Math.max(p1.h, p2.h);
  const imgX = (dw - viewW) / 2;
  const imgY = y + (dh - viewH) / 2;

  // 3. Mouse Logic
  let mouseX, mouseY;
  if (compareWay === "makadi") {
    const graphMouse = app.canvas.graph_mouse;
    mouseX = graphMouse[0] - node.pos[0];
    mouseY = graphMouse[1] - node.pos[1];
  } else {
    mouseX = mouse.mouseInNode ? mouse.x : dw / 2;
    mouseY = mouse.mouseInNode ? mouse.y : y + dh / 2;
  }

  // 4. Drawing
  if (compare.mode === "|") {
    const splitX = Math.max(imgX, Math.min(mouseX, imgX + viewW));
    
    const left = (compareWay === "makadi") ? {img: img1, p: p1} : {img: img2, p: p2};
    const right = (compareWay === "makadi") ? {img: img2, p: p2} : {img: img1, p: p1};

    // Draw Left Side
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, splitX, dh); // Clip left side of the widget
    ctx.clip();
    ctx.drawImage(left.img, left.p.x, left.p.y, left.p.w, left.p.h);
    ctx.restore();

    // Draw Right Side
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, y, dw - splitX, dh); // Clip right side of the widget
    ctx.clip();
    ctx.drawImage(right.img, right.p.x, right.p.y, right.p.w, right.p.h);
    ctx.restore();

} else if (compare.mode === "O") {
    const radius = Math.min(dw, dh) * 0.15;

    // Determine background vs overlay based on compareWay
    const bg = (compareWay === "makadi") ? {img: img1, p: p1} : {img: img2, p: p2};
    const overlay = (compareWay === "makadi") ? {img: img2, p: p2} : {img: img1, p: p1};

    // 1. Draw the background image
    ctx.drawImage(bg.img, bg.p.x, bg.p.y, bg.p.w, bg.p.h);

    // 2. Draw the circular clip for the second image
    ctx.save();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.drawImage(overlay.img, overlay.p.x, overlay.p.y, overlay.p.w, overlay.p.h);
    ctx.restore();

    // Optional: Draw a subtle border around the circle so you can see it better
    // ctx.beginPath();
    // ctx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
    // ctx.strokeStyle = "rgba(255,255,255,0.5)";
    // ctx.stroke();
  } else if (compare.mode === "A") {
    ctx.drawImage(img1, p1.x, p1.y, p1.w, p1.h);
  } else if (compare.mode === "B") {
    ctx.drawImage(img2, p2.x, p2.y, p2.w, p2.h);
  }
}

function getCopyImageOption(img) {
  if (typeof window.ClipboardItem === "undefined") return [];
  return [
    {
      content: "Copy Image",
      callback: async () => {
        const url = new URL(img.src);
        url.searchParams.delete("preview");

        const writeImage = async (blob) => {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
        };

        try {
          const data = await fetch(url);
          const blob = await data.blob();
          try {
            await writeImage(blob);
          } catch (error) {
            // Chrome seems to only support PNG on write, convert and try again
            if (blob.type !== "image/png") {
              const canvas = $el("canvas", {
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
              const ctx = canvas.getContext("2d");
              let image;
              if (typeof window.createImageBitmap === "undefined") {
                image = new Image();
                const p = new Promise((resolve, reject) => {
                  image.onload = resolve;
                  image.onerror = reject;
                }).finally(() => {
                  URL.revokeObjectURL(image.src);
                });
                image.src = URL.createObjectURL(blob);
                await p;
              } else {
                image = await createImageBitmap(blob);
              }
              try {
                ctx.drawImage(image, 0, 0);
                canvas.toBlob(writeImage, "image/png");
              } finally {
                if (typeof image.close === "function") {
                  image.close();
                }
              }

              return;
            }
            throw error;
          }
        } catch (error) {
          toastStore.addAlert(
            t("toastMessages.errorCopyImage", {
              error: error.message ?? error,
            })
          );
        }
      },
    },
  ];
}
