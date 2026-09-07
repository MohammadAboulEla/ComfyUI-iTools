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

    const MIN_WIDTH = 340;
    const MIN_HEIGHT = 360;
    node.size = [Math.max(node.size?.[0] || MIN_WIDTH, MIN_WIDTH), Math.max(node.size?.[1] || MIN_HEIGHT, MIN_HEIGHT)];

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
    let splitRatio = 0.5; // 0..1 for split mode
    let lensRelPos = { x: 0.5, y: 0.5 };
    let isHovering = false;

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

    const compareWay = app.extensionManager?.setting?.get("iTools.Nodes.Compare Mode", "makadi");

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
          const scale = Math.min(w / single.naturalWidth, h / single.naturalHeight);
          const dw = single.naturalWidth * scale;
          const dh = single.naturalHeight * scale;
          ctx.drawImage(single, (w - dw) / 2, (h - dh) / 2, dw, dh);
        }
        ctx.restore();
        return;
      }

      // Both images available
      const scaleA = Math.min(w / (imgA.naturalWidth || 1), h / (imgA.naturalHeight || 1));
      const scaleB = Math.min(w / (imgB.naturalWidth || 1), h / (imgB.naturalHeight || 1));
      const scale = Math.min(scaleA, scaleB);

      const imgW = Math.max(imgA.naturalWidth * scale, imgB.naturalWidth * scale);
      const imgH = Math.max(imgA.naturalHeight * scale, imgB.naturalHeight * scale);
      const imgX = (w - imgW) / 2;
      const imgY = (h - imgH) / 2;

      const leftImg = compareWay === "makadi" ? imgA : imgB;
      const rightImg = compareWay === "makadi" ? imgB : imgA;

      if (compareMode === "A") {
        const sw = imgA.naturalWidth * scale;
        const sh = imgA.naturalHeight * scale;
        ctx.drawImage(imgA, (w - sw) / 2, (h - sh) / 2, sw, sh);
      } else if (compareMode === "B") {
        const sw = imgB.naturalWidth * scale;
        const sh = imgB.naturalHeight * scale;
        ctx.drawImage(imgB, (w - sw) / 2, (h - sh) / 2, sw, sh);
      } else if (compareMode === "|") {
        const splitX = isHovering
          ? Math.max(imgX, Math.min(imgX + imgW, imgX + imgW * splitRatio))
          : w / 2;

        // Draw Left Side
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, h);
        ctx.clip();
        const lW = leftImg.naturalWidth * scale;
        const lH = leftImg.naturalHeight * scale;
        ctx.drawImage(leftImg, (w - lW) / 2, (h - lH) / 2, lW, lH);
        ctx.restore();

        // Draw Right Side
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        const rW = rightImg.naturalWidth * scale;
        const rH = rightImg.naturalHeight * scale;
        ctx.drawImage(rightImg, (w - rW) / 2, (h - rH) / 2, rW, rH);
        ctx.restore();

        // Split Divider Line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(splitX, imgY);
        ctx.lineTo(splitX, imgY + imgH);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();
      } else if (compareMode === "O") {
        // Mode "O": Circular Reveal Lens
        const bgImg = leftImg;
        const lensImg = rightImg;

        // 1. Draw Background Image
        const bgW = bgImg.naturalWidth * scale;
        const bgH = bgImg.naturalHeight * scale;
        ctx.drawImage(bgImg, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);

        // 2. Calculate Lens Position
        const lensX = isHovering ? lensRelPos.x * w : w / 2;
        const lensY = isHovering ? lensRelPos.y * h : h / 2;
        const radius = Math.min(w, h) * 0.18;

        // 3. Draw Lens Mask & Overlay Image
        ctx.save();
        ctx.beginPath();
        ctx.arc(lensX, lensY, radius, 0, Math.PI * 2);
        ctx.clip();

        const ovW = lensImg.naturalWidth * scale;
        const ovH = lensImg.naturalHeight * scale;
        ctx.drawImage(lensImg, (w - ovW) / 2, (h - ovH) / 2, ovW, ovH);
        ctx.restore();

        // 4. Subtle Border around the Lens
        ctx.save();
        ctx.beginPath();
        ctx.arc(lensX, lensY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // ── Mouse Handling ─────────────────────────────────────────────────────
    canvasWrap.onmouseenter = () => {
      isHovering = true;
    };

    canvasWrap.onmouseleave = () => {
      isHovering = false;
      splitRatio = 0.5;
      lensRelPos = { x: 0.5, y: 0.5 };
      requestRender();
    };

    canvasWrap.onmousemove = (e) => {
      if (!imgA || !imgB) return;
      const rect = canvasWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (compareMode === "|") {
        splitRatio = Math.max(0, Math.min(1, x / rect.width));
        requestRender();
      } else if (compareMode === "O") {
        lensRelPos = {
          x: Math.max(0, Math.min(1, x / rect.width)),
          y: Math.max(0, Math.min(1, y / rect.height)),
        };
        requestRender();
      }
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
        (Array.isArray(message?.itools_compare) && message.itools_compare.length > 0 ? [message.itools_compare[0]] : null) ||
        (Array.isArray(message?.images) && message.images.length > 0 ? [message.images[0]] : null);

      const listB =
        message?.itools_compare_b ||
        message?.itools_compare?.b ||
        (Array.isArray(message?.itools_compare) && message.itools_compare.length > 1 ? [message.itools_compare[1]] : null) ||
        (Array.isArray(message?.images) && message.images.length > 1 ? [message.images[1]] : null);

      if (listA?.length) {
        const itemA = listA[0];
        const urlA = api.apiURL(
          `/view?filename=${encodeURIComponent(itemA.filename)}&type=${encodeURIComponent(
            itemA.type || "temp"
          )}&subfolder=${encodeURIComponent(itemA.subfolder || "")}&t=${Date.now()}`
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
            itemB.type || "temp"
          )}&subfolder=${encodeURIComponent(itemB.subfolder || "")}&t=${Date.now()}`
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
      if (wrapperH > 0) {
        sizeGuardDiff = node.size[1] - wrapperH;
      }
    }

    function enforceWrapperSize() {
      const wrapper = container.parentElement;
      if (!wrapper || !node.size || sizeGuardDiff === null) return;

      const desiredWrapperH = Math.max(MIN_HEIGHT - 60, node.size[1] - sizeGuardDiff);
      const currentH = wrapper.getBoundingClientRect().height;

      if (Math.abs(currentH - desiredWrapperH) > 2) {
        wrapper.style.height = `${desiredWrapperH}px`;
        wrapper.style.maxHeight = `${desiredWrapperH}px`;
        wrapper.style.overflow = "hidden";
        requestRender();
      }
    }

    const ro = new ResizeObserver(() => {
      requestRender();
    });
    ro.observe(canvasWrap);

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
      ro.disconnect();
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
