import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { Shapes } from "./utils.js";
import { BaseSmartWidget, BaseSmartWidgetManager } from "./makadi/BaseSmartWidget.js";
import { SmartButton } from "./makadi/SmartButton.js";

// First, let's define the defaults as a constant at the top level
const DEFAULT_HISTORY = [
  "A playful kitten wearing a colorful bow tie, sitting on a fluffy cloud, with a bright rainbow in the background",
  "A cheerful bunny in a pink dress holding a basket of flowers, standing in a sunny meadow with butterflies around",
  "A small dragon with big eyes and tiny wings, blowing gentle puffs of fire while sitting on top of a cupcake",
  "A happy, round penguin wearing a scarf and hat, sliding down a snowy hill with sparkles and snowflakes in the air",
  "A friendly octopus with heart-shaped eyes, holding balloons in each tentacle, floating in an underwater scene with smiling fish",
  "A chubby unicorn with pastel-colored mane and tail, flying through the sky with stars and sparkles surrounding it",
  "A joyful panda riding a bicycle through a bamboo forest, with colorful flowers and birds flying alongside",
  "A tiny robot with a big smile, watering a garden of glowing flowers under a starry sky",
  "A group of cute woodland animals having a tea party, with tiny teacups and plates of sweets on a tree stump",
  "A happy little fox wearing a superhero cape, flying above a vibrant cityscape at sunset",
];

app.registerExtension({
  name: "iTools.textEntry",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsTextEntry") {
      nodeType.prototype.onExecuted = async function (message) {
        console.log("nodeType.prototype.onExecuted");
      };
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsTextEntry") {
      return;
    }

    // init size
    node.size = [300, 150];

    // vars
    let inputWidget = node.widgets.filter((w) => w.type == "customtext");
    let inputsHistory = [];

    function createButtons(startVisible = true) {
      const bx = 10;
      const by = 10;
      const r = 40;
      const h = 16;
      const offset = 40;
      const buttonFont = "12px Arial";

      const a = new SmartButton(bx, by, r, h, node, "Clear");
      a.allowVisualHover = true;
      a.textYoffset = 1;
      a.isVisible = startVisible;
      a.shape = Shapes.ROUND_L;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = buttonFont;
      a.computeSize = () => [-16, -16];
      a.onClick = async () => {
        inputWidget[0].options.setValue("");
      };

      const b = new SmartButton(bx + offset, by, r, h, node, "Copy");
      b.allowVisualHover = true;
      b.textYoffset = 1;
      b.isVisible = startVisible;
      b.shape = Shapes.SQUARE;
      b.outlineWidth = 1;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = buttonFont;
      b.onClick = async () => {
        const t = inputWidget[0].options.getValue();
        await navigator.clipboard.writeText(t);
      };

      const c = new SmartButton(bx + 2 * offset, by, r, h, node, "Paste");
      c.allowVisualHover = true;
      c.textYoffset = 1;
      c.isVisible = startVisible;
      c.shape = Shapes.SQUARE;
      c.outlineWidth = 1;
      c.outlineColor = "#656565";
      c.color = "#222222";
      c.font = buttonFont;
      c.onClick = async () => {
        // get value from clipboard
        const t = await navigator.clipboard.readText();
        inputWidget[0].options.setValue(t);
      };

      const his = new SmartButton(bx + 3 * offset, by, r * 2.6, h, node, "Execution History");
      his.allowVisualHover = true;
      his.textYoffset = 1;
      his.isVisible = startVisible;
      his.shape = Shapes.ROUND_R;
      his.outlineWidth = 1;
      his.outlineColor = "#656565";
      his.color = "#222222";
      his.font = buttonFont;
      his.onClick = () => {
        inputsHistoryShow(inputsHistory);
      };

      // const u = new SmartButton(bx + 3 * offset, by, r - 20, h, node, "↺");
      // u.allowVisualHover = true;
      // u.textYoffset = 1;
      // u.isVisible = startVisible;
      // u.shape = Shapes.CIRCLE;
      // u.outlineWidth = 1;
      // u.outlineColor = "#656565";
      // u.color = "#222222";
      // u.font = buttonFont;
      // u.onClick = () => {};

      // const n = new SmartButton(bx + 4 * offset - 20, by, r - 20, h, node, "↻");
      // n.allowVisualHover = true;
      // n.textYoffset = 1;
      // n.isVisible = startVisible;
      // n.shape = Shapes.CIRCLE;
      // n.outlineWidth = 1;
      // n.outlineColor = "#656565";
      // n.color = "#222222";
      // n.font = buttonFont;
      // n.onClick = () => {};
    }
    createButtons();

    // Store the original queuePrompt method
    const originalQueuePrompt = app.queuePrompt;

    // Override the queuePrompt method
    app.queuePrompt = function () {
      const t = inputWidget[0].options.getValue();
      if (allow_debug) console.log("t", t);
      // push of not empty or already exist
      if (t && t.trim() !== "" && !inputsHistory.includes(t)) {
        inputsHistory.push(t);
        if (allow_debug) console.log("Inputs history updated");
      }
      // Call the original method and return its result
      return originalQueuePrompt.apply(this, arguments);
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(300, newSize[0]);
      node.size[1] = Math.max(150, newSize[1]);
    };

    const m = new BaseSmartWidgetManager(node, "iToolsTextEntry");
  },
});

