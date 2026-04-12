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

      // ── State ────────────────────────────────────────────────────────────
      let imageData = "";  // base64 data URL of the uploaded image
      let brightness = 0;  // integer -100..+100
      let contrast = 100;  // integer 0..200

      // ── Root container ───────────────────────────────────────────────────
      const container = document.createElement("div");
      container.style.cssText =
        "display:flex;flex-direction:column;gap:4px;padding:0px;" +
        "width:100%;height:100%;box-sizing:border-box; align-items:center;";

      // ── Upload / preview area ────────────────────────────────────────────
      const uploadArea = document.createElement("div");
      uploadArea.style.cssText =
        "width:100%;height:100%;border:2px dashed #555;border-radius:8px;" +
        "display:flex;align-items:center;justify-content:center;" +
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
        refreshFilter();
      }

      function clearPreview() {
        imageData = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        uploadLabel.style.display = "block";
        clearBtn.style.display = "none";
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

      const fmtBrightness = (v) => (v >= 0 ? "+" : "") + v;
      const fmtContrast   = (v) => v + "%";

      // Apply CSS filters to the preview so it matches the Python output in real time.
      // CSS brightness(1) = PIL factor 1.0 (unchanged), contrast(1) = PIL factor 1.0.
      function refreshFilter() {
        const b = 1.0 + brightness / 100; // same formula as Python
        const c = contrast / 100;
        previewImg.style.filter = `brightness(${b}) contrast(${c})`;
      }

      const brightnessCtrl = makeSlider("Brightness", -100, 100, 0,   fmtBrightness);
      const contrastCtrl   = makeSlider("Contrast",     0,  200, 100, fmtContrast);

      brightnessCtrl.slider.addEventListener("input", () => {
        brightness = parseInt(brightnessCtrl.slider.value, 10);
        refreshFilter();
      });
      contrastCtrl.slider.addEventListener("input", () => {
        contrast = parseInt(contrastCtrl.slider.value, 10);
        refreshFilter();
      });

      // ── Assemble ─────────────────────────────────────────────────────────
      container.appendChild(uploadArea);
      container.appendChild(fileInput);
      container.appendChild(brightnessCtrl.row);
      container.appendChild(contrastCtrl.row);

      // ── Register the DOM widget ──────────────────────────────────────────
      // name must match the Python input name "widget_state"
      const widget = this.addDOMWidget("widget_state", "imageAdjust", container, {
        getValue() {
          return JSON.stringify({ brightness, contrast, imageData });
        },
        setValue(val) {
          try {
            const state = typeof val === "string" ? JSON.parse(val) : val;

            brightness = state.brightness ?? 0;
            contrast   = state.contrast   ?? 100;
            imageData  = state.imageData  ?? "";

            brightnessCtrl.slider.value = brightness;
            brightnessCtrl.valDisplay.textContent = fmtBrightness(brightness);

            contrastCtrl.slider.value = contrast;
            contrastCtrl.valDisplay.textContent = fmtContrast(contrast);

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
