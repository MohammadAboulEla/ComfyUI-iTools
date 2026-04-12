import { app } from "../../../scripts/app.js";

app.registerExtension({
  name: "iTools.ImageAdjust",

  beforeRegisterNodeDef(nodeType, nodeData) {
    console.log(nodeData.name);
    if (nodeData.name !== "iToolsImageAdjust") return;

    const origOnNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      origOnNodeCreated?.apply(this, arguments);

      // Remove the default string widget auto-created for widget_state
      const idx = this.widgets?.findIndex((w) => w.name === "widget_state");
      if (idx !== undefined && idx !== -1) {
        this.widgets.splice(idx, 1);
      }
      // init size
      this.size = [256, 300];

      // ── State ────────────────────────────────────────────────────────────
      let imageData = "";  // base64 data URL of the uploaded image
      let brightness = 0;   // -100..+100
      let contrast   = 100; // 0..200
      let saturation = 100; // 0..200
      let temperature = 0;  // -100..+100  (negative = cool, positive = warm)
      let gamma      = 100; // 10..300  (stored as integer; /100 → float 0.1..3.0)
      let sharpness  = 100; // 0..200
      let hue        = 0;   // -180..+180 degrees

      // ── Root container ───────────────────────────────────────────────────
      const container = document.createElement("div");
      container.style.cssText =
        "display:flex;flex-direction:column;gap:4px;padding:0px;" +
        "width:100%;height:100%;box-sizing:border-box; align-items:center;";

      // ── Upload / preview area ────────────────────────────────────────────
      const uploadArea = document.createElement("div");
      uploadArea.style.cssText =
        "width:100%;height:100%;border:2px dashed #555;border-radius:8px;" +
        "margin-bottom:5px; display:flex;align-items:center;justify-content:center;" +
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

      // Small ✕ button to clear the uploaded image
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

      // Hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";

      function showPreview(dataUrl) {
        imageData = dataUrl;
        previewImg.src = dataUrl;
        previewImg.style.display = "block";
        uploadLabel.style.display = "none";
        clearBtn.style.display = "block";
        uploadArea.style.border = "none";
        refreshFilter();
      }

      function clearPreview() {
        imageData = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        uploadLabel.style.display = "block";
        clearBtn.style.display = "none";
        uploadArea.style.border = "2px dashed #555";
        fileInput.value = "";
      }

      function loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => showPreview(e.target.result);
        reader.readAsDataURL(file);
      }

      uploadArea.addEventListener("click", (e) => {
        if (e.target === clearBtn) return;
        fileInput.click();
      });

      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearPreview();
      });

      // ── Right-click context menu ─────────────────────────────────────────
      uploadArea.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Remove any existing context menu
        const existing = document.getElementById("itools-ctx-menu");
        if (existing) existing.remove();

        const menu = document.createElement("div");
        menu.id = "itools-ctx-menu";
        menu.style.cssText =
          "position:fixed;z-index:99999;background:#2a2a2a;border:1px solid #555;" +
          "border-radius:6px;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,.6);";

        const pasteItem = document.createElement("div");
        pasteItem.textContent = "Paste image from clipboard";
        pasteItem.style.cssText =
          "padding:6px 14px;margin-left:5px;margin-right:5px;font-size:12px;color:#ddd;cursor:pointer;white-space:nowrap;";
        pasteItem.addEventListener("mouseenter", () => { pasteItem.style.background = "#3a3a3a"; });
        pasteItem.addEventListener("mouseleave", () => { pasteItem.style.background = "";
            menu.remove(); });
        pasteItem.addEventListener("click", async () => {
          menu.remove();
          try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
              const imageType = item.types.find((t) => t.startsWith("image/"));
              if (imageType) {
                const blob = await item.getType(imageType);
                const reader = new FileReader();
                reader.onload = (ev) => showPreview(ev.target.result);
                reader.readAsDataURL(blob);
                return;
              }
            }
            alert("No image found in clipboard.");
          } catch (err) {
            alert("Could not read clipboard: " + err.message);
          }
        });

        menu.appendChild(pasteItem);
        document.body.appendChild(menu);

        // Position near cursor, keeping inside viewport
        const mw = 220, mh = 36;
        const left = Math.min(e.clientX, window.innerWidth  - mw - 8);
        const top  = Math.min(e.clientY, window.innerHeight - mh - 8);
        menu.style.left = left + "px";
        menu.style.top  = top  + "px";

        // Close on any outside interaction
        const close = (ev) => {
          if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener("mousedown", close); }
        };
        document.addEventListener("mousedown", close);
      });

      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "#7ab";
      });

      uploadArea.addEventListener("dragleave", () => {
        uploadArea.style.borderColor = "#555";
      });

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "#555";
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) loadFile(file);
      });

      fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) loadFile(fileInput.files[0]);
      });

      // ── Slider helper ────────────────────────────────────────────────────
      function makeSlider(label, min, max, initValue, formatValue) {
        const row = document.createElement("div");
        row.style.cssText =
          "display:flex;align-items:center;width:90%;box-sizing:border-box;";

        const lbl = document.createElement("span");
        lbl.textContent = label;
        lbl.style.cssText =
          "color:#aaa;font-size:11px;min-width:72px;flex-shrink:0;";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = min;
        slider.max = max;
        slider.value = initValue;
        slider.style.cssText = "flex:1;cursor:pointer;accent-color:#4a9eff;min-width:0;";

        const valDisplay = document.createElement("span");
        valDisplay.textContent = formatValue(initValue);
        valDisplay.style.cssText =
          "color:#aaa;font-size:11px;min-width:30px;text-align:right;" +
          "font-family:monospace;flex-shrink:0;";

        slider.addEventListener("input", () => {
          valDisplay.textContent = formatValue(Number(slider.value));
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        row.appendChild(valDisplay);

        return { row, slider, valDisplay };
      }

      const fmtSign    = (v) => (v >= 0 ? "+" : "") + v;
      const fmtPct     = (v) => v + "%";
      const fmtDeg     = (v) => (v >= 0 ? "+" : "") + v + "°";
      const fmtGamma   = (v) => (v / 100).toFixed(2);

      // ── SVG filter for gamma + temperature (no CSS equivalent) ─────────
      const svgNS = "http://www.w3.org/2000/svg";
      const svgEl = document.createElementNS(svgNS, "svg");
      svgEl.setAttribute("width", "0");
      svgEl.setAttribute("height", "0");
      svgEl.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";

      const filterId = "itools-img-adjust-" + Math.random().toString(36).slice(2);
      const filterEl = document.createElementNS(svgNS, "filter");
      filterEl.setAttribute("id", filterId);
      filterEl.setAttribute("color-interpolation-filters", "linearRGB");

      // feColorMatrix for temperature: scales R and B channels
      const tempMatrix = document.createElementNS(svgNS, "feColorMatrix");
      tempMatrix.setAttribute("type", "matrix");
      tempMatrix.setAttribute("result", "tempOut");

      // feComponentTransfer for gamma on each channel
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
        // Temperature: strength in -1..+1, mirrors Python ±30% on R/B
        const t = (temperature / 100) * 0.3;
        const rScale = 1.0 + t;
        const bScale = 1.0 - t;
        // feColorMatrix identity with R and B scaled:
        // R' = rScale*R, G' = G, B' = bScale*B
        tempMatrix.setAttribute("values",
          `${rScale} 0 0 0 0  ` +
          `0 1 0 0 0  ` +
          `0 0 ${bScale} 0 0  ` +
          `0 0 0 1 0`
        );

        // Gamma: CSS feComponentTransfer exponent = 1/gamma (same as Python)
        const exp = 1.0 / Math.max(gamma / 100, 0.01);
        for (const fn of [gammaR, gammaG, gammaB]) {
          fn.setAttribute("exponent", exp.toFixed(4));
        }
      }

      // Apply CSS filters to the preview so it matches the Python output in real time.
      function refreshFilter() {
        const b = 1.0 + brightness / 100;
        const c = contrast / 100;
        const s = saturation / 100;
        const h = hue;
        updateSvgFilter();
        previewImg.style.filter =
          `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${h}deg) url(#${filterId})`;
      }

      const brightnessCtrl  = makeSlider("Brightness",   -100, 100,  0,   fmtSign);
      const contrastCtrl    = makeSlider("Contrast",        0, 200, 100,   fmtPct);
      const saturationCtrl  = makeSlider("Saturation",      0, 200, 100,   fmtPct);
      const temperatureCtrl = makeSlider("Temperature",  -100, 100,   0,   fmtSign);
      const gammaCtrl       = makeSlider("Gamma",           10, 300, 100,   fmtGamma);
      const sharpnessCtrl   = makeSlider("Sharpness",       0, 200, 100,   fmtPct);
      const hueCtrl         = makeSlider("Hue",           -180, 180,   0,   fmtDeg);

      brightnessCtrl.slider.addEventListener("input", () => {
        brightness = parseInt(brightnessCtrl.slider.value, 10);
        refreshFilter();
      });
      contrastCtrl.slider.addEventListener("input", () => {
        contrast = parseInt(contrastCtrl.slider.value, 10);
        refreshFilter();
      });
      saturationCtrl.slider.addEventListener("input", () => {
        saturation = parseInt(saturationCtrl.slider.value, 10);
        refreshFilter();
      });
      temperatureCtrl.slider.addEventListener("input", () => {
        temperature = parseInt(temperatureCtrl.slider.value, 10);
        refreshFilter();
      });
      gammaCtrl.slider.addEventListener("input", () => {
        gamma = parseInt(gammaCtrl.slider.value, 10);
        refreshFilter();
      });
      sharpnessCtrl.slider.addEventListener("input", () => {
        sharpness = parseInt(sharpnessCtrl.slider.value, 10);
        // no CSS sharpness equivalent — preview won't reflect this
      });
      hueCtrl.slider.addEventListener("input", () => {
        hue = parseInt(hueCtrl.slider.value, 10);
        refreshFilter();
      });

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
      // LiteGraph has no "upstream widget changed" hook, so we snapshot
      // the connected image input each frame and reload when it differs.
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
        // Prefer executed preview (imgs array)
        if (src.imgs?.length) {
          const img = src.imgs[link.origin_slot] || src.imgs[0];
          const s = typeof img === "string" ? img : img?.src || "";
          if (s) return s + (s.includes("?") ? "&" : "?") + "t=" + Date.now();
        }
        // Fall back to LoadImage file URL
        if (src.comfyClass === "LoadImage" || src.type === "LoadImage") {
          const w = (src.widgets || []).find((w) => w.name === "image");
          if (w?.value) {
            return `/view?filename=${encodeURIComponent(w.value)}&type=input&t=${Date.now()}`;
          }
        }
        return null;
      }

      // Initialise SVG filter to neutral values before any slider interaction
      updateSvgFilter();

      // Clean up the SVG element when the node is removed from the graph
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
          if (url) showPreview(url);
        }
      };

      const origOnConnectionsChange = node.onConnectionsChange;
      node.onConnectionsChange = function (_type, index, connected, _linkInfo) {
        origOnConnectionsChange?.apply(this, arguments);
        const inp = (node.inputs || [])[index];
        if (inp?.name !== "image") return;
        if (!connected) {
          // Connection removed — clear upstream preview (keep manual upload if any)
          _lastUpstreamSnapshot = "";
          clearPreview();
        } else {
          // Connection added — snapshot will be picked up on next draw frame
          _lastUpstreamSnapshot = "";
        }
      };

      // ── Register the DOM widget ──────────────────────────────────────────
      // name must match the Python input name "widget_state"
      const widget = this.addDOMWidget("widget_state", "imageAdjust", container, {
        getValue() {
          return JSON.stringify({
            brightness, contrast, saturation, temperature, gamma, sharpness, hue, imageData,
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
            imageData   = state.imageData   ?? "";

            brightnessCtrl.slider.value  = brightness;
            brightnessCtrl.valDisplay.textContent  = fmtSign(brightness);

            contrastCtrl.slider.value    = contrast;
            contrastCtrl.valDisplay.textContent    = fmtPct(contrast);

            saturationCtrl.slider.value  = saturation;
            saturationCtrl.valDisplay.textContent  = fmtPct(saturation);

            temperatureCtrl.slider.value = temperature;
            temperatureCtrl.valDisplay.textContent = fmtSign(temperature);

            gammaCtrl.slider.value       = gamma;
            gammaCtrl.valDisplay.textContent       = fmtGamma(gamma);

            sharpnessCtrl.slider.value   = sharpness;
            sharpnessCtrl.valDisplay.textContent   = fmtPct(sharpness);

            hueCtrl.slider.value         = hue;
            hueCtrl.valDisplay.textContent         = fmtDeg(hue);

            if (imageData) {
              showPreview(imageData);
            } else {
              clearPreview();
            }
          } catch (_) {
            // Ignore malformed state — keep current values
          }
        },
      });

      // Height: upload area 120px + 2 sliders ~26px each + gaps/padding ~30px
    //   widget.computeSize = () => [260, 215];
    };
  },
});
