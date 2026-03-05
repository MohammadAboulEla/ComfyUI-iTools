import { app } from "../../../scripts/app.js";

app.registerExtension({
  name: "iTools.smartStyler",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsSmartStyler") {
      const originalOnExecuted = nodeType.prototype.onExecuted;
      nodeType.prototype.onExecuted = function (message) {
        originalOnExecuted?.apply(this, arguments);
        if (message.prompt !== undefined) {
          // This allows the UI to reflect the merged state if it was done on server
          const widget = this.widgets.find(
            (w) => w.name === "SmartStylerWidget",
          );
          if (widget && widget.set_value) {
            widget.set_value(message.prompt);
          }
        }
        if (message.style === "none") {
          // Reset style dropdown if it was merged
          const widget = this.widgets.find(
            (w) => w.name === "SmartStylerWidget",
          );
          if (widget && widget.reset_style) {
            widget.reset_style();
          }
        }
      };
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsSmartStyler") return;

    const container = document.createElement("div");
    container.style.cssText = `
        display: flex;
        flex-direction: column; 
        // gap: 5px; 
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
        flex: 1;
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
        padding: 10px;
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
            padding-top: 2.5px;
            padding-bottom: 2.5px; 
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
    const applyButtonStyle = (btn, isPrimary = false) => {
      // Base colors using a modern dark palette
      const colors = {
        base: "#222",
        border: "#444",
        hover: "#333",
        press: "#444",
        accent: isPrimary ? "#3b82f6" : "#ffffff", // Optional accent for the "Merge" button
      };

      btn.style.cssText = `
        background: ${colors.base};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        color: #ddd;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        letter-spacing: 0.5px;
        height: 32px;
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
    mergeBtn.innerHTML = `<span style="margin-right: 8px; font-size: 12px;">✨</span> MERGE NOW`;
    applyButtonStyle(mergeBtn, true);
    mergeBtn.style.flex = "3";

    // Append Button
    const appendBtn = document.createElement("button");
    appendBtn.innerHTML = `<span style="margin-right: 8px; font-size: 12px; opacity: 0.7;">☰</span> APPEND`;
    applyButtonStyle(appendBtn, false);
    appendBtn.style.flex = "1";

    btnContainer.appendChild(appendBtn);
    btnContainer.appendChild(mergeBtn);

    container.appendChild(promptWrapper);
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

        const defaultStyle = data.styles.includes("nexus.yaml")
          ? "nexus.yaml"
          : data.styles[0];
        if (defaultStyle) {
          categoryRes.select.value = defaultStyle;
          updateTemplates(defaultStyle);
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
          : "STYLE (Merge upon execution)";
    };

    styleRes.select.onchange = updateStyleLabel;

    mergeBtn.onclick = async () => {
      const prompt = promptArea.value;
      const style_file = categoryRes.select.value;
      const template_name = styleRes.select.value;

      if (template_name === "none") return;
      promptHistory.push(promptArea.value);

      try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("style_file", style_file);
        formData.append("template_name", template_name);

        const resp = await fetch("/itools/merge_style", {
          method: "POST",
          body: formData,
        });
        const data = await resp.json();

        promptArea.value = data.prompt;
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

      try {
        const formData = new FormData();
        formData.append("prompt", ""); // Get style only
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
        styleRes.select.value = "none";
        updateStyleLabel();
      } catch (e) {
        console.error("Append failed", e);
      }
    };

    resetBtn.onclick = () => {
      if (promptHistory.length > 0) {
        promptArea.value = promptHistory.pop();
      } else {
        promptArea.value = "";
        styleRes.select.value = "none";
      }
      updateStyleLabel();
      updateIconPositions();
    };

    updateIconPositions();
    loadStyles();

    // Node setup
    node.size = [320, 260];
    const widget = node.addDOMWidget("SmartStylerWidget", "custom", container, {
      getValue: () => {
        return {
          prompt: promptArea.value,
          category: categoryRes.select.value,
          style: styleRes.select.value,
        };
      },
      setValue: (v) => {
        if (v) {
          promptArea.value = v.prompt || "";
          // Note: category and style might need more care since they depend on async loads
        }
      },
      set_value: (v) => {
        promptArea.value = v;
        updateIconPositions();
      },
      reset_style: () => {
        styleRes.select.value = "none";
        updateStyleLabel();
      },
    });
    // init size
    node.size = [380, 260];
    node.onResize = () => {
      updateIconPositions();
      if (node.size[0] < 380) node.size[0] = 380;
      if (node.size[1] < 260) node.size[1] = 260;
      console.log(node.size);
    };
  },
});
