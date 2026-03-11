import { app } from "../../../scripts/app.js";
app.registerExtension({
  name: "iTools.LoadImages",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsLoadImages") return;
    // find output mode widget
    const outputModeWidget = node.widgets.find((w) => w.name == "output_mode");
    if (!outputModeWidget) {
      console.error("Output mode widget not found");
      return;
    }
    outputModeWidget.callback = async () => {
      if (outputModeWidget.value == "batch") {
        // show toast
        app.extensionManager.toast.add({
          severity: "warn",
          summary: "Batch mode enabled",
          detail: "Loaded images must match in size.",
          life: 4000,
        });
      }
    };
  },
});