function exportHistoryToFile(history) {
  // Create text content
  const content = history.join("\n\n");

  // Create temporary link element
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));

  // Get current date for filename
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];

  // Set suggested filename
  element.setAttribute("download", `prompts_history_${dateStr}.txt`);

  // Hide element
  element.style.display = "none";
  document.body.appendChild(element);

  // Show native save dialog
  element.click();

  // Cleanup
  document.body.removeChild(element);
}

function importHistoryFromFile(callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt";

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;
      const items = content.split("\n\n").filter((item) => item.trim());
      callback(items);
    };

    reader.readAsText(file);
  };

  input.click();
}

function inputsHistoryShow(inputs) {
  // Create modal container
  const modal = document.createElement("div");
  modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 20px;
        width: 600px;
        max-height: 80vh;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #333;
    `;

  // Create title container for title and buttons
  const titleContainer = document.createElement("div");
  titleContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;

  const title = document.createElement("h3");
  title.textContent = "Execution History";
  title.style.cssText = `
        margin: 0;
        color: #fff;
        font-size: 16px;
    `;

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
    `;

  // Shared button styles
  const buttonStyle = `
        background: #333;
        border: none;
        border-radius: 4px;
        color: #fff;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
    `;

  // Create export button
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export";
  exportButton.style.cssText = buttonStyle;
  exportButton.onmouseover = () => (exportButton.style.background = "#444");
  exportButton.onmouseout = () => (exportButton.style.background = "#333");
  exportButton.onclick = () => exportHistoryToFile(inputs);

  // Create import button
  const importButton = document.createElement("button");
  importButton.textContent = "Import";
  importButton.style.cssText = buttonStyle;
  importButton.onmouseover = () => (importButton.style.background = "#444");
  importButton.onmouseout = () => (importButton.style.background = "#333");
  importButton.onclick = () => {
    importHistoryFromFile((newItems) => {
      // Add new items to the history
      newItems.forEach((item) => {
        if (!inputs.includes(item)) {
          inputs.push(item);
        }
      });
      // Re-render the list
      renderList(searchInput.value);
      // Show success message
      // app.extensionManager.toast.add({
      //   severity: "success",
      //   summary: "Success",
      //   detail: "History imported successfully!",
      //   life: 2000,
      // });
    });
  };

  // Create defaults button
  const defaultsButton = document.createElement("button");
  defaultsButton.textContent = "Use Defaults";
  defaultsButton.style.cssText = buttonStyle;
  defaultsButton.onmouseover = () => (defaultsButton.style.background = "#444");
  defaultsButton.onmouseout = () => (defaultsButton.style.background = "#333");
  defaultsButton.onclick = () => {
    // Replace current history with defaults
    inputs.length = 0;
    DEFAULT_HISTORY.forEach((item) => inputs.push(item));
    // Re-render the list
    renderList(searchInput.value);
    // Show success message
    // app.extensionManager.toast.add({
    //   severity: "success",
    //   summary: "Success",
    //   detail: "Default history restored!",
    //   life: 2000,
    // });
  };

  // Create clear button
  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear";
  clearButton.style.cssText = buttonStyle + "background: #662222;"; // Slightly reddish background
  clearButton.onmouseover = () => (clearButton.style.background = "#882222");
  clearButton.onmouseout = () => (clearButton.style.background = "#662222");
  clearButton.onclick = async () => {
    const confirmed = await app.extensionManager.dialog.confirm({
      title: "Clear History",
      message: "Are you sure you want to clear all history entries?",
      okText: "Yes, clear all",
      cancelText: "Cancel",
    });

    if (confirmed) {
      inputs.length = 0;
      renderList(searchInput.value);
      // app.extensionManager.toast.add({
      //   severity: "success",
      //   summary: "Success",
      //   detail: "History cleared successfully!",
      //   life: 2000,
      // });
    }
  };

  // Add all buttons to container
  buttonContainer.appendChild(exportButton);
  buttonContainer.appendChild(importButton);
  // buttonContainer.appendChild(defaultsButton);
  buttonContainer.appendChild(clearButton);

  titleContainer.appendChild(title);
  titleContainer.appendChild(buttonContainer);

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.cssText = `
        background: none;
        border: none;
        color: #666;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
    `;
  closeButton.onclick = () => {
    modal.remove();
    overlay.remove();
  };

  header.appendChild(titleContainer);
  header.appendChild(closeButton);

  // Create search input
  const searchContainer = document.createElement("div");
  searchContainer.style.cssText = `
        margin-bottom: 10px;
        position: relative;
    `;

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search history...";
  searchInput.style.cssText = `
        width: 100%;
        padding: 8px 30px 8px 10px;
        background: #252525;
        border: 1px solid #333;
        border-radius: 4px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
    `;

  const searchIcon = document.createElement("div");
  searchIcon.innerHTML = "🔍︎";
  searchIcon.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        pointer-events: none;
    `;

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchIcon);

  // Create content container
  const content = document.createElement("div");
  content.style.cssText = `
        overflow-y: auto;
        padding-right: ${content.scrollHeight > content.clientHeight ? "10px" : "0"};
        max-height: calc(80vh - 140px);
    `;

  // Add resize observer to update padding when content changes
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const hasScrollbar = entry.target.scrollHeight > entry.target.clientHeight;
      entry.target.style.paddingRight = hasScrollbar ? "10px" : "0";
    }
  });

  resizeObserver.observe(content);

  // Create list of inputs
  const list = document.createElement("div");
  list.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

  function renderList(filterText = "") {
    // Clear existing items
    list.innerHTML = "";

    // Filter and render items
    inputs
      .slice()
      .reverse()
      .filter((text) => text.toLowerCase().includes(filterText.toLowerCase()))
      .forEach((text, index) => {
        const item = document.createElement("div");
        item.style.cssText = `
              background: #252525;
              border: 1px solid #333;
              border-radius: 4px;
              padding: 10px;
              position: relative;
          `;

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy";
        copyButton.style.cssText = `
              position: absolute;
              top: 8px;
              right: 8px;
              background: #333;
              border: none;
              border-radius: 4px;
              color: #fff;
              padding: 4px 8px;
              font-size: 12px;
              cursor: pointer;
              transition: background 0.2s;
          `;
        copyButton.onmouseover = () => (copyButton.style.background = "#444");
        copyButton.onmouseout = () => (copyButton.style.background = "#333");
        copyButton.onclick = async () => {
          try {
            await navigator.clipboard.writeText(text);
            modal.remove();
            overlay.remove();
            app.extensionManager.toast.add({
              severity: "success",
              summary: "Success",
              detail: "Text copied to clipboard!",
              life: 2000,
            });
          } catch (error) {
            app.extensionManager.toast.add({
              severity: "error",
              summary: "Error",
              detail: "Failed to copy text to clipboard",
              life: 3000,
            });
          }
        };

        const textContent = document.createElement("div");
        textContent.style.cssText = `
              color: #fff;
              font-size: 14px;
              margin-right: 60px;
              word-break: break-word;
          `;
        textContent.textContent = text || "(empty)";

        item.appendChild(textContent);
        item.appendChild(copyButton);
        list.appendChild(item);
      });

    // Show "no results" message if needed
    if (list.children.length === 0) {
      const noResults = document.createElement("div");
      noResults.style.cssText = `
              color: #666;
              text-align: center;
              padding: 20px;
              font-style: italic;
          `;
      noResults.textContent = "No matching items found";
      list.appendChild(noResults);
    }
  }

  // Initial render
  renderList();

  // Add search handler
  searchInput.addEventListener("input", (e) => {
    renderList(e.target.value);
  });

  content.appendChild(list);

  // Add overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
      `;
  overlay.onclick = () => {
    modal.remove();
    overlay.remove();
  };

  // Assemble and show modal
  modal.appendChild(header);
  modal.appendChild(searchContainer);
  modal.appendChild(content);
  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Focus search input
  searchInput.focus();
}
