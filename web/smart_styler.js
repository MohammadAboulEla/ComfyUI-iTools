import { app } from "../../../scripts/app.js";

app.registerExtension({
  name: "iTools.smartStyler",
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
        padding-right: 25px; 
        resize: none;
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
    `;
    promptArea.onfocus = () => (promptArea.style.borderColor = "#555");

    // Reset Button (moved here)
    const resetBtn = document.createElement("button");
    resetBtn.innerHTML = `&#x21BB;`;
    resetBtn.title = "Clear everything";
    resetBtn.style.cssText = `
        position: absolute;
        top: 5px;
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
    resetBtn.onmouseover = () => (resetBtn.style.color = "#fff");
    resetBtn.onmouseout = () => (resetBtn.style.color = "#888");

    promptWrapper.appendChild(promptArea);
    promptWrapper.appendChild(resetBtn);

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
            padding: 5px 0px; 
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
      return { col, select };
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

    // Merge Button
    const mergeBtn = document.createElement("button");
    mergeBtn.innerHTML = `<span style="margin-right: 8px; opacity: 0.6;">✨</span> MERGE`;
    mergeBtn.style.cssText = `
        background: #222;
        border: 1px solid #444;
        border-radius: 6px;
        color: #fff;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        letter-spacing: 1px;
        flex: 2;
        height: 32px;
    `;
    mergeBtn.onmouseover = () => (mergeBtn.style.background = "#444");
    mergeBtn.onmouseout = () => (mergeBtn.style.background = "#222");

    // Append Button
    const appendBtn = document.createElement("button");
    appendBtn.innerHTML = `<span style="margin-right: 8px; opacity: 0.6;">☰</span> APPEND`;
    appendBtn.style.cssText = `
        background: #222;
        border: 1px solid #444;
        border-radius: 6px;
        color: #fff;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        letter-spacing: 1px;
        flex: 1;
        height: 32px;
    `;
    appendBtn.onmouseover = () => (appendBtn.style.background = "#444");
    appendBtn.onmouseout = () => (appendBtn.style.background = "#222");

    btnContainer.appendChild(mergeBtn);
    btnContainer.appendChild(appendBtn);

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

        const defaultStyle = data.styles.includes("basic.yaml")
          ? "basic.yaml"
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
          const opt = document.createElement("option");
          opt.value = opt.text = t;
          styleRes.select.appendChild(opt);
        });
      } catch (e) {
        console.error("Failed to load templates", e);
      }
    };

    categoryRes.select.onchange = (e) => updateTemplates(e.target.value);

    mergeBtn.onclick = async () => {
      const prompt = promptArea.value;
      const style_file = categoryRes.select.value;
      const template_name = styleRes.select.value;

      if (template_name === "none") return;

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
      } catch (e) {
        console.error("Merge failed", e);
      }
    };

    appendBtn.onclick = async () => {
      const style_file = categoryRes.select.value;
      const template_name = styleRes.select.value;

      if (template_name === "none") return;

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
        }
        // styleRes.select.value = "none";
      } catch (e) {
        console.error("Append failed", e);
      }
    };

    resetBtn.onclick = () => {
      promptArea.value = "";
      styleRes.select.value = "none";
    };

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
    });
    // init size
    node.size = [380, 260];
    node.onResize = () => {
      if (node.size[0] < 380) node.size[0] = 380;
      if (node.size[1] < 260) node.size[1] = 260;
      console.log(node.size);
    };
  },
});
