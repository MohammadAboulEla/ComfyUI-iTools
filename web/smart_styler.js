import { app } from "../../../scripts/app.js";

app.registerExtension({
  name: "iTools.promptMixer",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsPromptMixer") {
      const originalOnExecuted = nodeType.prototype.onExecuted;
      nodeType.prototype.onExecuted = function (message) {
        originalOnExecuted?.apply(this, arguments);
        if (message.prompt !== undefined) {
          // This allows the UI to reflect the merged state if it was done on server
          const widget = this.widgets.find(
            (w) => w.name === "PromptMixerWidget",
          );
          if (widget && widget.set_value) {
            widget.set_value(message);
          }
        }
        if (message.style === "none") {
          // Reset style dropdown if it was merged
          const widget = this.widgets.find(
            (w) => w.name === "PromptMixerWidget",
          );
          if (widget && widget.reset_style) {
            widget.reset_style();
          }
        }
      };
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPromptMixer") return;

    let pendingValue = null;
    const container = document.createElement("div");
    container.style.cssText = `
        box-sizing: border-box;
        display: flex;
        flex-direction: column; 
        padding: 5px; 
        height: 100%; 
        background: #1c1c1c; 
        border-radius: 8px; 
        color: white; 
        font-family: sans-serif;
    `;

    // Prompt Area Wrapper for Absolute Positioning
    const promptWrapper = document.createElement("div");
    promptWrapper.style.cssText = `
        position: relative;
        flex: 2;
        width: 100%;
    `;

    // Textarea
    const promptArea = document.createElement("textarea");
    promptArea.placeholder = "Base prompt...";
    promptArea.style.cssText = `
        width: 100%;
        height: 100%;
        background: #333;
        border: 1px solid #444;
        border-radius: 6px;
        color: #ddd;
        padding: 5px;
        padding-right: 20px; 
        resize: none;
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
    `;
    promptArea.onfocus = () => (promptArea.style.borderColor = "#555");

    const updateIconPositions = () => {
      const hasScrollBar = promptArea.scrollHeight > promptArea.clientHeight;
      const rightOffset = hasScrollBar ? "20px" : "0px";
      resetBtn.style.right = rightOffset;
      copyBtn.style.right = rightOffset;
    };

    promptArea.oninput = updateIconPositions;
    let promptHistory = [];
    let negHistory = [];

    // Negative Prompt Wrapper
    const negativeWrapper = document.createElement("div");
    negativeWrapper.style.cssText = `
        position: relative;
        flex: 1;
        width: 100%;
        display: none;
        margin-top: 5px;
    `;

    const negativeArea = document.createElement("textarea");
    negativeArea.placeholder = "Negative prompt...";
    negativeArea.style.cssText = promptArea.style.cssText;
    negativeArea.oninput = updateIconPositions;

    // Reset Button (moved here)
    const resetBtn = document.createElement("button");
    resetBtn.innerHTML = `&#x21BB;`;
    resetBtn.title = "Undo | Reset";
    const actionBtnStyle = `
        position: absolute;
        right: 5px;
        background: transparent;
        border: none;
        color: #888;
        width: 20px;
        height: 20px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
        z-index: 10;
    `;
    resetBtn.style.cssText = actionBtnStyle + "top: 0px;";
    resetBtn.onmouseover = () => (resetBtn.style.color = "#fff");
    resetBtn.onmouseout = () => (resetBtn.style.color = "#888");

    // // Copy Button
    const copyBtn = document.createElement("button");
    copyBtn.innerHTML = `🗒`; // Clipboard icon
    copyBtn.title = "Copy to clipboard";
    copyBtn.style.cssText = actionBtnStyle + "top: 20px; display: none;";
    copyBtn.onmouseover = () => (copyBtn.style.color = "#fff");
    copyBtn.onmouseout = () => (copyBtn.style.color = "#888");

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(promptArea.value);
      app.extensionManager.toast.add({
        severity: "success",
        summary: "Copied!",
        detail: "Prompt copied to clipboard",
        life: 2000,
      });
    };

    promptWrapper.appendChild(promptArea);
    promptWrapper.appendChild(resetBtn);
    promptWrapper.appendChild(copyBtn);

    negativeWrapper.appendChild(negativeArea);

    // Selectors Section
    const selectorContainer = document.createElement("div");
    selectorContainer.style.cssText = `
        display: flex;
        width: 100%;
        gap: 5px;
    `;

    const createDropdown = (labelStr, placeholder) => {
      const col = document.createElement("div");
      col.style.cssText = `
        display: flex;
        flex-direction: column;
        padding: 0px;
        flex: 1; 
        `;

      const label = document.createElement("label");
      label.innerText = labelStr;
      label.style.cssText = ` 
            font-size: 10px; 
            padding-top: 5px;
            padding-bottom: 5px; 
            color: #555; 
            letter-spacing: 0.5px;`;

      const select = document.createElement("select");
      select.style.cssText = `
            width: 100%;
            background: #333;
            border: 1px solid #444;
            border-radius: 6px;
            color: #ddd;
            font-size: 12px;
            padding: 2.5px 10px; 
            outline: none;
            cursor: pointer;

        `;

      col.appendChild(label);
      col.appendChild(select);
      return { col, select, label };
    };

    const categoryRes = createDropdown("CATEGORY", "Basic");
    const styleRes = createDropdown("STYLE", "none");

    categoryRes.col.style.flex = "2";
    styleRes.col.style.flex = "3";

    selectorContainer.appendChild(categoryRes.col);
    selectorContainer.appendChild(styleRes.col);

    // Buttons Section
    const btnContainer = document.createElement("div");
    btnContainer.style.cssText = `
        display: flex;
        gap: 5px;
        margin-top: 5px;
        align-items: center;
    `;

    // Function to apply styles and states to buttons
    const applyButtonStyle = (btn) => {
      // Base colors using a modern dark palette
      const colors = {
        base: "#222",
        border: "#444",
        hover: "#333",
        press: "#444",
      };

      btn.style.cssText = `
        background: ${colors.base};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        color: #ddd;
        padding: 5px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        letter-spacing: 0.5px;
        height: 28px;
        outline: none;
        user-select: none;
    `;

      // Hover State
      btn.onmouseenter = () => {
        btn.style.background = colors.hover;
        btn.style.borderColor = "#555";
      };

      // Normal State
      btn.onmouseleave = () => {
        btn.style.background = colors.base;
        btn.style.borderColor = colors.border;
      };

      // Pressed State
      btn.onmousedown = () => {
        btn.style.background = colors.press;
        btn.style.borderColor = "#666";
        btn.style.transform = "translateY(1px)"; // Subtle shrink on click
      };

      // Release State
      btn.onmouseup = () => {
        btn.style.background = colors.hover;
        btn.style.transform = "translateY(0)";
      };
    };

    // Merge Button
    const mergeBtn = document.createElement("button");
    mergeBtn.innerHTML = `<span style="margin-right: 8px; font-size: 12px;">✨</span> MERGE STYLE`;
    applyButtonStyle(mergeBtn);
    mergeBtn.style.flex = "3";

    // Append Button
    const appendBtn = document.createElement("button");
    appendBtn.innerHTML = `<span style="margin-right: 8px; font-size: 12px; opacity: 0.7;">☰</span> APPEND`;
    applyButtonStyle(appendBtn);
    appendBtn.style.flex = "1";

    // NEG Toggle Switch
    const negToggle = document.createElement("div");
    applyButtonStyle(negToggle);

    const switchText = document.createElement("span");
    switchText.innerText = "🌕";
    switchText.style.cssText =
      "font-size: 9px; color: #888; font-weight: bold; letter-spacing: 0.5px;";

    negToggle.appendChild(switchText);

    let negState = 0; // 0: Off, 1: Output only (🌔), 2: Output + Textarea (🌓)
    const updateNegState = (val, initial = false) => {
      negState = typeof val === "boolean" ? (val ? 2 : 0) : val;

      if (negState === 1 || negState === 2) {
        switchText.innerText = negState === 1 ? "🌔" : "🌓";
        switchText.style.color = "#fff";
        negToggle.style.borderColor = "#3b82f6";
        negativeWrapper.style.display = negState === 2 ? "block" : "none";
        if (node.outputs.length < 2) node.addOutput("negative", "STRING");
      } else {
        negState = 0;
        switchText.innerText = "🌕";
        switchText.style.color = "#888";
        negToggle.style.borderColor = "#444";
        negativeWrapper.style.display = "none";
        if (node.outputs.length > 1) node.removeOutput(1);
      }
    };
    updateNegState(0); // Ensure no negative output on init

    negToggle.onclick = () => {
      updateNegState((negState + 1) % 3);
      updateIconPositions();
      app.graph.setDirtyCanvas(true);
    };

    btnContainer.appendChild(negToggle);
    // btnContainer.appendChild(appendBtn); // disable for now, keep for future
    btnContainer.appendChild(mergeBtn);

    container.appendChild(promptWrapper);
    container.appendChild(negativeWrapper);
    container.appendChild(selectorContainer);
    container.appendChild(btnContainer);

    // Initial load
    const loadStyles = async () => {
      try {
        const resp = await fetch("/itools/get_styler_data");
        const data = await resp.json();

        categoryRes.select.innerHTML = "";
        data.styles.forEach((s) => {
          const opt = document.createElement("option");
          opt.value = opt.text = s;
          categoryRes.select.appendChild(opt);
        });

        const defaultStyle =
          pendingValue?.category ||
          (data.styles.includes("basic.yaml") ? "basic.yaml" : data.styles[0]);
        if (defaultStyle) {
          categoryRes.select.value = defaultStyle;
          await updateTemplates(defaultStyle);
          if (pendingValue?.style) {
            styleRes.select.value = pendingValue.style;
            updateStyleLabel();
          }
          pendingValue = null;
        }
      } catch (e) {
        console.error("Failed to load styles", e);
      }
    };

    const updateTemplates = async (fileName) => {
      styleRes.select.innerHTML = '<option value="none">Loading...</option>';
      try {
        const formData = new FormData();
        formData.append("file_name", fileName);
        const resp = await fetch("/itools/get_style_templates", {
          method: "POST",
          body: formData,
        });
        const data = await resp.json();

        styleRes.select.innerHTML = "";

        // Add "none" as default
        const noneOpt = document.createElement("option");
        noneOpt.value = noneOpt.text = "none";
        styleRes.select.appendChild(noneOpt);

        data.templates.forEach((t) => {
          if (t === "none") return;
          const opt = document.createElement("option");
          opt.value = opt.text = t;
          styleRes.select.appendChild(opt);
        });

        if (pendingValue?.style) {
          styleRes.select.value = pendingValue.style;
          updateStyleLabel();
        }
      } catch (e) {
        styleRes.select.innerHTML =
          '<option value="none">Error loading</option>';
        console.error("Failed to load templates", e);
      }
    };

    categoryRes.select.onchange = (e) => updateTemplates(e.target.value);

    const updateStyleLabel = () => {
      styleRes.label.innerText =
        styleRes.select.value === "none"
          ? "STYLE"
          : "STYLE - will be merged on run ⓘ";
    };

    styleRes.select.onchange = updateStyleLabel;

    mergeBtn.onclick = async () => {
      const prompt = promptArea.value;
      const negative = negativeArea.value;
      const style_file = categoryRes.select.value;
      const template_name = styleRes.select.value;

      if (template_name === "none") return;
      promptHistory.push(promptArea.value);
      negHistory.push(negativeArea.value);

      try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("negative", negative);
        formData.append("style_file", style_file);
        formData.append("template_name", template_name);

        const resp = await fetch("/itools/merge_style", {
          method: "POST",
          body: formData,
        });
        const data = await resp.json();

        promptArea.value = data.prompt;
        negativeArea.value = data.negative || "";
        styleRes.select.value = "none";
        updateStyleLabel();
        updateIconPositions();
      } catch (e) {
        console.error("Merge failed", e);
      }
    };

    appendBtn.onclick = async () => {
      const style_file = categoryRes.select.value;
      const template_name = styleRes.select.value;

      if (template_name === "none") return;
      promptHistory.push(promptArea.value);
      negHistory.push(negativeArea.value);

      try {
        const formData = new FormData();
        formData.append("prompt", ""); // Get style only
        formData.append("negative", "");
        formData.append("style_file", style_file);
        formData.append("template_name", template_name);

        const resp = await fetch("/itools/merge_style", {
          method: "POST",
          body: formData,
        });
        const data = await resp.json();

        if (data.prompt) {
          const separator = promptArea.value.trim() ? "\n\n" : "";
          promptArea.value = promptArea.value + separator + data.prompt;
          updateIconPositions();
        }
        if (data.negative) {
          const separator = negativeArea.value.trim() ? "\n\n" : "";
          negativeArea.value = negativeArea.value + separator + data.negative;
          updateIconPositions();
        }
        styleRes.select.value = "none";
        updateStyleLabel();
      } catch (e) {
        console.error("Append failed", e);
      }
    };

    resetBtn.onclick = () => {
      if (promptHistory.length > 0) {
        promptArea.value = promptHistory.pop();
        negativeArea.value = negHistory.pop();
      } else {
        promptArea.value = "";
        negativeArea.value = "";
        styleRes.select.value = "none";
      }
      updateStyleLabel();
      updateIconPositions();
    };

    updateIconPositions();
    loadStyles();

    // Node setup
    node.size = [320, 260];
    const widget = node.addDOMWidget("PromptMixerWidget", "custom", container, {
      getValue: () => {
        return {
          prompt: promptArea.value,
          negative: negativeArea.value,
          category: categoryRes.select.value,
          style: styleRes.select.value,
          negState: negState,
        };
      },
      setValue: (v) => {
        if (v) {
          promptArea.value = v.prompt || "";
          negativeArea.value = v.negative || "";
          pendingValue = v;
          updateNegState(
            v.negState !== undefined ? v.negState : v.showNegative ? 2 : 0,
            true,
          );
          updateIconPositions();
        }
      },
      set_value: (v) => {
        if (v && typeof v === "object") {
          promptArea.value = v.prompt || "";
          negativeArea.value = v.negative || "";
        } else {
          promptArea.value = v || "";
        }
        updateIconPositions();
      },
      reset_style: () => {
        styleRes.select.value = "none";
        updateStyleLabel();
      },
    });
    // init size
    node.size = [400, 300];
    node.onResize = () => {
      updateIconPositions();
      if (node.size[0] < 400) node.size[0] = 400;
      if (node.size[1] < 300) node.size[1] = 300;
      console.log(node.size);
    };
    // add delay to updateIconPositions on init
    setTimeout(() => {
      updateIconPositions();
    }, 500);
  },
});
