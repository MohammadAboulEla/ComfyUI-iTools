import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidgetManager, SmartButton } from "./makadi.js";
import { Shapes } from "./utils.js";

app.registerExtension({
  name: "iTools.previewNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsPreviewImage") {
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPreviewImage") {
      return;
    }

    // init update
    while (node.graph === null) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (allow_debug) console.log("ImagePreviewNodeCreated", node);

    let images = [];
    const MAX_IMAGES = 8;

    function pushToImgs(newImage) {
      // Check if image is undefined or null
      if (!newImage) {
        if (allow_debug) console.log("Undefined or null image, skipping");
        return images;
      }
      images.push(newImage);
      // If array exceeds MAX_IMAGES, remove oldest image(s)
      if (images.length > MAX_IMAGES) {
        images.shift(); // removes first (oldest) element
      }
      if (allow_debug) console.log("Images list updated, length:", images.length);
      return images;
    }

    function cycleImgs() {
      // Switch to previous images if available
      if (node.imgs && images.length > 1) {
        if (allow_debug) console.log("node.imgs", node.imgs);
        if (allow_debug) console.log("images", images);
        node.imgs = images; // Show previous image
      }
    }

    //add A button
    let a = null
    function createButtons(params) {
      a = new SmartButton(node.width / 2 - 30, 10, 60, 15, node, "History");
      a.allowVisualHover = true;
      a.isVisible = false;
      // a.shape = Shapes.ROUND_L
      a.roundRadius = 5;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = "12px Arial";
      a.onClick = () => cycleImgs();
    }
    createButtons();

    node.onExecuted = async function (message) {
      while (!node.imgs) {
        if (allow_debug) console.log("wait..");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      a.isVisible = true;
      node.setDirtyCanvas(true,false)
      setTimeout(() => {
        const lastImage = node.imgs?.at(-1);
        if (!images.some(img => img === lastImage)) {
          pushToImgs(lastImage);
        }
      }, 300);

    };

    const man = new BaseSmartWidgetManager(node);
  },
});
