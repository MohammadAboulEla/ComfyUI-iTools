import { app } from "../../../scripts/app.js";

// REGISTER ALL SETTINGS
const itoolsSettings = [
  {
    id: "iTools.Nodes.More Styles",
    name: "Load extra styles",
    type: "boolean",
    defaultValue: true,
    tooltip:
      "Yaml files in the 'styles/more examples' folder will also be loaded for prompt styler nodes.",
    toastMsg: "Restart ComfyUI and refresh your browser",
  },
  {
    id: "iTools.Nodes.Compare Mode",
    name: "Image Compare mode",
    type: "combo",
    defaultValue: "makadi",
    options: ["rgthree", "makadi"],
    tooltip:
      "makadi: is how iTools developer like this node to work.\n\n rgthree: will behave exactly like the rgthree image compare node.",
    toastMsg: "Refresh your browser",
  },
  {
    id: "iTools.Nodes.Auto Resize",
    name: "Auto resize nodes when created",
    type: "boolean",
    defaultValue: false,
    toastMsg: "Refresh your browser",
  },
  {
    id: "iTools.Nodes.Auto Color",
    name: "Auto color nodes when created",
    type: "boolean",
    defaultValue: true,
    toastMsg: "Refresh your browser",
  },
  {
    id: "iTools.Nodes.Mask Tool",
    name: "Allow Masking in iTools Paint Node",
    type: "boolean",
    defaultValue: false,
    tooltip:
      "Give a permission to download 209mb models needed for removing background from images.\n\n As for this Beta version models are saved in the user home folder in the .u2net directory.",
    toastMsg: "Refresh your browser",
  },
  {
    id: "iTools.Nodes.Dev Mode2",
    name: "Enable dev nodes",
    type: "boolean",
    defaultValue: false,
    tooltip:
      "You do not have to enable this, these are just test nodes for development.",
    toastMsg: "Restart ComfyUI and refresh your browser",
  },
  {
    id: "iTools.Nodes.Dev Mode",
    name: "Enable beta nodes",
    type: "boolean",
    defaultValue: true,
    tooltip:
      "Will show or hide some experimental nodes, Restart ComfyUI and refresh your browser after changing this value.",
    toastMsg: "Restart ComfyUI and refresh your browser",
  },

  {
    id: "iTools.Nodes.Node Display Name Preferences",
    name: "Use Simple Names for iTools nodes",
    type: "boolean",
    defaultValue: false,
    tooltip: 'Will remove "iTools" prefix from the node names.',
    toastMsg: "Restart ComfyUI and refresh your browser",
  },
  {
    id: "iTools.Tabs.menuTab",
    name: "Enable iTools tab on the menu bar.",
    type: "boolean",
    defaultValue: false,
    tooltip: "Refresh your browser after changing this value.",
    toastMsg: "Refresh your browser",
  },
  {
    id: "iTools.Tabs.Side Tab",
    name: "Enable Prompt Library icon in the sidebar.",
    type: "boolean",
    defaultValue: true,
    tooltip: "Refresh your browser after changing this value.",
    toastMsg: "Refresh your browser",
  },
];

app.registerExtension({
  name: "makadi_iTools_settings_manager",
  settings: itoolsSettings.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    defaultValue: s.defaultValue,
    options: s.options, // This will be undefined for boolean, which is fine
    tooltip: s.tooltip,
    onChange: (value) => {
      const prevValue = app.ui.settings.getSettingValue(s.id);
      if (prevValue !== undefined && prevValue !== value) {
        app.extensionManager.toast.add({
          severity: "warn",
          summary: "Alert!",
          detail: s.toastMsg,
          life: 3000,
        });
      }
    },
  })),
});

// APPEARANCE
app.registerExtension({
  name: "makadi.appearance",
  nodeCreated(node) {
    const allow_auto_color = app.ui.settings.getSettingValue(
      "iTools.Nodes.Auto Color",
    );
    const allow_auto_resize = app.ui.settings.getSettingValue(
      "iTools.Nodes.Auto Resize",
    );
    switch (node.comfyClass) {
      case "iToolsPromptBuilder":
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
        break;
      case "iToolsInstructorNode":
        if (!allow_auto_color) break;
        node.color = LGraphCanvas.node_colors.green.color;
        break;
      case "iToolsPreviewText":
        // force resize
        node.setSize([240, 80]);
        break;
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
