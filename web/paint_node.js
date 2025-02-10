import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

import { Shapes, Colors, lightenColor, canvasRatios, canvasScales, commonColors, trackMouseColor, fakeMouseDown } from "./utils.js";
import {
  BaseSmartWidgetManager,
  SmartButton,
  SmartWidget,
  SmartSlider,
  SmartLabel,
  SmartSwitch,
  SmartCheckBox,
  SmartPaintArea,
  SmartPreview,
  SmartColorPicker,
  SmartDropdownMenu,
  TextObject,
  AdvancedLabel,
  SmartInfo,
  SmartImage,
} from "./makadi.js";

app.registerExtension({
  name: "iTools.paintNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsPaintNode") {
      return;
    }
    const window = globalThis;

    if (allow_debug) {
      console.log("window", window);
      console.log("nodeType", nodeType);
      console.log("nodeData", nodeData);
      console.log("app", app);
    }
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPaintNode") {
      return;
    }

    while (node.graph === null) {
      console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // NODE SETTINGS
    node.setSize([512, 592]);
    node.resizable = false;
    node.setDirtyCanvas(true, true);

    if (allow_debug) {
      console.log("node", node);
      console.log("app", app);
      console.log("app.canvas", app.canvas);
    }

    // START POINT
    let canvasImgs = [];
    let keyPick = false;
    let isHoldingShift = false;

    const pa = new SmartPaintArea(0, 80, 512, 512, node);
    const p = new SmartPreview(0, 80, 512, 512, node);
    const cp = new SmartColorPicker(0, 80, 170, 170, node);
    const info = new SmartInfo(512 / 2 - 40, 85, 80, 15, node, "canvas size");
    const ui = new SmartWidget(0, 30, node.width, 50, node, {
      color: lightenColor(LiteGraph.WIDGET_BGCOLOR, 5),
      shape: Shapes.SQUARE,
      allowVisualPress: false,
      allowVisualHover: false,
      outline: false,
    });

    const bLoad = new SmartButton(5, 5, 80, 20, node, "Load Image", {
      textXoffset: 0,
    });
    bLoad.onClick = () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".png";

      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const imageUrl = e.target.result;

            // Create a new SmartImage instance
            const img = new SmartImage(0, 80, 80, 80, node, {});

            // Update the image source dynamically
            img.updateImage(imageUrl);

            // Add the SmartImage instance to the canvasImgs array
            canvasImgs.push(img);

            // Optional: Define the onImgLoaded callback
            img.onImgLoaded = () => {
              if (this.allowDebug) console.log("Image loaded successfully!");
            };
          };

          reader.readAsDataURL(file);
          if (this.allowDebug) console.log(`File name: ${file.name}`);

          // Clear the file input value to allow reselection of the same file
          fileInput.value = "";
        }
      });

      fileInput.click();
    };

    const bColor = new SmartButton(5, 35, 40, 40, node);
    bColor.shape = Shapes.HVL_CIRCLE;
    bColor.color = "crimson";
    (bColor.allowVisualHover = false),
      (bColor.allowVisualPress = false),
      (bColor.onPress = () => {
        cp.open();
        info.restart("Alt Key");
      });

    const bColor2 = new SmartButton(5, 35, 40, 40, node);
    bColor2.shape = Shapes.HVR_CIRCLE;
    bColor2.color = "orange";
    (bColor2.allowVisualHover = false),
      (bColor2.allowVisualPress = false),
      (bColor2.onPress = () => {
        cp.openHidden();
      });

    const brushSlider = new SmartSlider(55, 35, 150, 20, node, {
      minValue: 1,
      maxValue: 100,
      value: 20,
      textColorNormalize: true,
      isProgressBar: true,
      text: "Brush Size: ",
      onValueChange: (value) => {
        p.brushSize = value;
        pa.brushSize = value;
      },
    });

    const ratiosArray = Array.from(canvasRatios.entries());
    const sizesArray = Array.from(canvasScales.entries());
    const ratioNames = Array.from(canvasRatios.keys());
    const sizeNames = Array.from(canvasScales.keys());

    const dmR = new SmartDropdownMenu(5, 85, 40, 15, node, "Ratio", ratioNames);
    const dmS = new SmartDropdownMenu(5 + 45, 85, 40, 15, node, "Size", sizeNames);
    dmR.isVisible = false;
    dmS.isVisible = false;

    dmR.onSelect = () => {
      resizeCanvas(dmR, dmS, ratiosArray, sizesArray, pa, info);
    };
    dmS.onSelect = () => {
      resizeCanvas(dmR, dmS, ratiosArray, sizesArray, pa, info);
    };

    const bCanvas = new SmartButton(55, 60, 15, 15, node, "C", {
      textXoffset: 0,
    });
    bCanvas.onClick = () => {
      if (dmR.isVisible || dmS.isVisible) {
        dmR.isVisible = false;
        dmS.isVisible = false;
        bCanvas.toggleActive()
      } else {
        dmR.isVisible = true;
        dmS.isVisible = true;
        bCanvas.toggleActive()
      }
    };

    const bUndo = new SmartButton(190 - 20, 60, 15, 15, node, "↺", {
      textXoffset: 0,
    });
    bUndo.onClick = () => {
      pa.undo();
    };

    const bRedo = new SmartButton(190, 60, 15, 15, node, "↻", {
      textXoffset: 0,
    });
    bRedo.onClick = () => {
      pa.redo();
    };

    const bFill = new SmartButton(215, 35, 40, 15, node, "Fill", {
      withTagWidth: 10,
      textXoffset: 5,
    });
    bFill.onClick = () => {
      pa.fillWithColor(bColor.color);
    };

    const bHold = new SmartButton(215 + 45, 35, 40, 15, node, "Hold", {
      textXoffset: 0,
    });
    bHold.onClick = () => {
      pa.saveTempImage();
    };

    const bFetch = new SmartButton(215 + 45 + 45, 35, 40, 15, node, "Fetch", {
      textXoffset: 0,
    });
    bFetch.onClick = () => {
      pa.loadTempImage();
    };

    const bClear = new SmartButton(215 + 45 + 45 + 45, 35, 40, 15, node, "Clear", {
      textXoffset: 0,
    });
    bClear.onClick = () => {
      pa.clearWithColor("white");
    };

    // Create layer switch
    const layerSwitch = new SmartSwitch(215, 55, 175, 20, node);
    layerSwitch.textOn = "Foreground";
    layerSwitch.textOff = "Background";
    layerSwitch.onValueChange = () => {
      pa.switchLayer();
    };

    // Create colors buttons
    const bh = [];
    let bhIndex = 0;
    for (let i = 1; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        const color = commonColors[bhIndex % commonColors.length]; // Capture color in scope
        const widget = new SmartWidget(512 - 22 * i - 3, 35 + 22 * j, 18, 18, node, {
          color: color,
          shape: Shapes.CIRCLE,
          onClick: () => {
            bColor.color = color;
            bFill.tagColor = color;
            pa.brushColor = color;
            if (this.allowDebug) console.log(`Widget ${bhIndex} clicked`);
          },
        });

        bh.push(widget);
        bhIndex++; // Increment unique index
      }
    }

    // COMMON FUNCTIONS
    function pickColor(e) {
      if (cp.isVisible || isHoldingShift) {
        bFill.tagColor = trackMouseColor(e, app.canvas.canvas);
        pa.brushColor = trackMouseColor(e, app.canvas.canvas);
        cp.selectedColor = trackMouseColor(e, app.canvas.canvas);

        if (cp.isGhost) {
          bColor2.color = trackMouseColor(e, app.canvas.canvas);
        } else {
          bColor.color = trackMouseColor(e, app.canvas.canvas);
        }
      }
    }
    function resizeCanvas(dmR, dmS, ratiosArray, sizesArray, pa, info) {
      if (dmR.selectedItemIndex === -1) dmR.selectedItemIndex = 0;
      if (dmS.selectedItemIndex === -1) dmS.selectedItemIndex = 0;
      const itemA = ratiosArray[dmR.selectedItemIndex][1];
      const itemB = sizesArray[dmS.selectedItemIndex][1];
      pa.setNewSize(itemA, itemB);
      info.restart(`${itemA.width * itemB} x ${itemA.height * itemB}`);
      //if (this.allowDebug) console.log(itemA,itemB);
    }

    // COMMON ACTIONS
    pa.onPress = () => {
      pa.blockPainting = false;

      // Block painting when drop menus open
      if (dmR.isMouseInMenu() || dmR.isMouseIn() || dmS.isMouseInMenu() || dmS.isMouseIn()) {
        pa.blockPainting = true;
      }
      // Block painting on images
      canvasImgs.forEach((img) => {
        if (img.isMouseIn(10)) {
          pa.blockPainting = true;
        }
      });
    };

    pa.onUpdate = () => {
      // disable preview circle on canvas images
      canvasImgs.forEach((img) => {
        if (!img.isMouseIn(10)) {
          p.isVisible = true;
        } else {
          p.isVisible = false;
        }
      });
    };

    // COMMON NODE EVENTS
    node.onMouseDown = (e, pos, node) => {
      pickColor(e);

      canvasImgs = canvasImgs.filter((img) => !img.markDelete);
    };

    node.onMouseUp = (e, pos, node) => {
      setTimeout(() => {
        if (!pa.isPainting) pa.sendDrawingToAPI();
      }, 1000);
    };

    node.onMouseMove = (e, pos) => {
      pickColor(e);
    };

    node.onMouseEnter = (e, pos, node) => {};

    node.onMouseLeave = (e) => {};

    // COMMON CLICKS EVENTS
    app.canvas.canvas.onkeydown = (event) => {
      event.preventDefault(); //important
      if (event.key === "Alt") {
        // plot image on back ground
        canvasImgs.forEach((img) => {
          if (img.isMouseIn(10)) {
            const ctx = pa.isPaintingBackground ? pa.backgroundCtx : pa.foregroundCtx;
            img.plotImageOnCanvas(ctx, pa.x, pa.y, dmS.selectedItemIndex);
          }
        });

        // change color picker position
        if (cp.isVisible) {
          cp.x === 0 ? (cp.x = 512 - cp.width) : (cp.x = 0);
        }
      }

      if (event.key === "Shift") {
        info.restart("Shift", 0);
        isHoldingShift = true;
      }
    };

    app.canvas.canvas.onkeyup = (event) => {
      if (event.key === "Shift") {
        isHoldingShift = false;
      }
    };

    const manager = new BaseSmartWidgetManager(node);
  },
});
