import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { Shapes } from "./utils.js";
import { BaseSmartWidget, BaseSmartWidgetManager } from "./makadi/BaseSmartWidget.js";
import { SmartButton } from "./makadi/SmartButton.js";

app.registerExtension({
  name: "iTools.textEntry",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsTextEntry") {
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

    inputsHistory = [
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

    let mouse = {
      mouseInNode: false,
      x: 0,
      y: 0,
    };

    if (allow_debug) console.log("node.widgets", node.widgets);

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

    setTimeout(() => {
      createButtons();
    }, 50);

    node.onExecuted = async function (message) {
      const t = inputWidget[0].options.getValue();

      // push of not empty or already exist
      if (t && t.trim() !== "" && !inputsHistory.includes(t)) {
        inputsHistory.push(t);
        if (allow_debug) console.log("Inputs history updated");
      }
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(300, newSize[0]);
      node.size[1] = Math.max(150, newSize[1]);
    };

    const originalClick = app.canvas.canvas.onclick;
    app.canvas.canvas.onclick = (e) => {
      if (originalClick) {
        originalClick.call(app.canvas.canvas, e);
      }
    };

    node.onMouseEnter = (e) => {
      mouse.mouseInNode = true;
    };

    node.onMouseLeave = (e) => {
      mouse.mouseInNode = false;
    };

    node.onMouseMove = (e, pos) => {
      if (mouse.mouseInNode) {
        const graphMouse = app.canvas.graph_mouse;
        mouse.x = graphMouse[0] - node.pos[0];
        mouse.y = graphMouse[1] - node.pos[1];
      }
    };

    const m = new BaseSmartWidgetManager(node, "iToolsTextEntry");
  },
});

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
        width: 500px;
        max-height: 80vh;
        z-index: 10000;
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

  const title = document.createElement("h3");
  title.textContent = "Execution History";
  title.style.cssText = `
        margin: 0;
        color: #fff;
        font-size: 16px;
    `;

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

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create content container
  const content = document.createElement("div");
  content.style.cssText = `
        overflow-y: auto;
        max-height: calc(80vh - 80px);
    `;

  // Create list of inputs
  const list = document.createElement("div");
  list.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

  // Add inputs in reverse order (newest first)
  inputs
    .slice()
    .reverse()
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
        `;
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
        z-index: 9999;
    `;
  overlay.onclick = () => {
    modal.remove();
    overlay.remove();
  };

  // Assemble and show modal
  modal.appendChild(header);
  modal.appendChild(content);
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
}
