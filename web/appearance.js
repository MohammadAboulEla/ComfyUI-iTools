import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

// Register a new setting more styles
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

// Register a new setting compare mode
app.registerExtension({
  name: "makadi_iTools_compare_mode",
  settings: [
    {
      id: "iTools.Nodes.Compare Mode",
      name: "iTools Image Compare mode",
      type: "combo",
      defaultValue: "makadi",
      options: ["rgthree", "makadi"],
      tooltip:
        "makadi: is how iTools developer like this node to work.\n\n rgthree: will behave exactly like the rgthree image compare node.",
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Nodes.Compare Mode");
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

// Register a new setting auto resize
app.registerExtension({
  name: "makadi_iTools_resize",
  settings: [
    {
      id: "iTools.Nodes.Auto Resize",
      name: "Auto resize nodes when created",
      type: "boolean",
      defaultValue: false,
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Nodes.Auto Resize");
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

// Register a new setting auto color
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

// Register TogetherApi setting
// app.registerExtension({
//   name: "makadi_iTools_together_api",
//   settings: [
//     {
//       id: "iTools.Nodes. together.ai Api Key",
//       name: "Together Api Key",
//       type: "text",
//       defaultValue: "None",
//       tooltip:
//         "(needed for API nodes)\nGet your free key from together.ai put it here or add it as TOGETHER_API_KEY in your system environment.",
//     },
//   ],
// });

// Register a new setting mask tool
app.registerExtension({
  name: "makadi_iTools_mask_tool",
  settings: [
    {
      id: "iTools.Nodes.Mask Tool",
      name: "Allow Masking in iTools Paint Node",
      type: "boolean",
      defaultValue: false,
      tooltip:
        "Give a permission to download 209mb models needed for removing background from images.\n\n As for this Beta version models are saved in the user home folder in the .u2net directory.",
    },
  ],
});

// Register experimental nodes dev
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

// Register experimental nodes beta
app.registerExtension({
  name: "makadi_iTools_dev_mode",
  settings: [
    {
      id: "iTools.Nodes.Dev Mode",
      name: "Enable beta nodes",
      type: "boolean",
      defaultValue: true,
      tooltip:
        "Will show or hide some experimental nodes, Restart ComfyUI and refresh your browser after changing this value.",
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

// Register a new setting iTools_tab top bar
app.registerExtension({
  name: "makadi_iTools_tab",
  settings: [
    {
      id: "iTools.Tabs.menuTab",
      name: "Enable iTools tab on the menu bar.",
      type: "boolean",
      defaultValue: false,
      tooltip: "Refresh your browser after changing this value.",
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Tabs.menuTab");
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

// Register a new setting iTools_tab side bar
app.registerExtension({
  name: "makadi_iTools_side_tab",
  settings: [
    {
      id: "iTools.Tabs.Side Tab",
      name: "Enable Prompt Library in the sidebar.",
      type: "boolean",
      defaultValue: true,
      tooltip: "Refresh your browser after changing this value.",
      onChange: (value) => {
        const prevValue = app.ui.settings.getSettingValue("iTools.Tabs.Side Tab");
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

// APPEARANCE
app.registerExtension({
  name: "makadi.appearance",
  nodeCreated(node) {
    const allow_auto_color = app.ui.settings.getSettingValue("iTools.Nodes.Auto Color");
    const allow_auto_resize = app.ui.settings.getSettingValue("iTools.Nodes.Auto Resize");
    switch (node.comfyClass) {
      case "iToolsPromptStyler":
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsPromptStylerExtra":
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsTextReplacer":
        if (allow_auto_resize) node.setSize([200, 80]);
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsRegexNode":
        if (allow_auto_resize) node.setSize([280, 130]);
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsAddOverlay":
        if (allow_auto_resize) node.size[0] = 240;
        break;
      case "iToolsLineLoader":
        if (allow_auto_resize) node.size[0] = 200;
        break;
      case "iToolsGridFiller":
        if (allow_auto_resize) node.size[0] = 240;
        break;
      case "iToolsLoadImagePlus":
        if (allow_auto_resize) node.size[0] = 210;
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.pale_blue.color;
        break;
      case "iToolsCompareImage":
      case "iToolsPreviewImage":
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.pale_blue.color;
        break;
      case "iToolsPromptRecord":
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        // node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsCheckerBoard":
        if (allow_auto_resize) node.size[0] = 270;
        break;
    }
  },
});
