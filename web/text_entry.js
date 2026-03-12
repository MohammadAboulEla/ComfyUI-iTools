import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { Shapes } from "./utils.js";
import { BaseSmartWidgetManager } from "./makadi/BaseSmartWidget.js";
import { SmartButton } from "./makadi/SmartButton.js";
import { inputsHistoryShow } from "./prompt_gallery.js";

app.registerExtension({
  name: "iTools.promptRecord",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPromptRecord") {
      return;
    }

    const w = node.widgets.find((w) => w.name === "timeline_data");
    if (w) {
      console.log("iTools: Found timeline_data widget", node);
      w.hidden = true; // This hides it from the UI but keeps it in node.widgets
    }

    // init size
    node.size = [300, 150];

    setTimeout(() => {
      node.setDirtyCanvas(true, true);
    }, 100);

    // vars
    let inputWidget = node.widgets.filter((w) => w.type == "customtext");

    // Use the hidden widget defined in Python for persistence
    const historyWidget = node.widgets.find((w) => w.name === "timeline_data");

    const _inputsHistory = [];
    // Proxy handles synchronization whenever the array is modified (push, splice, length=0)
    const inputsHistory = new Proxy(_inputsHistory, {
      set(target, prop, value) {
        const res = Reflect.set(target, prop, value);
        if (historyWidget && (prop === "length" || !isNaN(prop))) {
          historyWidget.value = JSON.stringify(target);
        }
        return res;
      },
      deleteProperty(target, prop) {
        const res = Reflect.deleteProperty(target, prop);
        if (historyWidget) historyWidget.value = JSON.stringify(target);
        return res;
      },
    });

    // Restore history when the workflow is loaded
    const originalOnConfigure = node.onConfigure;
    node.onConfigure = function (data) {
      if (originalOnConfigure) originalOnConfigure.apply(this, arguments);
      if (historyWidget && historyWidget.value) {
        try {
          const saved = JSON.parse(historyWidget.value);
          if (Array.isArray(saved)) {
            _inputsHistory.length = 0;
            _inputsHistory.push(...saved);
            if (allow_debug)
              console.log("iTools: Timeline restored", _inputsHistory.length);
          }
        } catch (e) {
          if (allow_debug) console.log("iTools: Failed to parse timeline data");
        }
      }
    };

    function createButtons(startVisible = true) {
      const bx = 10;
      const by = 9;
      const h = 19;
      const buttonFont = "12px Arial";
      let currentX = bx;

      const a = new SmartButton(bx, by, 20, h, node, "✖" || "✂" || "✘" || "🧹");
      a.allowVisualHover = true;
      a.textYoffset = 1;
      a.isVisible = startVisible;
      a.shape = Shapes.ROUND_L;
      a.outline = true;
      a.outlineWidth = 0.9;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = buttonFont;
      a.computeSize = () => [-20, -20]; // number of buttons * 4
      a.onClick = async () => {
        // Copy content of inputWidget
        // const t = inputWidget[0].options.getValue();
        // const t2 = await navigator.clipboard.writeText(t);

        // Clear inputWidget
        inputWidget[0].options.setValue("");
      };
      currentX += 20;

      const b = new SmartButton(currentX, by, 38, h, node, "Copy");
      b.allowVisualHover = true;
      b.textYoffset = 1;
      b.isVisible = startVisible;
      b.shape = Shapes.SQUARE;
      b.outline = true;
      b.outlineWidth = 0.9;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = buttonFont;
      b.onClick = async () => {
        const t = inputWidget[0].options.getValue();
        // copy if t is not empty
        if (t && t.trim() !== "") {
          await navigator.clipboard.writeText(t);
        }
      };
      currentX += 38;

      const c = new SmartButton(currentX, by, 40, h, node, "Paste");
      c.allowVisualHover = true;
      c.textYoffset = 1;
      c.isVisible = startVisible;
      c.shape = Shapes.SQUARE;
      c.outlineWidth = 0.9;
      c.outline = true;
      c.outlineColor = "#656565";
      c.color = "#222222";
      c.font = buttonFont;
      c.onClick = async () => {
        // get value from clipboard
        const t = await navigator.clipboard.readText();
        inputWidget[0].options.setValue(t);
      };
      currentX += 40;

      const add = new SmartButton(
        currentX,
        by,
        20,
        h,
        node,
        "▶" || "✚" || "➤" || "Add to",
      );
      add.allowVisualHover = true;
      add.textYoffset = 1;
      add.isVisible = startVisible;
      add.shape = Shapes.SQUARE;
      add.outline = true;
      add.outlineWidth = 0.9;
      add.outlineColor = "#656565";
      add.color = "#222222";
      add.font = buttonFont;
      add.onClick = () => {
        const t = inputWidget[0].options.getValue();
        if (t && t.trim() !== "") {
          if (!inputsHistory.includes(t)) {
            inputsHistory.push(t);
            if (allow_debug) console.log("Text added to Timeline");
            // Show success message
            app.extensionManager.toast.add({
              severity: "success",
              summary: "Success",
              detail: "Current prompt has been added to the Timeline.",
              life: 2000,
            });
          } else {
            // Show success message
            app.extensionManager.toast.add({
              severity: "info",
              summary: "info",
              detail: "Current prompt already exists in the Timeline!",
              life: 2000,
            });
          }
        }
      };
      currentX += 20;

      const his = new SmartButton(
        currentX,
        by,
        72,
        h,
        node,
        "Timeline 🧾" || "Run History",
      );
      his.allowVisualHover = true;
      his.textYoffset = 1;
      his.isVisible = startVisible;
      his.shape = Shapes.ROUND_R;
      his.outline = true;
      his.outlineWidth = 0.9;
      his.outlineColor = "#656565";
      his.color = "#222222";
      his.font = buttonFont;
      his.onClick = () => {
        inputsHistoryShow(inputsHistory, inputWidget);
        if (allow_debug) console.log("node", node);
      };
      currentX += 72;

      // const u = new SmartButton(currentX, by, r - 20, h, node, "↺");
      // u.allowVisualHover = true;
      // u.textYoffset = 1;
      // u.isVisible = startVisible;
      // u.shape = Shapes.CIRCLE;
      // u.outlineWidth = 0.9;
      // u.outlineColor = "#656565";
      // u.color = "#222222";
      // u.font = buttonFont;
      // u.onClick = () => {};

      // const n = new SmartButton(currentX, by, r - 20, h, node, "↻");
      // n.allowVisualHover = true;
      // n.textYoffset = 1;
      // n.isVisible = startVisible;
      // n.shape = Shapes.CIRCLE;
      // n.outlineWidth = 0.9;
      // n.outlineColor = "#656565";
      // n.color = "#222222";
      // n.font = buttonFont;
      // n.onClick = () => {};
    }
    createButtons();

    // Override the queuePrompt method
    const originalQueuePrompt = app.queuePrompt;
    app.queuePrompt = function () {
      const t = inputWidget[0].options.getValue();
      if (t && t.trim() !== "" && !inputsHistory.includes(t)) {
        inputsHistory.push(t);
        if (allow_debug) console.log("Inputs history updated");
      }
      // Call the original method and return its result
      return originalQueuePrompt.apply(this, arguments);
    };

    // Add event listener for execution_complete
    api.addEventListener("execution_success", (event) => {
      // check if linked
      if (node.inputs[0].link) {
        const t = node.executionText;
        if (t && t.trim() !== "" && !inputsHistory.includes(t)) {
          inputsHistory.push(t);
          if (allow_debug)
            console.log("Inputs history updated from linked node");
        }
      }
    });

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(250, newSize[0]);
      // node.size[1] = Math.max(150, newSize[1]);
    };

    const m = new BaseSmartWidgetManager(node, "iToolsPromptRecord");
    const origOnRemoved = node.onRemoved;
    node.onRemoved = function () {
      origOnRemoved?.apply(this, arguments);
      m.destroy();
    };
  },
});
