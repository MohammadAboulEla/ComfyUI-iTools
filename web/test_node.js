import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import {
  RgthreeBetterTextWidget,
  RgthreeBetterButtonWidget,
} from "./rgthree_widgets.js";

// This code here is for learning and testing purpose

app.registerExtension({
  name: "iTools.testNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsTestNode") {
      return;
    }

    if (allow_debug) {
      console.log("nodeType", nodeType);
      console.log("nodeData", nodeData);
      console.log("app", app);
    }

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);
    };
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsTestNode") {
      return;
    }

    if (allow_debug) {
      console.log("node", node);
    }

    if (node.size[1] < 105) {
      node.size[1] = 105;
    }

    let myCounter = 0;

    const txt = new RgthreeBetterTextWidget("Click", myCounter);
    const btn = new RgthreeBetterButtonWidget("Add Click");

    // Override the onMouseUp method
    btn.onMouseUp = function (event, pos, node) {
      myCounter += 1;
      txt.value = myCounter;
      if (this.allowDebug) console.log("Mouse Click ", myCounter);
      node.setDirtyCanvas(true, true);
    };

    // Override the mouse handler
    txt.mouse = function (event, pos, node) {
      const canvas = app.canvas;
      if (event.type == "pointerdown") {
        canvas.prompt(
          "Label",
          txt.value,
          (v) => {
            txt.value = v;
            myCounter = parseInt(v) || 0;
          },
          event
        );
      }
    };

    node.addCustomWidget(txt);
    node.addCustomWidget(btn);

    await waitForInitialization(node);
    const Click = node.widgets.find((w) => w.name == "Click");
    if (this.allowDebug) console.log(Click);
    myCounter = parseInt(Click.value) || 0;
  },
});

async function waitForInitialization(node) {
  // Poll until both node and style are initialized
  while (!node || !node.widgets || node.widgets.length < 2) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms before checking again
  }
}
