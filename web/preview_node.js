import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { allow_debug } from "./js_shared.js";

app.registerExtension({
  name: "iTools.previewNode",

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsPreviewImage") {
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
    if (node.comfyClass !== "iToolsPreviewImage") {
      return;
    }

    delete node.imgs;
    delete node.images;

    const MIN_WIDTH = 360;
    const MIN_HEIGHT = 360;

    // Prevent default Litegraph preview drawing if node.imgs gets populated
    node.onDrawBackground = function (ctx) {
      // Intentionally empty: all rendering is handled by the custom DOM widget
    };

    // State
    const MAX_IMAGES = 8;
    const MAX_TOAST_SHOWS = 2;
    let imagesTracked = [];
    let currentImageIndex = 0; // index in imagesTracked currently displayed
    let isGridView = false;
    let gridCells = [];
    let hoveredGridIndex = -1;
    let compare = false;
    let compareSplitRatio = 0.5; // 0.0 to 1.0
    let isHoveringCanvas = false;

    let toastShownCountH = 0;
    let toastShownCountPC = 0;
    let toastShownCountI = 0;

    // Ensure notes storage in node.properties
    if (!node.properties) node.properties = {};
    if (!node.properties.iToolsImageNotes)
      node.properties.iToolsImageNotes = {};

    function getNotes() {
      if (!node.properties.iToolsImageNotes)
        node.properties.iToolsImageNotes = {};
      return node.properties.iToolsImageNotes;
    }

    function getImageKey(img) {
      if (!img) return "";
      if (img.dataset?.filename) return img.dataset.filename;
      if (!img.src) return "";
      const match = img.src.match(/filename=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : img.src;
    }

    function getNote(img) {
      const key = getImageKey(img);
      return (key && getNotes()[key]) || "";
    }

    function setNote(img, text) {
      const key = getImageKey(img);
      if (!key) return;
      if (text) {
        getNotes()[key] = text;
      } else {
        delete getNotes()[key];
      }
    }

    function getActiveImage() {
      if (!imagesTracked.length) return null;
      return imagesTracked[currentImageIndex] || imagesTracked.at(-1);
    }

    // ── DOM Construction ───────────────────────────────────────────────────
    const container = document.createElement("div");
    container.className = "itools-preview-widget";
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
    toolbar.className = "itools-preview-toolbar";
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 8px;
      background: #222222;
      border-bottom: 1px solid #333333;
      flex-shrink: 0;
      box-sizing: border-box;
    `;

    // Button helper
    function createHtmlButton(text, tooltip) {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.title = tooltip || "";
      btn.style.cssText = `
        background: #2a2a2a;
        color: #dddddd;
        border: 1px solid #505050;
        border-radius: 4px;
        padding: 3px 8px;
        font-size: 11px;
        cursor: pointer;
        outline: none;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        white-space: nowrap;
      `;
      btn.onmouseenter = () => {
        if (!btn.dataset.active) {
          btn.style.background = "#3a3a3a";
          btn.style.borderColor = "#707070";
        }
      };
      btn.onmouseleave = () => {
        if (!btn.dataset.active) {
          btn.style.background = "#2a2a2a";
          btn.style.borderColor = "#505050";
        }
      };
      return btn;
    }

    // History button
    const historyBtn = createHtmlButton(
      "History",
      "Show all historical images in a grid",
    );
    historyBtn.style.borderTopRightRadius = "0";
    historyBtn.style.borderBottomRightRadius = "0";
    historyBtn.style.marginRight = "-1px";

    // [Current] | Previous toggle button
    const prevCurrentBtn = createHtmlButton(
      "[Current] | Previous",
      "Toggle between current and previous images",
    );
    prevCurrentBtn.style.borderTopLeftRadius = "0";
    prevCurrentBtn.style.borderBottomLeftRadius = "0";

    // Compare button
    const compareBtn = createHtmlButton("|", "Toggle A/B Compare mode");
    compareBtn.style.width = "24px";
    compareBtn.style.textAlign = "center";
    compareBtn.style.fontWeight = "bold";

    // Note button
    const noteBtn = createHtmlButton(
      "Add Note",
      "Attach or edit a note on this image",
    );
    noteBtn.style.marginLeft = "auto";

    toolbar.appendChild(historyBtn);
    toolbar.appendChild(prevCurrentBtn);
    toolbar.appendChild(compareBtn);
    toolbar.appendChild(noteBtn);
    container.appendChild(toolbar);

    // Canvas viewport wrapper
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

    // ── Resize handling ─────────────────────────────────────────────────────
    let lastW = 0,
      lastH = 0;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;

      // تجاهل القيم المتطابقة أو الصفرية (تحدث أثناء إعادة تركيب الـ DOM)
      if (width === lastW && height === lastH) return;
      if (width <= 0 || height <= 0) return;

      lastW = width;
      lastH = height;
      requestRender();
    });

    // ── Compare settings ───────────────────────────────────────────────────
    const compareWay = app.extensionManager?.setting?.get(
      "iTools.Nodes.Compare Mode",
      "makadi",
    );

    // ── Update Toolbar UI ──────────────────────────────────────────────────
    function updateToolbar() {
      const hasImages = imagesTracked.length > 0;
      const multiple = imagesTracked.length > 1;

      // Note button text
      const activeImg = getActiveImage();
      const currentNote = getNote(activeImg);
      noteBtn.textContent = currentNote ? "Edit Note" : "Add Note";
      noteBtn.disabled = !hasImages || isGridView;
      noteBtn.style.opacity = hasImages && !isGridView ? "1" : "0.5";

      // History button styling
      if (isGridView) {
        historyBtn.dataset.active = "true";
        historyBtn.style.background = "#80a1c0";
        historyBtn.style.color = "#000000";
        historyBtn.style.borderColor = "#a0c4e8";
      } else {
        delete historyBtn.dataset.active;
        historyBtn.style.background = "#2a2a2a";
        historyBtn.style.color = "#dddddd";
        historyBtn.style.borderColor = "#505050";
      }

      // Toggle button text
      if (multiple) {
        const isShowingCurrent = currentImageIndex === imagesTracked.length - 1;
        prevCurrentBtn.textContent = isShowingCurrent
          ? "[Current] | Previous"
          : "Current | [Previous]";
      } else {
        prevCurrentBtn.textContent = "[Current] | Previous";
      }

      // Compare button styling
      if (compare) {
        compareBtn.dataset.active = "true";
        compareBtn.style.background = "#80a1c0";
        compareBtn.style.color = "#000000";
        compareBtn.style.borderColor = "#a0c4e8";
      } else {
        delete compareBtn.dataset.active;
        compareBtn.style.background = "#2a2a2a";
        compareBtn.style.color = "#dddddd";
        compareBtn.style.borderColor = "#505050";
      }
    }

    // ── Canvas Drawing ─────────────────────────────────────────────────────
    function drawNoteBar(targetCtx, rect, text) {
      if (!text || !rect) return;
      const fontSize = Math.max(9, Math.min(13, Math.round(rect.w / 22)));
      const padding = Math.round(fontSize / 2);
      const barHeight = fontSize + padding * 2;
      const barY = rect.y + rect.h - barHeight;

      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.rect(rect.x, barY, rect.w, barHeight);
      targetCtx.clip();
      targetCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
      targetCtx.fillRect(rect.x, barY, rect.w, barHeight);
      targetCtx.fillStyle = "#ffffff";
      targetCtx.font = `${fontSize}px monospace`;
      targetCtx.textAlign = "left";
      targetCtx.textBaseline = "middle";
      targetCtx.fillText(text, rect.x + padding, barY + barHeight / 2);
      targetCtx.restore();
    }

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

      if (imagesTracked.length === 0) {
        ctx.fillStyle = "#555555";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("No Image Preview", w / 2, h / 2);
        ctx.restore();
        return;
      }

      if (isGridView && imagesTracked.length > 0) {
        // History Grid View
        const N = imagesTracked.length;
        const aspect = w / h;
        let cols = Math.ceil(Math.sqrt(N * aspect));
        cols = Math.max(1, Math.min(cols, N));
        const rows = Math.ceil(N / cols);

        const pad = 6;
        const gap = 6;
        const cellW = (w - pad * 2 - (cols - 1) * gap) / cols;
        const cellH = (h - pad * 2 - (rows - 1) * gap) / rows;

        gridCells = [];

        for (let i = 0; i < N; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = pad + col * (cellW + gap);
          const cy = pad + row * (cellH + gap);

          gridCells.push({ index: i, x: cx, y: cy, w: cellW, h: cellH });

          const img = imagesTracked[i];
          const isSelected = i === currentImageIndex;
          const isHovered = i === hoveredGridIndex;

          ctx.save();
          // Card background
          ctx.fillStyle = isHovered ? "#282828" : "#1c1c1c";
          ctx.fillRect(cx, cy, cellW, cellH);

          // Border
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.strokeStyle = isSelected
            ? "#80a1c0"
            : isHovered
              ? "#666666"
              : "#363636";
          ctx.strokeRect(cx, cy, cellW, cellH);

          // Draw contained image
          if (img && img.naturalWidth) {
            const scale = Math.min(
              (cellW - 4) / img.naturalWidth,
              (cellH - 4) / img.naturalHeight,
            );
            const iw = img.naturalWidth * scale;
            const ih = img.naturalHeight * scale;
            const ix = cx + (cellW - iw) / 2;
            const iy = cy + (cellH - ih) / 2;

            ctx.beginPath();
            ctx.rect(cx + 1, cy + 1, cellW - 2, cellH - 2);
            ctx.clip();
            ctx.drawImage(img, ix, iy, iw, ih);

            const note = getNote(img);
            if (note) {
              drawNoteBar(ctx, { x: ix, y: iy, w: iw, h: ih }, note);
            }
          }

          // Number badge
          ctx.restore();
          ctx.save();
          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.fillRect(cx + 2, cy + 2, 18, 14);
          ctx.fillStyle = isSelected ? "#80a1c0" : "#cccccc";
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${i + 1}`, cx + 11, cy + 9);
          ctx.restore();
        }
      } else if (compare && imagesTracked.length >= 2) {
        // Compare Mode
        const lastTwo = imagesTracked.slice(-2);
        const imgPrev = lastTwo[0];
        const imgCurr = lastTwo[1];

        const leftImg = compareWay === "makadi" ? imgPrev : imgCurr;
        const rightImg = compareWay === "makadi" ? imgCurr : imgPrev;

        // Force equal containment scale
        const scaleL = Math.min(
          w / (leftImg.naturalWidth || 1),
          h / (leftImg.naturalHeight || 1),
        );
        const scaleR = Math.min(
          w / (rightImg.naturalWidth || 1),
          h / (rightImg.naturalHeight || 1),
        );
        const scale = Math.min(scaleL, scaleR);

        const imgW = Math.max(
          leftImg.naturalWidth * scale,
          rightImg.naturalWidth * scale,
        );
        const imgH = Math.max(
          leftImg.naturalHeight * scale,
          rightImg.naturalHeight * scale,
        );
        const imgX = (w - imgW) / 2;
        const imgY = (h - imgH) / 2;

        const splitX = isHoveringCanvas
          ? Math.max(
              imgX,
              Math.min(imgX + imgW, imgX + imgW * compareSplitRatio),
            )
          : w / 2;

        // Draw Left
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, h);
        ctx.clip();
        const lW = leftImg.naturalWidth * scale;
        const lH = leftImg.naturalHeight * scale;
        const lX = (w - lW) / 2;
        const lY = (h - lH) / 2;
        ctx.drawImage(leftImg, lX, lY, lW, lH);
        drawNoteBar(ctx, { x: lX, y: lY, w: lW, h: lH }, getNote(leftImg));
        ctx.restore();

        // Draw Right
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        const rW = rightImg.naturalWidth * scale;
        const rH = rightImg.naturalHeight * scale;
        const rX = (w - rW) / 2;
        const rY = (h - rH) / 2;
        ctx.drawImage(rightImg, rX, rY, rW, rH);
        drawNoteBar(ctx, { x: rX, y: rY, w: rW, h: rH }, getNote(rightImg));
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
      } else {
        // Single Image Mode
        const img = getActiveImage();
        if (img && img.naturalWidth) {
          const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = (w - drawW) / 2;
          const drawY = (h - drawH) / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          drawNoteBar(
            ctx,
            { x: drawX, y: drawY, w: drawW, h: drawH },
            getNote(img),
          );
        }
      }

      ctx.restore();
    }

    // ── Mouse Interaction ──────────────────────────────────────────────────
    canvasWrap.onclick = (e) => {
      if (!isGridView) return;
      const rect = canvasWrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const cell of gridCells) {
        if (
          mx >= cell.x &&
          mx <= cell.x + cell.w &&
          my >= cell.y &&
          my <= cell.y + cell.h
        ) {
          currentImageIndex = cell.index;
          isGridView = false;
          hoveredGridIndex = -1;
          canvasWrap.style.cursor = "default";
          updateToolbar();
          requestRender();
          return;
        }
      }
    };

    canvasWrap.onmouseenter = () => {
      isHoveringCanvas = true;
    };

    canvasWrap.onmouseleave = () => {
      isHoveringCanvas = false;
      if (isGridView) {
        if (hoveredGridIndex !== -1) {
          hoveredGridIndex = -1;
          canvasWrap.style.cursor = "default";
          requestRender();
        }
        return;
      }
      compareSplitRatio = 0.5;
      requestRender();
    };

    canvasWrap.onmousemove = (e) => {
      const rect = canvasWrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (isGridView) {
        let found = -1;
        for (const cell of gridCells) {
          if (
            mx >= cell.x &&
            mx <= cell.x + cell.w &&
            my >= cell.y &&
            my <= cell.y + cell.h
          ) {
            found = cell.index;
            break;
          }
        }
        if (found !== hoveredGridIndex) {
          hoveredGridIndex = found;
          canvasWrap.style.cursor = found !== -1 ? "pointer" : "default";
          requestRender();
        }
        return;
      }

      canvasWrap.style.cursor = "default";
      if (!compare || imagesTracked.length < 2) return;
      compareSplitRatio = Math.max(0, Math.min(1, mx / rect.width));
      requestRender();
    };

    // ── Button Handlers ────────────────────────────────────────────────────
    historyBtn.onclick = () => {
      if (compare) {
        compare = false;
      }

      if (imagesTracked.length === 0) {
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

      if (imagesTracked.length === 1) {
        if (toastShownCountH < MAX_TOAST_SHOWS) {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "iTools!",
            detail: "Only this image exists in this node history",
            life: 2000,
          });
          toastShownCountH++;
        }
        return;
      }

      // Toggle grid view
      isGridView = !isGridView;
      hoveredGridIndex = -1;
      canvasWrap.style.cursor = "default";
      updateToolbar();
      requestRender();
    };

    prevCurrentBtn.onclick = () => {
      if (compare) {
        compare = false;
      }
      if (isGridView) {
        isGridView = false;
        hoveredGridIndex = -1;
        canvasWrap.style.cursor = "default";
      }

      if (imagesTracked.length < 2) {
        if (toastShownCountPC < MAX_TOAST_SHOWS) {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "iTools!",
            detail: "You must execute this node at least twice",
            life: 2000,
          });
          toastShownCountPC++;
        }
        return;
      }

      // Toggle between current (last) and previous (second to last)
      const lastIndex = imagesTracked.length - 1;
      const prevIndex = imagesTracked.length - 2;
      currentImageIndex =
        currentImageIndex === lastIndex ? prevIndex : lastIndex;

      updateToolbar();
      requestRender();
    };

    compareBtn.onclick = () => {
      if (isGridView) {
        isGridView = false;
        hoveredGridIndex = -1;
        canvasWrap.style.cursor = "default";
      }

      if (imagesTracked.length < 2) {
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
      currentImageIndex = imagesTracked.length - 1;
      compareSplitRatio = 0.5;
      updateToolbar();
      requestRender();
    };

    noteBtn.onclick = () => {
      const img = getActiveImage();
      if (!img) return;

      const currentNote = getNote(img);
      app.extensionManager?.dialog
        ?.prompt({
          title: "iTools Preview Image",
          message: "Note for this image (leave empty to remove)",
          defaultValue: currentNote,
          default: currentNote,
        })
        ?.then((value) => {
          if (value === null || value === undefined) return;
          setNote(img, value.trim());
          updateToolbar();
          requestRender();
        });
    };

    // ── Image Handling ─────────────────────────────────────────────────────
    function pushTrackedImage(newImg) {
      if (!newImg || !newImg.naturalWidth) return;
      const newKey = getImageKey(newImg);

      const exists = imagesTracked.some((img) => getImageKey(img) === newKey);
      if (!exists) {
        imagesTracked.push(newImg);
        if (imagesTracked.length > MAX_IMAGES) {
          imagesTracked.shift();
        }
      }
      currentImageIndex = imagesTracked.length - 1;
      isGridView = false;
      updateToolbar();
      requestRender();
    }

    node._itoolsOnExecuted = function (message) {
      delete node.imgs;
      delete node.images;
      if (node.widgets) {
        node.widgets = node.widgets.filter((w) => w.name === "PreviewWidget");
      }

      const imagesList = message?.itools_preview || message?.images;
      if (!imagesList?.length) return;

      for (const item of imagesList) {
        const url = api.apiURL(
          `/view?filename=${encodeURIComponent(item.filename)}&type=${encodeURIComponent(
            item.type || "temp",
          )}&subfolder=${encodeURIComponent(item.subfolder || "")}&t=${Date.now()}`,
        );
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.dataset.filename = item.filename;
        img.onload = () => {
          pushTrackedImage(img);
        };
        img.src = url;
      }
    };

    // ── Add Custom DOM Widget ──────────────────────────────────────────────
    const widget = node.addDOMWidget("PreviewWidget", "custom", container, {
      tooltip: "iTools Image Preview",
      getValue: () => ({
        notes: node.properties?.iToolsImageNotes || {},
      }),
      setValue: (v) => {
        if (v?.notes) {
          node.properties.iToolsImageNotes = Object.assign(
            {},
            node.properties.iToolsImageNotes,
            v.notes,
          );
          updateToolbar();
          requestRender();
        }
      },
    });

    // ── Size guard between Node 1 and Node 2 ──────────────────────────────
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
      updateToolbar();
      render();
    }, 50);
  },
});
