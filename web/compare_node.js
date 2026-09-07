import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
  name: "iTools.compareNode",

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsCompareImage") {
      nodeType.prototype.onExecuted = function (message) {
        delete this.imgs;
        delete this.images;
        if (this._itoolsOnExecuted) {
          this._itoolsOnExecuted(message);
        }
      };
    }
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsCompareImage") {
      return;
    }

    delete node.imgs;
    delete node.images;

    const MIN_WIDTH = 360;
    const MIN_HEIGHT = 360;

    // Prevent default Litegraph preview drawing
    node.onDrawBackground = function (ctx) {
      // Intentionally empty: all rendering handled by custom DOM widget
    };

    node.onExecuted = function (message) {
      delete node.imgs;
      delete node.images;
      if (node._itoolsOnExecuted) {
        node._itoolsOnExecuted(message);
      }
    };

    // State
    let imgA = null;
    let imgB = null;
    let compareMode = "|"; // "A", "B", "|", "O"
    let mousePos = { x: 0, y: 0 };
    let isHovering = false;
    let useCompareStroke = false;

    // ── DOM Construction ───────────────────────────────────────────────────
    const container = document.createElement("div");
    container.className = "itools-compare-widget";
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background: #181818;
      border-radius: 8px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    `;

    container.addEventListener(
      "wheel",
      (e) => {
        if (app.canvas?.processMouseWheel) {
          app.canvas.processMouseWheel(e);
        } else {
          const targetCanvas =
            app.canvas?.canvas ||
            document.querySelector("canvas.graph-canvas") ||
            document.querySelector(".litegraph canvas");
          if (targetCanvas) {
            targetCanvas.dispatchEvent(new WheelEvent("wheel", e));
          }
        }
      },
      { passive: false },
    );

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "itools-compare-toolbar";
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      background: #222222;
      border-bottom: 1px solid #333333;
      flex-shrink: 0;
      box-sizing: border-box;
    `;

    function createToolbarButton(label, tooltip, mode) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.title = tooltip;
      btn.style.cssText = `
        background: #2a2a2a;
        color: #dddddd;
        border: 1px solid #505050;
        border-radius: 4px;
        padding: 3px 12px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        white-space: nowrap;
      `;
      btn.onclick = () => {
        compareMode = mode;
        updateButtons();
        requestRender();
      };
      return btn;
    }

    const btnA = createToolbarButton("A", "Show Image A only", "A");
    const btnB = createToolbarButton("B", "Show Image B only", "B");
    const btnSplit = createToolbarButton("|", "Split Screen Comparison", "|");
    const btnLens = createToolbarButton("O", "Circular Reveal Lens", "O");

    const buttons = [btnA, btnB, btnSplit, btnLens];
    buttons.forEach((b) => toolbar.appendChild(b));
    container.appendChild(toolbar);

    function updateButtons() {
      buttons.forEach((b) => {
        const isActive =
          (b === btnA && compareMode === "A") ||
          (b === btnB && compareMode === "B") ||
          (b === btnSplit && compareMode === "|") ||
          (b === btnLens && compareMode === "O");

        if (isActive) {
          b.style.background = "#80a1c0";
          b.style.color = "#000000";
          b.style.borderColor = "#a0c4e8";
        } else {
          b.style.background = "#2a2a2a";
          b.style.color = "#dddddd";
          b.style.borderColor = "#505050";
        }
      });
    }
    updateButtons();

    // Canvas wrapper
    const canvasWrap = document.createElement("div");
    canvasWrap.style.cssText = `
      position: relative;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #141414;
      overflow: hidden;
      cursor: default;
    `;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
    `;
    canvasWrap.appendChild(canvas);
    container.appendChild(canvasWrap);

    const ctx = canvas.getContext("2d");

    const compareWay = app.extensionManager?.setting?.get(
      "iTools.Nodes.Compare Mode",
      "makadi",
    );

    // ── Throttled Canvas Rendering ─────────────────────────────────────────
    let renderPending = false;
    function requestRender() {
      if (renderPending) return;
      renderPending = true;
      requestAnimationFrame(() => {
        renderPending = false;
        render();
      });
    }

    function render() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvasWrap.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (w <= 0 || h <= 0) return;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      function getBounds(img) {
        if (!img || !img.naturalWidth || !img.naturalHeight) {
          return { x: 0, y: 0, w: 0, h: 0 };
        }
        const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        return {
          x: (w - dw) / 2,
          y: (h - dh) / 2,
          w: dw,
          h: dh,
        };
      }

      if (!imgA && !imgB) {
        ctx.fillStyle = "#555555";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("No Images to Compare", w / 2, h / 2);
        ctx.restore();
        return;
      }

      // Single image fallback if one is missing
      if (!imgA || !imgB) {
        const single = imgA || imgB;
        if (single && single.naturalWidth) {
          const p = getBounds(single);
          ctx.drawImage(single, p.x, p.y, p.w, p.h);
        }
        ctx.restore();
        return;
      }

      // Both images available: each scales to fit the container while strictly preserving its natural aspect ratio
      const compareWay =
        app.extensionManager?.setting?.get?.(
          "iTools.Nodes.Compare Mode",
          "makadi",
        ) || "makadi";
      const leftImg = compareWay === "makadi" ? imgA : imgB;
      const rightImg = compareWay === "makadi" ? imgB : imgA;

      const pLeft = getBounds(leftImg);
      const pRight = getBounds(rightImg);

      const imgX = Math.min(pLeft.x, pRight.x);
      const imgY = Math.min(pLeft.y, pRight.y);
      const imgW = Math.max(pLeft.x + pLeft.w, pRight.x + pRight.w) - imgX;
      const imgH = Math.max(pLeft.y + pLeft.h, pRight.y + pRight.h) - imgY;

      if (compareMode === "A") {
        const pA = getBounds(imgA);
        ctx.drawImage(imgA, pA.x, pA.y, pA.w, pA.h);
      } else if (compareMode === "B") {
        const pB = getBounds(imgB);
        ctx.drawImage(imgB, pB.x, pB.y, pB.w, pB.h);
      } else if (compareMode === "|") {
        const splitX = isHovering
          ? Math.max(imgX, Math.min(imgX + imgW, mousePos.x))
          : w / 2;

        // Draw Left Side
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, h);
        ctx.clip();
        ctx.drawImage(leftImg, pLeft.x, pLeft.y, pLeft.w, pLeft.h);
        ctx.restore();

        // Draw Right Side
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        ctx.drawImage(rightImg, pRight.x, pRight.y, pRight.w, pRight.h);
        ctx.restore();

        // Split Divider Line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(splitX, imgY);
        ctx.lineTo(splitX, imgY + imgH);
        if (useCompareStroke) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 4;
          ctx.stroke();
        }
        ctx.restore();
      } else if (compareMode === "O") {
        // Mode "O": Circular Reveal Lens
        // 1. Draw Background Image
        ctx.drawImage(leftImg, pLeft.x, pLeft.y, pLeft.w, pLeft.h);

        // 2. Calculate Lens Position directly under mouse
        const lensX = isHovering
          ? Math.max(imgX, Math.min(imgX + imgW, mousePos.x))
          : w / 2;
        const lensY = isHovering
          ? Math.max(imgY, Math.min(imgY + imgH, mousePos.y))
          : h / 2;
        const radius = Math.min(w, h) * 0.18;

        // 3. Draw Lens Mask & Overlay Image
        ctx.save();
        ctx.beginPath();
        ctx.arc(lensX, lensY, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(rightImg, pRight.x, pRight.y, pRight.w, pRight.h);
        ctx.restore();

        // 4. Subtle Border around the Lens
        ctx.save();
        ctx.beginPath();
        ctx.arc(lensX, lensY, radius, 0, Math.PI * 2);
        if (useCompareStroke) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // ── Mouse Handling ─────────────────────────────────────────────────────
    canvasWrap.onmouseenter = (e) => {
      isHovering = true;
      const rect = canvasWrap.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      requestRender();
    };

    canvasWrap.onmouseleave = () => {
      isHovering = false;
      requestRender();
    };

    canvasWrap.onmousemove = (e) => {
      if (!imgA || !imgB) return;
      const rect = canvasWrap.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      requestRender();
    };

    // ── Execution Handler ──────────────────────────────────────────────────
    node._itoolsOnExecuted = function (message) {
      delete node.imgs;
      delete node.images;
      if (node.widgets) {
        node.widgets = node.widgets.filter((w) => w.name === "CompareWidget");
      }

      const listA =
        message?.itools_compare_a ||
        message?.itools_compare?.a ||
        (Array.isArray(message?.itools_compare) &&
        message.itools_compare.length > 0
          ? [message.itools_compare[0]]
          : null) ||
        (Array.isArray(message?.images) && message.images.length > 0
          ? [message.images[0]]
          : null);

      const listB =
        message?.itools_compare_b ||
        message?.itools_compare?.b ||
        (Array.isArray(message?.itools_compare) &&
        message.itools_compare.length > 1
          ? [message.itools_compare[1]]
          : null) ||
        (Array.isArray(message?.images) && message.images.length > 1
          ? [message.images[1]]
          : null);

      if (listA?.length) {
        const itemA = listA[0];
        const urlA = api.apiURL(
          `/view?filename=${encodeURIComponent(itemA.filename)}&type=${encodeURIComponent(
            itemA.type || "temp",
          )}&subfolder=${encodeURIComponent(itemA.subfolder || "")}&t=${Date.now()}`,
        );
        const imA = new Image();
        imA.crossOrigin = "anonymous";
        imA.onload = () => {
          imgA = imA;
          requestRender();
        };
        imA.src = urlA;
      }

      if (listB?.length) {
        const itemB = listB[0];
        const urlB = api.apiURL(
          `/view?filename=${encodeURIComponent(itemB.filename)}&type=${encodeURIComponent(
            itemB.type || "temp",
          )}&subfolder=${encodeURIComponent(itemB.subfolder || "")}&t=${Date.now()}`,
        );
        const imB = new Image();
        imB.crossOrigin = "anonymous";
        imB.onload = () => {
          imgB = imB;
          requestRender();
        };
        imB.src = urlB;
      }
    };

    // ── Add Custom DOM Widget ──────────────────────────────────────────────
    node.addDOMWidget("CompareWidget", "custom", container, {
      tooltip: "iTools Image Compare",
    });

    // ── Size Guard between Node 1 and Node 2 ───────────────────────────────
    let sizeGuardDiff = null;

    function measureSizeGuard() {
      const wrapper = container.parentElement;
      if (!wrapper || !node.size) return;
      const wrapperH = wrapper.getBoundingClientRect().height;
      if (wrapperH > 0 && node.size[1] > wrapperH) {
        sizeGuardDiff = node.size[1] - wrapperH;
      }
    }

    function enforceWrapperSize() {
      const wrapper = container.parentElement;
      if (!wrapper || !node.size) return;

      const diff = sizeGuardDiff !== null ? sizeGuardDiff : 70;
      const desiredWrapperH = Math.max(MIN_HEIGHT - 60, node.size[1] - diff);
      const currentH = wrapper.getBoundingClientRect().height;

      if (Math.abs(currentH - desiredWrapperH) > 2) {
        wrapper.style.height = `${desiredWrapperH}px`;
        wrapper.style.maxHeight = `${desiredWrapperH}px`;
        wrapper.style.boxSizing = "border-box";
        wrapper.style.overflow = "hidden";
        requestRender();
      }
    }

    const wrapperRo = new ResizeObserver(() => enforceWrapperSize());

    node.onResize = function (size) {
      size[0] = Math.max(MIN_WIDTH, size[0]);
      size[1] = Math.max(MIN_HEIGHT, size[1]);
      if (sizeGuardDiff === null) measureSizeGuard();
      enforceWrapperSize();
      requestRender();
    };

    const origOnRemoved = node.onRemoved;
    node.onRemoved = function () {
      origOnRemoved?.apply(this, arguments);
      wrapperRo.disconnect();
    };

    // Initial render
    setTimeout(() => {
      measureSizeGuard();
      if (container.parentElement) wrapperRo.observe(container.parentElement);
      updateButtons();
      render();
    }, 50);
  },
});
