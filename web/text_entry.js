import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { inputsHistoryShow } from "./prompt_gallery.js";

app.registerExtension({
  name: "iTools.promptRecord",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPromptRecord") {
      return;
    }

    const historyWidget = node.widgets?.find((w) => w.name === "timeline_data");
    if (historyWidget) {
      historyWidget.hidden = true;
    }

    const MIN_WIDTH = 280;
    const MIN_HEIGHT = 60;
    
    node.size = [
      Math.max(node.size?.[0] || MIN_WIDTH, MIN_WIDTH),
      Math.max(node.size?.[1] || MIN_HEIGHT, MIN_HEIGHT),
    ];

    // Helper to get and set textarea content across Litegraph & Node 2.0
    function getTextValue() {
      const w = node.widgets?.find((w) => w.name === "text" || w.type === "customtext");
      if (!w) return "";
      if (w.options?.getValue) return w.options.getValue() || "";
      if (w.inputEl) return w.inputEl.value || "";
      return w.value || "";
    }

    function setTextValue(text) {
      const w = node.widgets?.find((w) => w.name === "text" || w.type === "customtext");
      if (!w) return;
      if (w.options?.setValue) {
        w.options.setValue(text);
      } else if (w.inputEl) {
        w.inputEl.value = text;
        w.value = text;
        w.inputEl.dispatchEvent(new Event("input"));
      } else {
        w.value = text;
      }
      node.setDirtyCanvas?.(true, true);
    }

    const _inputsHistory = [];
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

    // Restore history when workflow is loaded
    const originalOnConfigure = node.onConfigure;
    node.onConfigure = function (data) {
      if (originalOnConfigure) originalOnConfigure.apply(this, arguments);
      if (historyWidget && historyWidget.value) {
        try {
          const saved = JSON.parse(historyWidget.value);
          if (Array.isArray(saved)) {
            _inputsHistory.length = 0;
            _inputsHistory.push(...saved);
            if (allow_debug) {
              console.log("iTools: Timeline restored", _inputsHistory.length);
            }
          }
        } catch (e) {
          if (allow_debug) console.log("iTools: Failed to parse timeline data");
        }
      }
    };

    // ── Native HTML Toolbar ───────────────────────────────────────────────
    const TOOLBAR_HEIGHT = 24;
    const toolbar = document.createElement("div");
    toolbar.className = "itools-prompt-record-toolbar";
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      background: transparent;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      width: 100%;
      height: ${TOOLBAR_HEIGHT}px;
      user-select: none;
      overflow: hidden;
    `;

    function createToolbarButton(label, tooltip, onClick, isRoundL, isRoundR) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.title = tooltip || "";
      btn.style.cssText = `
        background: #2a2a2a;
        color: #dddddd;
        border: 1px solid #505050;
        border-radius: ${isRoundL ? "4px 0 0 4px" : isRoundR ? "0 4px 4px 0" : "0"};
        padding: 2px 8px;
        height: 22px;
        line-height: 18px;
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        outline: none;
        white-space: nowrap;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        margin-right: -1px;
      `;
      btn.onmouseenter = () => {
        btn.style.background = "#3a3a3a";
        btn.style.borderColor = "#707070";
      };
      btn.onmouseleave = () => {
        btn.style.background = "#2a2a2a";
        btn.style.borderColor = "#505050";
      };
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      };
      return btn;
    }

    const clearBtn = createToolbarButton(
      "✖",
      "Clear text",
      () => {
        setTextValue("");
      },
      true,
      false,
    );

    const copyBtn = createToolbarButton(
      "Copy",
      "Copy text to clipboard",
      async () => {
        const t = getTextValue();
        if (t && t.trim() !== "") {
          try {
            await navigator.clipboard.writeText(t);
            app.extensionManager?.toast?.add({
              severity: "success",
              summary: "Copied",
              detail: "Text copied to clipboard",
              life: 1500,
            });
          } catch (_) {}
        }
      },
      false,
      false,
    );

    const pasteBtn = createToolbarButton(
      "Paste",
      "Paste from clipboard",
      async () => {
        try {
          const t = await navigator.clipboard.readText();
          if (t) setTextValue(t);
        } catch (_) {}
      },
      false,
      false,
    );

    const addBtn = createToolbarButton(
      "▶",
      "Add current prompt to Timeline",
      () => {
        const t = getTextValue();
        if (t && t.trim() !== "") {
          if (!inputsHistory.includes(t)) {
            inputsHistory.push(t);
            app.extensionManager?.toast?.add({
              severity: "success",
              summary: "Success",
              detail: "Current prompt added to Timeline.",
              life: 2000,
            });
          } else {
            app.extensionManager?.toast?.add({
              severity: "info",
              summary: "Info",
              detail: "Current prompt already in Timeline.",
              life: 2000,
            });
          }
        }
      },
      false,
      false,
    );

    const timelineBtn = createToolbarButton(
      "Timeline 🧾",
      "Open Prompt Timeline History",
      () => {
        const targetWidget = [
          {
            options: {
              setValue: (val) => setTextValue(val),
              getValue: () => getTextValue(),
            },
          },
        ];
        inputsHistoryShow(inputsHistory, targetWidget);
      },
      false,
      true,
    );

    toolbar.appendChild(clearBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(pasteBtn);
    toolbar.appendChild(addBtn);
    toolbar.appendChild(timelineBtn);

    const toolbarWidget = node.addDOMWidget(
      "PromptRecordToolbar",
      "custom",
      toolbar,
      {
        serialize: false,
        getHeight: () => TOOLBAR_HEIGHT,
      },
    );
    toolbarWidget.computeSize = (width) => [width, TOOLBAR_HEIGHT];

    // Place toolbar widget above the text widget
    if (node.widgets) {
      const toolbarIdx = node.widgets.indexOf(toolbarWidget);
      const textIdx = node.widgets.findIndex(
        (w) => w.name === "text" || w.type === "customtext",
      );
      if (toolbarIdx !== -1 && textIdx !== -1 && toolbarIdx > textIdx) {
        node.widgets.splice(toolbarIdx, 1);
        node.widgets.splice(textIdx, 0, toolbarWidget);
      }
    }

    setTimeout(() => {
      const wrapper = toolbar.parentElement;
      if (wrapper) {
        wrapper.style.setProperty("margin", "0", "important");
        wrapper.style.setProperty("padding", "0", "important");
        wrapper.style.setProperty("height", `${TOOLBAR_HEIGHT}px`, "important");
        wrapper.style.setProperty("min-height", `${TOOLBAR_HEIGHT}px`, "important");
        wrapper.style.setProperty("max-height", `${TOOLBAR_HEIGHT}px`, "important");
        wrapper.style.setProperty("overflow", "hidden", "important");
      }
      node.setDirtyCanvas?.(true, true);
    }, 10);

    // Override queuePrompt to auto-record prompt
    const originalQueuePrompt = app.queuePrompt;
    app.queuePrompt = function () {
      const t = getTextValue();
      if (t && t.trim() !== "" && !inputsHistory.includes(t)) {
        inputsHistory.push(t);
      }
      return originalQueuePrompt.apply(this, arguments);
    };

    api.addEventListener("execution_success", () => {
      if (node.inputs?.[0]?.link) {
        const t = node.executionText || getTextValue();
        if (t && t.trim() !== "" && !inputsHistory.includes(t)) {
          inputsHistory.push(t);
        }
      }
    });

    node.onResize = function (newSize) {
      newSize[0] = Math.max(MIN_WIDTH, newSize[0]);
      newSize[1] = Math.max(MIN_HEIGHT, newSize[1]);
    };

    const origOnRemoved = node.onRemoved;
    node.onRemoved = function () {
      origOnRemoved?.apply(this, arguments);
    };
  },
});
