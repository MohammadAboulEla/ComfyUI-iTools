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
        resize: none;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
    `;
    promptArea.onfocus = () => (promptArea.style.borderColor = "#555");

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
            padding: 5px 10px; 
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

    // Merge Button
    const mergeBtn = document.createElement("button");
    mergeBtn.innerHTML = `<span style="margin-right: 8px; opacity: 0.6;">✨</span> MERGE STYLE`;
    mergeBtn.style.cssText = `
        background: #222;
        border: 1px solid #444;
        border-radius: 6px;
        color: #fff;
        padding: 5px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        letter-spacing: 1px;
        margin-top: 5px;
    `;
    mergeBtn.onmouseover = () => {
      mergeBtn.style.background = "#444";
    };
    mergeBtn.onmouseout = () => {
      mergeBtn.style.background = "#222";
    };

    container.appendChild(promptArea);
    container.appendChild(selectorContainer);
    container.appendChild(mergeBtn);

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

        if (data.styles.length > 0) {
          updateTemplates(data.styles[0]);
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
