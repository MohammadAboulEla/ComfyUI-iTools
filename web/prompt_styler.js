import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

const _id = "iToolsPromptStyler";

// code here is a mess!
async function send_style_message(style) {
  const body = new FormData();
  body.append("message", style);
  const r = await api.fetchApi("/itools/style_change", {
    method: "POST",
    body,
  });
  return r.json();
}

app.registerExtension({
  name: "makadi." + _id,
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== _id) {
      return;
    }
    //alert("iTools Prompt Styler registered");
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const me = onNodeCreated?.apply(this);
      const style = this.widgets.find((w) => w.name == "style_file");
      style.callback = async () => {
        // Await the response from send_style_message
        this.widgets[3]["value"] = "loading ...";
        const options = await send_style_message(style.value);
        this.widgets[3]["options"]["values"] = options.new_templates;
        this.widgets[3]["value"] = options.new_templates[0];
        this.setDirtyCanvas(true, true);
      };
      fix_start_up_init(this, style);
      return me;
    };
  },
});

async function fix_start_up_init(node, style) {
  try {
    // Wait until node and style are fully initialized
    if (!await waitForInitialization(node, style)) {
      if (allow_debug) console.log("Initialization timeout");
      return;
    }

    if ((node.size[0] <= 300) | (node.size[1] <= 230)) {
      node.setSize([300, 230]);
    }

    // Proceed with sending the style message and updating node widgets
    const options = await send_style_message(style.value);
    if (!options?.new_templates) {
      if (allow_debug) console.log("Invalid options response");
      return;
    }
    node.widgets[3]["options"]["values"] = options.new_templates;
  } catch (error) {
    if (allow_debug) console.log("Error in fix_start_up_init:", error);
  }
}

async function waitForInitialization(node, style) {
  for (let i = 0; i < 30 && (!node || !node.widgets || node.widgets.length < 4 || !style || !style.value); i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return !(!node || !node.widgets || node.widgets.length < 4 || !style || !style.value);
}
