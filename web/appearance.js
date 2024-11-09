import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

// Register a new setting
app.registerExtension({
  name: "makadi_iTools_color",
  settings: [
    {
      id: "iTools.Auto Color",
      name: "Auto color nodes when created",
      type: "boolean",
      defaultValue: true,
      // tooltip:"Refresh your browser after changing this value"
    },
  ],
});

app.registerExtension({
  name: "makadi.appearance",
  nodeCreated(node) {
    switch (node.comfyClass) {
      case "iToolsPromptStyler":
        if (allow_debug) {
          console.log("iToolsPromptStyler", node);
        }
        if (!app.ui.settings.getSettingValue("iTools.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsPromptStylerExtra":
        if (!app.ui.settings.getSettingValue("iTools.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsTextReplacer":
        node.setSize([200, 58]);
        if (!app.ui.settings.getSettingValue("iTools.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsAddOverlay":
        //node.setSize([240, 130]);
        node.size[0] = 240;
        break;
      case "iToolsLineLoader":
        //node.setSize([200, 180]);
        node.size[0] = 200;
        break;
      case "iToolsGridFiller":
        //node.setSize([240, 200]);
        node.size[0] = 240;
        break;
      case "iToolsLoadImagePlus":
        //node.setSize([210, 170]);
        node.size[0] = 210;
        if (!app.ui.settings.getSettingValue("iTools.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.pale_blue.color;
        break;
      case "iToolsCheckerBoard":
        //node.setSize([270, 250]);
        node.size[0] = 270;
        //node.color = LGraphCanvas.node_colors.pale_blue.color;
        break;
    }
  },
});
