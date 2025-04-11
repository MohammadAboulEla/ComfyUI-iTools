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
  },
});

function overrideDraw(node, widget_width, y, ctx, compare, mouse) {
  if (!compare || !compare.mode) return;

  let img1 = null;
  let img2 = null;

  if (node.imgs.length > 2) {
    const half = Math.floor(node.imgs.length / 2);
    img1 = node.imgs[0];
    img2 = node.imgs[half];
  } else {
    img1 = node.imgs[0];
    img2 = node.imgs[1];
  }

  const dw = widget_width;
  const dh = node.size[1] - y;
  let w = Math.max(img1.naturalWidth, img2.naturalWidth);
  let h = Math.max(img1.naturalHeight, img2.naturalHeight);

  const scaleX = dw / w;
  const scaleY = dh / h;
  const scale = Math.min(scaleX, scaleY, 1);

  w *= scale;
  h *= scale;

  // Centered position within the widget
  const imgX = (dw - w) / 2;
  const imgY = (dh - h) / 2 + y; // +y to offset within canvas

  const mouseX = mouse.mouseInNode ? mouse.x : imgX; // default to center when mouse is outside
  const mouseY = mouse.mouseInNode ? mouse.y : imgY + h / 2;

  if (compare.mode === "|") {
    // Split mode
    const splitX = Math.max(imgX, Math.min(mouseX, imgX + w));
    const splitRatio = (splitX - imgX) / w;

    // Draw left part from img
    ctx.drawImage(img1, 0, 0, img1.naturalWidth * splitRatio, img1.naturalHeight, imgX, imgY, w * splitRatio, h);
    // Draw right part from img2
    ctx.drawImage(
      img2,
      img2.naturalWidth * splitRatio,
      0,
      img2.naturalWidth * (1 - splitRatio),
      img2.naturalHeight,
      imgX + w * splitRatio,
      imgY,
      w * (1 - splitRatio),
      h
    );

    // Draw labels
    // ctx.save();
    // ctx.font = "bold 18px Arial";
    // ctx.textBaseline = "top";
    // ctx.shadowColor = "black";
    // ctx.shadowBlur = 4;

    // Label A
    // ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    // if(mouseX  > imgX + 23) ctx.fillText("A", imgX + 10, imgY + 10);

    // Label B - position depends on split
    // const labelB = "B";
    // const labelWidth = ctx.measureText(labelB).width;
    // if(mouseX  < imgX + w - labelWidth - 10) ctx.fillText(labelB, imgX + w - labelWidth - 10, imgY + 10);

    // // Optional: draw split line
    // ctx.beginPath();
    // ctx.moveTo(splitX, imgY);
    // ctx.lineTo(splitX, imgY + h);
    // ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    // ctx.lineWidth = 1;
    // ctx.stroke();

    // ctx.restore();
  } else if (compare.mode === "O") {
    // Circle mode
    const radius = Math.min(w, h) * 0.15; // 30% of image size
    const centerX = Math.max(imgX + radius, Math.min(mouseX, imgX + w - radius));
    const centerY = Math.max(imgY + radius, Math.min(mouseY, imgY + h - radius));

    // First draw img A (background)
    ctx.drawImage(img2, 0, 0, img2.naturalWidth, img2.naturalHeight, imgX, imgY, w, h);

    // Save the current context
    ctx.save();

    // Create a circular path
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();

    // Clip to the circle
    ctx.clip();

    // Draw the image B inside the circle
    ctx.drawImage(img1, 0, 0, img1.naturalWidth, img1.naturalHeight, imgX, imgY, w, h);
    ctx.restore();

    // ctx.save();
    // ctx.font = "bold 18px Arial";
    // ctx.textBaseline = "top";
    // ctx.shadowColor = "black";
    // ctx.shadowBlur = 4;

    // Label A
    // ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    // if(!(mouseX < imgX + 55 && mouseY < imgY + 55)) ctx.fillText("A", imgX + 10, imgY + 10);

    // Restore the context to remove the clip

    // Optional: Draw circle border
    // ctx.beginPath();
    // ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    // ctx.strokeStyle = "#ffffff";
    // ctx.lineWidth = 1;
    // ctx.stroke();

    // ctx.restore();
  } else if (compare.mode === "A") {
    // draw img 1 only
    ctx.drawImage(img2, 0, 0, img2.naturalWidth, img2.naturalHeight, imgX, imgY, w, h);
  } else if (compare.mode === "B") {
    // draw img 2 only
    ctx.drawImage(img1, 0, 0, img1.naturalWidth, img1.naturalHeight, imgX, imgY, w, h);
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
