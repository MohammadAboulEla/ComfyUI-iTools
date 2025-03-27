import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
// Register a new setting
app.registerExtension({
  name: "makadi_iTools_more_styles",
  settings: [
    {
      id: "iTools.Nodes.More Styles",
      name: "Load extra styles",
      type: "boolean",
      defaultValue: false,
      tooltip: "Yaml files in the 'styles/more examples' folder will also be loaded for prompt styler nodes.",
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Nodes.More Styles");
        if (prevValue !== undefined && prevValue !== value) {
          app.extensionManager.toast.add({
            severity: "warn",
            summary: "Alert!",
            detail: "Restart ComfyUI and refresh your browser",
            life: 3000,
          });
        }
      },
    },
  ],
});

// Register a new setting
app.registerExtension({
  name: "makadi_iTools_color",
  settings: [
    {
      id: "iTools.Nodes.Auto Color",
      name: "Auto color nodes when created",
      type: "boolean",
      defaultValue: true,
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Nodes.Auto Color");
        if (prevValue !== undefined && prevValue !== value) {
          app.extensionManager.toast.add({
            severity: "warn",
            summary: "Alert!",
            detail: "Refresh your browser",
            life: 3000,
          });
        }
      },
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
        if (!app.ui.settings.getSettingValue("iTools.Nodes.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsPromptStylerExtra":
        if (!app.ui.settings.getSettingValue("iTools.Nodes.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsTextReplacer":
        node.setSize([200, 58]);
        if (!app.ui.settings.getSettingValue("iTools.Nodes.Auto Color")) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsRegexNode":
        node.setSize([300, 58]);
        if (!app.ui.settings.getSettingValue("iTools.Nodes.Auto Color")) break;
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
        if (!app.ui.settings.getSettingValue("iTools.Nodes.Auto Color")) break;
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


// Register TogetherApi setting
app.registerExtension({
  name: "makadi_iTools_together_api",
  settings: [
    {
      id: "iTools.Nodes. together.ai Api Key",
      name: "Together Api Key (needed for free schnell node)",
      type: "text",
      defaultValue: "None",
      tooltip: "Get your free key from together.ai put it here or add it as TOGETHER_API_KEY in your system environment.",
    },
  ],
});


// Register a new setting
app.registerExtension({
  name: "makadi_iTools_mask_tool",
  settings: [
    {
      id: "iTools.Nodes.Mask Tool",
      name: "Allow Masking in iTools Paint Node",
      type: "boolean",
      defaultValue: false,
      tooltip: "Give a permission to download 209mb models needed for removing background from images.\n\n As for this Beta version models are saved in the user home folder in the .u2net directory.",
    },
  ],
});

// Register experimental nodes
app.registerExtension({
  name: "makadi_iTools_dev_mode2",
  settings: [
    {
      id: "iTools.Nodes.Dev Mode2",
      name: "Enable dev nodes",
      type: "boolean",
      defaultValue: false,
      tooltip: "You do not have to enable this, these are just test nodes for development.",
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Nodes.Dev Mode2");
        if (prevValue !== undefined && prevValue !== value) {
          app.extensionManager.toast.add({
            severity: "warn",
            summary: "Alert!",
            detail: "Restart ComfyUI and refresh your browser",
            life: 3000,
          });
        }
      },
    },
  ],
});

// Register experimental nodes
app.registerExtension({
  name: "makadi_iTools_dev_mode",
  settings: [
    {
      id: "iTools.Nodes.Dev Mode",
      name: "Enable beta nodes",
      type: "boolean",
      defaultValue: true,
      tooltip: "Will show or hide some experimental nodes, Restart ComfyUI and refresh your browser after changing this value.",
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Nodes.Dev Mode");
        if (prevValue !== undefined && prevValue !== value) {
          app.extensionManager.toast.add({
            severity: "warn",
            summary: "Alert!",
            detail: "Restart ComfyUI and refresh your browser",
            life: 3000,
          });
        }
      },
    },
  ],
});

