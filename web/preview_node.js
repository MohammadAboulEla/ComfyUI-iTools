import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidgetManager, SmartButton } from "./makadi.js";
import { Shapes } from "./utils.js";

app.registerExtension({
  name: "iTools.previewNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsPreviewImage") {
      // // Store the original computeSize method
      // const originalComputeSize = nodeType.prototype.computeSize;
      // // Override the computeSize method
      // nodeType.prototype.computeSize = function () {
      //   // Call the original method to get the default size
      //   const storeWidgets = this.widgets;
      //   this.widgets = []
      //   const size = originalComputeSize?.apply(this, arguments);
      //   setTimeout(() => {
      //     this.widgets = storeWidgets;
      //     if(allow_debug) console.log('this.widgets',this.widgets);
      //   }, 300);
      //   return size;
      // };
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

    function showPrev() {
      // Only cycle between last two images
      if (images.length > 1) {
        // Get current image
        const currentImg = node.imgs[0];
        
        // Get last two images from history
        const lastTwo = images.slice(-2);
        
        // If current is last image, show second to last
        // If current is second to last, show last
        const nextImg = currentImg === lastTwo[1] ? lastTwo[0] : lastTwo[1];
        
        // Update display
        node.imgs = [nextImg];
        node.setDirtyCanvas(true, false);
        
        if(allow_debug) console.log('Toggling between last two images');
      }
    }

    //add A button
    let a = null;
    let b = null;
    function createButtons(params) {
      a = new SmartButton(80, 10, 55, 15, node, "History");
      a.allowVisualHover = true;
      a.isVisible = false;
      a.shape = Shapes.ROUND_L;
      a.roundRadius = 5;
      a.outlineWidth = 1;
      a.outlineColor = "#656565";
      a.color = "#222222";
      a.font = "12px Arial";
      a.onClick = () => cycleImgs();

      b = new SmartButton(80+55, 10, 120, 15, node, "Current / Previous");
      b.allowVisualHover = true;
      b.isVisible = false;
      b.shape = Shapes.ROUND_R;
      b.roundRadius = 5;
      b.outlineWidth = 1;
      b.outlineColor = "#656565";
      b.color = "#222222";
      b.font = "12px Arial";
      b.onClick = () => showPrev();
    }
    createButtons();
    
    node.onResize = () => {
    };

    node.onExecuted = async function (message) {
      if (allow_debug) console.log("node", node);
      while (!node.imgs) {
        if (allow_debug) console.log("wait..");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      node.widgets[2].computedHeight = 26;
      a.isVisible = true;
      b.isVisible = true;
      node.setDirtyCanvas(true, false);
      setTimeout(() => {
        const lastImage = node.imgs?.at(-1);
        if (!images.some((img) => img === lastImage)) {
          pushToImgs(lastImage);
        }
      }, 300);
    };

    const man = new BaseSmartWidgetManager(node);
  },
});
