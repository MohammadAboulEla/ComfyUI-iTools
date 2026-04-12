import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
  name: "iTools.ImageAdjust",
  
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "iToolsImageAdjust") return;

    const origOnNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      origOnNodeCreated?.apply(this, arguments);
      localStorage.removeItem('Comfy.Workflow.Drafts')
      // Remove the default string widget auto-created for widget_state
      const idx = this.widgets?.findIndex((w) => w.name === "widget_state");
      if (idx !== undefined && idx !== -1) this.widgets.splice(idx, 1);

      this.size = [Math.max(this.size[0], 256), Math.max(this.size[1], 400)];

      // ── State ────────────────────────────────────────────────────────────
      let imagePath   = "";   // server path after upload
      let imageData   = "";   // raw source image (uploaded blob URL or upstream URL)
      let brightness  = 0;    // -100..+100
      let contrast    = 100;  // 50..200
      let saturation  = 100;  // 0..200
      let temperature = 0;    // -100..+100
      let gamma       = 100;  // 25..400  (/100 → 0.25..4.0)
      let sharpness   = 100;  // 0..200
      let hue         = 0;    // -180..+180

      // ── Root container ───────────────────────────────────────────────────
      const container = document.createElement("div");
      container.style.cssText =
        "display:none;flex-direction:column;gap:4px;padding:0px;" +
        "width:100%;height:100%;box-sizing:border-box;align-items:center;";

      // ── Upload / preview area ────────────────────────────────────────────
      const uploadArea = document.createElement("div");
      uploadArea.style.cssText =
        "width:100%;height:100%;border:2px dashed #555;border-radius:8px;" +
        "margin-bottom:5px;display:flex;align-items:center;justify-content:center;" +
        "cursor:pointer;position:relative;overflow:hidden;background:#1a1a1a;" +
        "box-sizing:border-box;transition:border-color .15s;";

      const uploadLabel = document.createElement("span");
      uploadLabel.textContent = "Drop image here or click to upload";
      uploadLabel.style.cssText =
        "color:#777;font-size:11px;pointer-events:none;text-align:center;padding:4px;";

      const previewImg = document.createElement("img");
      previewImg.style.cssText =
        "position:absolute;top:0;left:0;width:100%;height:100%;" +
        "object-fit:contain;display:none;";

      const clearBtn = document.createElement("button");
      clearBtn.textContent = "✕";
      clearBtn.title = "Clear uploaded image";
      clearBtn.style.cssText =
        "position:absolute;top:4px;right:4px;width:20px;height:20px;" +
        "border:none;border-radius:4px;background:rgba(0,0,0,.6);color:#ccc;" +
        "font-size:12px;cursor:pointer;display:none;line-height:1;padding:0;";

      uploadArea.appendChild(uploadLabel);
      uploadArea.appendChild(previewImg);
      uploadArea.appendChild(clearBtn);

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";

      // ── SVG filter for live CSS preview (temperature + gamma approximation) ──
      // This only drives the visual preview; getFilteredDataUrl() does exact
      // pixel-level processing for the actual output.
      const svgNS = "http://www.w3.org/2000/svg";
      const svgEl = document.createElementNS(svgNS, "svg");
      svgEl.setAttribute("width", "0");
      svgEl.setAttribute("height", "0");
      svgEl.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";

      const filterId = "itools-img-adjust-" + Math.random().toString(36).slice(2);
      const filterEl = document.createElementNS(svgNS, "filter");
      filterEl.setAttribute("id", filterId);
      filterEl.setAttribute("color-interpolation-filters", "linearRGB");

      const tempMatrix = document.createElementNS(svgNS, "feColorMatrix");
      tempMatrix.setAttribute("type", "matrix");
      tempMatrix.setAttribute("result", "tempOut");

      const gammaTransfer = document.createElementNS(svgNS, "feComponentTransfer");
      gammaTransfer.setAttribute("in", "tempOut");
      const gammaR = document.createElementNS(svgNS, "feFuncR");
      const gammaG = document.createElementNS(svgNS, "feFuncG");
      const gammaB = document.createElementNS(svgNS, "feFuncB");
      for (const fn of [gammaR, gammaG, gammaB]) {
        fn.setAttribute("type", "gamma");
        fn.setAttribute("amplitude", "1");
        fn.setAttribute("offset", "0");
      }
      gammaTransfer.appendChild(gammaR);
      gammaTransfer.appendChild(gammaG);
      gammaTransfer.appendChild(gammaB);
      filterEl.appendChild(tempMatrix);
      filterEl.appendChild(gammaTransfer);
      svgEl.appendChild(filterEl);
      document.body.appendChild(svgEl);

      function updateSvgFilter() {
        const t = (temperature / 100) * 0.3;
        tempMatrix.setAttribute("values",
          `${1+t} 0 0 0 0  0 1 0 0 0  0 0 ${1-t} 0 0  0 0 0 1 0`);
        const exp = 1.0 / Math.max(gamma / 100, 0.01);
        for (const fn of [gammaR, gammaG, gammaB]) fn.setAttribute("exponent", exp.toFixed(4));
      }

      function refreshFilter() {
        const b = 1.0 + brightness / 100;
        const c = contrast / 100;
        const s = saturation / 100;
        updateSvgFilter();
        previewImg.style.filter =
          `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${hue}deg) url(#${filterId})`;
      }

      // ── Exact pixel rendering — this IS the output ────────────────────────
      // Applies all adjustments in pixel space. Order matches PIL pipeline:
      // brightness → contrast → saturation → temperature → gamma → sharpness → hue
      function getFilteredDataUrl() {
        return new Promise((resolve, reject) => {
          const src = previewImg.src;
          if (!src) { reject(new Error("No image loaded")); return; }

          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            const w = img.naturalWidth, h = img.naturalHeight;
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");

            // Step 1-4 via CSS filter + hue-rotate (browser applies in linear light)
            const b = 1.0 + brightness / 100;
            const c = contrast / 100;
            const s = saturation / 100;
            ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${hue}deg)`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = "none";

            // Step 5-6: temperature + gamma on pixel data
            const needsTemp  = temperature !== 0;
            const needsGamma = gamma !== 100;
            if (needsTemp || needsGamma) {
              const id = ctx.getImageData(0, 0, w, h);
              const d = id.data;
              const t = (temperature / 100) * 0.3;
              const rScale = 1.0 + t, bScale = 1.0 - t;
              const gExp = 1.0 / Math.max(gamma / 100, 0.01);
              const lut = new Uint8ClampedArray(256);
              for (let i = 0; i < 256; i++) lut[i] = Math.round(Math.pow(i / 255, gExp) * 255);
              for (let i = 0; i < d.length; i += 4) {
                let r = d[i], g = d[i+1], bv = d[i+2];
                if (needsTemp) {
                  r  = Math.min(255, Math.max(0, Math.round(r  * rScale)));
                  bv = Math.min(255, Math.max(0, Math.round(bv * bScale)));
                }
                if (needsGamma) { r = lut[r]; g = lut[g]; bv = lut[bv]; }
                d[i]=r; d[i+1]=g; d[i+2]=bv;
              }
              ctx.putImageData(id, 0, 0);
            }

            // Step 7: sharpness via convolution kernel
            // 100 = neutral, >100 = sharpen, <100 = soften (blur)
            if (sharpness !== 100) {
              const id = ctx.getImageData(0, 0, w, h);
              const src2 = new Uint8ClampedArray(id.data);
              const dst  = id.data;
              const amount = (sharpness - 100) / 100; // -1..+1

              if (amount > 0) {
                // Unsharp mask: center = 1+4*amount, cross neighbors = -amount
                const center = 1 + 4 * amount, nbr = -amount;
                for (let y = 0; y < h; y++) {
                  for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    for (let c2 = 0; c2 < 3; c2++) {
                      let v = src2[i+c2] * center;
                      if (y > 0)   v += src2[((y-1)*w+x)*4+c2] * nbr;
                      if (y < h-1) v += src2[((y+1)*w+x)*4+c2] * nbr;
                      if (x > 0)   v += src2[(y*w+x-1)*4+c2] * nbr;
                      if (x < w-1) v += src2[(y*w+x+1)*4+c2] * nbr;
                      dst[i+c2] = Math.min(255, Math.max(0, Math.round(v)));
                    }
                    dst[i+3] = src2[i+3];
                  }
                }
              } else {
                // Soften: blend original with 3×3 box blur
                const blur = -amount; // 0..1
                for (let y = 0; y < h; y++) {
                  for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    for (let c2 = 0; c2 < 3; c2++) {
                      let sum = 0, cnt = 0;
                      for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                          const ny = y+dy, nx = x+dx;
                          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                            sum += src2[(ny*w+nx)*4+c2]; cnt++;
                          }
                        }
                      }
                      dst[i+c2] = Math.round(src2[i+c2] * (1-blur) + (sum/cnt) * blur);
                    }
                    dst[i+3] = src2[i+3];
                  }
                }
              }
              ctx.putImageData(id, 0, 0);
            }

            resolve(canvas.toDataURL("image/png"));
          };

          img.onerror = () => reject(new Error("Image failed to load"));
          img.src = src;
        });
      }

      // Debounced update
      let _updateTimer = null;
      function scheduleProcessedUpdate() {
        // We no longer rely on processedImageData string conversion, saving workflow bloat
      }

      function showPreview(dataUrl) {
        imageData = dataUrl;
        previewImg.src = dataUrl;
        previewImg.style.display = "block";
        uploadLabel.style.display = "none";
        clearBtn.style.display = "block";
        uploadArea.style.border = "none";
        refreshFilter();
        scheduleProcessedUpdate();
      }

      function clearPreview() {
        imageData = "";
        imagePath = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        uploadLabel.style.display = "block";
        clearBtn.style.display = "none";
        uploadArea.style.border = "2px dashed #555";
        fileInput.value = "";
      }

      async function loadFile(file) {
        try {
          const body = new FormData();
          body.append("image", file);
          body.append("type", "input");

          const resp = await api.fetchApi("/upload/image", { method: "POST", body });
          if (resp.status === 200) {
            const data = await resp.json();
            imagePath = data.subfolder ? data.subfolder + "/" + data.name : data.name;
            const viewUrl = api.apiURL(`/view?filename=${encodeURIComponent(data.name)}&type=input&subfolder=${encodeURIComponent(data.subfolder || "")}&t=${Date.now()}`);
            showPreview(viewUrl);
          } else {
            console.error("Upload failed", resp.status, await resp.text());
          }
        } catch (e) {
          console.error("Upload error", e);
        }
      }

      uploadArea.addEventListener("click", (e) => {
        if (e.target === clearBtn) return;
        fileInput.click();
      });
      clearBtn.addEventListener("click", (e) => { e.stopPropagation(); clearPreview(); });

      // ── Right-click context menu ─────────────────────────────────────────
      function makeMenuItem(text) {
        const item = document.createElement("div");
        item.textContent = text;
        item.style.cssText =
          "padding:6px 14px;margin:0 5px;border-radius:4px;font-size:12px;" +
          "color:#ddd;cursor:pointer;white-space:nowrap;";
        item.addEventListener("mouseenter", () => { item.style.background = "#3a3a3a"; });
        item.addEventListener("mouseleave", () => { item.style.background = ""; });
        return item;
      }

      uploadArea.addEventListener("contextmenu", async (e) => {
        e.preventDefault(); e.stopPropagation();

        const existing = document.getElementById("itools-ctx-menu");
        if (existing) existing.remove();

        const menu = document.createElement("div");
        menu.id = "itools-ctx-menu";
        menu.style.cssText =
          "position:fixed;z-index:99999;background:#2a2a2a;border:1px solid #555;" +
          "border-radius:6px;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,.6);";

        // remove context when mouse leaves
        menu.addEventListener("mouseleave", () => { menu.remove(); });

        const pasteItem = makeMenuItem("Paste image");
        pasteItem.addEventListener("click", async () => {
          menu.remove();
          try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
              const imageType = item.types.find((t) => t.startsWith("image/"));
              if (imageType) {
                const blob = await item.getType(imageType);
                const file = new File([blob], "pasted_image.png", { type: imageType });
                loadFile(file);
                return;
              }
            }
            alert("No image found in clipboard.");
          } catch (err) { alert("Could not read clipboard: " + err.message); }
        });

        const copyItem = makeMenuItem("Copy image");
        if (!imageData) copyItem.style.color = "#555";
        copyItem.addEventListener("click", async () => {
          menu.remove();
          if (!imageData) return;
          try {
            const dataUrl = await getFilteredDataUrl();
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          } catch (err) { alert("Could not copy to clipboard: " + err.message); }
        });

        const saveItem = makeMenuItem("Save image");
        if (!imageData) saveItem.style.color = "#555";
        saveItem.addEventListener("click", async () => {
          menu.remove();
          if (!imageData) return;
          try {
            const dataUrl = await getFilteredDataUrl();
            const a = document.createElement("a");
            a.href = dataUrl; a.download = "image_adjust.png"; a.click();
          } catch (err) { alert("Could not save image: " + err.message); }
        });

        const openItem = makeMenuItem("Open image");
        if (!imageData) openItem.style.color = "#555";
        openItem.addEventListener("click", async () => {
          menu.remove();
          if (!imageData) return;
          try {
            const dataUrl = await getFilteredDataUrl();
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
          } catch (err) { alert("Could not open image: " + err.message); }
        });

        menu.appendChild(openItem);
        menu.appendChild(copyItem);
        menu.appendChild(pasteItem);
        menu.appendChild(saveItem);
        
        document.body.appendChild(menu);

        const mw = 240, mh = 144;
        menu.style.left = Math.min(e.clientX, window.innerWidth  - mw - 8) + "px";
        menu.style.top  = Math.min(e.clientY, window.innerHeight - mh - 8) + "px";

        const close = (ev) => {
          if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener("mousedown", close); }
        };
        document.addEventListener("mousedown", close);
      });

      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault(); uploadArea.style.borderColor = "#7ab";
      });
      uploadArea.addEventListener("dragleave", () => { uploadArea.style.borderColor = "#555"; });
      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault(); uploadArea.style.borderColor = "#555";
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) loadFile(file);
      });
      fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) loadFile(fileInput.files[0]);
      });

      // ── Slider helper ────────────────────────────────────────────────────
      function makeSlider(label, min, max, initValue, formatValue) {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;width:90%;box-sizing:border-box;";

        const lbl = document.createElement("span");
        lbl.textContent = label;
        lbl.style.cssText = "color:#aaa;font-size:11px;min-width:72px;flex-shrink:0;";

        const slider = document.createElement("input");
        slider.type = "range"; slider.min = min; slider.max = max; slider.value = initValue;
        slider.style.cssText = "flex:1;cursor:pointer;accent-color:#4a9eff;min-width:0;";

        const valDisplay = document.createElement("span");
        valDisplay.textContent = formatValue(initValue);
        valDisplay.style.cssText =
          "color:#aaa;font-size:11px;min-width:36px;text-align:right;" +
          "font-family:monospace;flex-shrink:0;";

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "↺";
        resetBtn.title = "Reset to default";
        resetBtn.style.cssText =
          "margin-left:4px;width:16px;height:16px;padding:0;border:none;" +
          "background:none;color:#666;font-size:12px;cursor:pointer;flex-shrink:0;" +
          "line-height:1;display:flex;align-items:center;justify-content:center;";
        resetBtn.addEventListener("mouseenter", () => { resetBtn.style.color = "#aaa"; });
        resetBtn.addEventListener("mouseleave", () => { resetBtn.style.color = "#666"; });
        resetBtn.addEventListener("click", () => {
          slider.value = initValue;
          valDisplay.textContent = formatValue(initValue);
          slider.dispatchEvent(new Event("input"));
        });

        slider.addEventListener("input", () => {
          valDisplay.textContent = formatValue(Number(slider.value));
        });

        row.appendChild(lbl); row.appendChild(slider);
        row.appendChild(valDisplay); row.appendChild(resetBtn);
        return { row, slider, valDisplay };
      }

      const fmtSign  = (v) => (v >= 0 ? "+" : "") + v;
      const fmtPct   = (v) => v + "%";
      const fmtDeg   = (v) => (v >= 0 ? "+" : "") + v + "°";
      const fmtGamma = (v) => (v / 100).toFixed(2);

      // Slider ranges: designed so the neutral/default sits at a natural midpoint
      // Brightness : -100..+100  neutral=0     (±100% of image brightness)
      // Contrast   :   50..200   neutral=100   (50% = low contrast, 200% = high)
      // Saturation :    0..200   neutral=100   (0 = grayscale, 200 = vivid)
      // Temperature: -100..+100  neutral=0     (neg = cool, pos = warm)
      // Gamma      :   25..400   neutral=100   (0.25..4.0 — wide range for correction)
      // Sharpness  :    0..200   neutral=100   (0 = soft, 200 = very sharp)
      // Hue        : -180..+180  neutral=0     (full rotation in degrees)
      const brightnessCtrl  = makeSlider("Brightness",   -100, 100,  0,   fmtSign);
      const contrastCtrl    = makeSlider("Contrast",        50, 200, 100,  fmtPct);
      const saturationCtrl  = makeSlider("Saturation",       0, 200, 100,  fmtPct);
      const temperatureCtrl = makeSlider("Temperature",   -100, 100,  0,   fmtSign);
      const gammaCtrl       = makeSlider("Gamma",            25, 400, 100,  fmtGamma);
      const sharpnessCtrl   = makeSlider("Sharpness",         0, 200, 100,  fmtPct);
      const hueCtrl         = makeSlider("Hue",            -180, 180,  0,   fmtDeg);

      function onSliderChange() {
        brightness  = parseInt(brightnessCtrl.slider.value,  10);
        contrast    = parseInt(contrastCtrl.slider.value,    10);
        saturation  = parseInt(saturationCtrl.slider.value,  10);
        temperature = parseInt(temperatureCtrl.slider.value, 10);
        gamma       = parseInt(gammaCtrl.slider.value,       10);
        sharpness   = parseInt(sharpnessCtrl.slider.value,   10);
        hue         = parseInt(hueCtrl.slider.value,         10);
        refreshFilter();
        scheduleProcessedUpdate();
      }

      for (const ctrl of [brightnessCtrl, contrastCtrl, saturationCtrl,
                          temperatureCtrl, gammaCtrl, sharpnessCtrl, hueCtrl]) {
        ctrl.slider.addEventListener("input", onSliderChange);
      }

      // ── Assemble ─────────────────────────────────────────────────────────
      container.appendChild(uploadArea);
      container.appendChild(fileInput);
      container.appendChild(brightnessCtrl.row);
      container.appendChild(contrastCtrl.row);
      container.appendChild(saturationCtrl.row);
      container.appendChild(temperatureCtrl.row);
      container.appendChild(gammaCtrl.row);
      container.appendChild(sharpnessCtrl.row);
      container.appendChild(hueCtrl.row);

      // ── Auto-detect upstream image changes ───────────────────────────────
      const node = this;
      let _lastUpstreamSnapshot = "";

      function getUpstreamSnapshot() {
        const graph = node.graph;
        if (!graph) return "";
        const inp = (node.inputs || []).find((i) => i.name === "image");
        if (!inp || inp.link == null) return "";
        const link = graph.links[inp.link];
        if (!link) return "";
        const src = graph.getNodeById(link.origin_id);
        if (!src) return "";
        const pieces = [];
        if (src.comfyClass === "LoadImage" || src.type === "LoadImage") {
          const w = (src.widgets || []).find((w) => w.name === "image");
          if (w) pieces.push("file=" + w.value);
        }
        if (src.imgs?.length) {
          const img = src.imgs[link.origin_slot] || src.imgs[0];
          const s = typeof img === "string" ? img : img?.src || "";
          pieces.push("prev=" + s);
        }
        return pieces.join("|");
      }

      function getUpstreamImageUrl() {
        const graph = node.graph;
        if (!graph) return null;
        const inp = (node.inputs || []).find((i) => i.name === "image");
        if (!inp || inp.link == null) return null;
        const link = graph.links[inp.link];
        if (!link) return null;
        const src = graph.getNodeById(link.origin_id);
        if (!src) return null;
        if (src.imgs?.length) {
          const img = src.imgs[link.origin_slot] || src.imgs[0];
          const s = typeof img === "string" ? img : img?.src || "";
          if (s) return s + (s.includes("?") ? "&" : "?") + "t=" + Date.now();
        }
        if (src.comfyClass === "LoadImage" || src.type === "LoadImage") {
          const w = (src.widgets || []).find((w) => w.name === "image");
          if (w?.value)
            return `/view?filename=${encodeURIComponent(w.value)}&type=input&t=${Date.now()}`;
        }
        return null;
      }

      updateSvgFilter();

      const origOnRemoved = node.onRemoved;
      node.onRemoved = function () {
        origOnRemoved?.apply(this, arguments);
        svgEl.remove();
      };

      const origOnDrawForeground = node.onDrawForeground;
      node.onDrawForeground = function (_ctx) {
        origOnDrawForeground?.apply(this, arguments);
        const snap = getUpstreamSnapshot();
        if (snap && snap !== _lastUpstreamSnapshot) {
          _lastUpstreamSnapshot = snap;
          const url = getUpstreamImageUrl();
          if (url) {
            imagePath = ""; // Driven via graph, not saved
            showPreview(url);
          }
        }
      };

      const origOnConnectionsChange = node.onConnectionsChange;
      node.onConnectionsChange = function (_type, index, connected, _linkInfo) {
        origOnConnectionsChange?.apply(this, arguments);
        const inp = (node.inputs || [])[index];
        if (inp?.name !== "image") return;
        if (!connected) { _lastUpstreamSnapshot = ""; clearPreview(); }
        else { _lastUpstreamSnapshot = ""; }
      };

      // ── Register the DOM widget ──────────────────────────────────────────
      this.addDOMWidget("widget_state", "imageAdjust", container, {
        getValue() {
          return JSON.stringify({
            brightness, contrast, saturation, temperature, gamma, sharpness, hue,
            imagePath, // saving the server path instead of base64
          });
        },
        setValue(val) {
          try {
            const state = typeof val === "string" ? JSON.parse(val) : val;
            brightness  = state.brightness  ?? 0;
            contrast    = state.contrast    ?? 100;
            saturation  = state.saturation  ?? 100;
            temperature = state.temperature ?? 0;
            gamma       = state.gamma       ?? 100;
            sharpness   = state.sharpness   ?? 100;
            hue         = state.hue         ?? 0;
            imagePath   = state.imagePath   ?? "";

            brightnessCtrl.slider.value  = brightness;
            brightnessCtrl.valDisplay.textContent = fmtSign(brightness);
            contrastCtrl.slider.value    = contrast;
            contrastCtrl.valDisplay.textContent   = fmtPct(contrast);
            saturationCtrl.slider.value  = saturation;
            saturationCtrl.valDisplay.textContent = fmtPct(saturation);
            temperatureCtrl.slider.value = temperature;
            temperatureCtrl.valDisplay.textContent = fmtSign(temperature);
            gammaCtrl.slider.value       = gamma;
            gammaCtrl.valDisplay.textContent      = fmtGamma(gamma);
            sharpnessCtrl.slider.value   = sharpness;
            sharpnessCtrl.valDisplay.textContent  = fmtPct(sharpness);
            hueCtrl.slider.value         = hue;
            hueCtrl.valDisplay.textContent        = fmtDeg(hue);

            if (imagePath) {
               const parts = imagePath.split("/");
               const filename = parts.pop();
               const subfolder = parts.join("/");
               const viewUrl = api.apiURL(`/view?filename=${encodeURIComponent(filename)}&type=input&subfolder=${encodeURIComponent(subfolder)}&t=${Date.now()}`);
               showPreview(viewUrl);
            } else if (state.imageData) {
               showPreview(state.imageData);
            } else {
               clearPreview();
            }
          } catch (_) {}
        },
      });

      // Force canvas update after 100ms
      setTimeout(() => {
        container.style.display = "flex";
        node.setDirtyCanvas(true, true);
      }, 200);
      
    };
  },
});
