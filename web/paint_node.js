import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

import {
  Shapes,
  Colors,
  lightenColor,
  canvasRatios,
  canvasScales,
  commonColors,
} from "./utils.js";
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
  AdvancedLabel
} from "./makadi.js";


app.registerExtension({
  name: "iTools.paintNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsPaintNode") {
      return;
    }

    if (allow_debug) {
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
    node.setSize([512, 592]);
    node.resizable = false;
    node.setDirtyCanvas(false, true);
    if (allow_debug) {
      console.log("node", node);
      console.log("app.canvas", app.canvas);
    }
    // START POINT
    const pa = new SmartPaintArea(0, 80, 512, 512, node);
    const p = new SmartPreview(0, 80, 512, 512, node);
    const cp = new SmartColorPicker(0, 80, 170, 170, node);

    const ui = new SmartWidget(0, 30, node.width, 50, node, {
      color: lightenColor(LiteGraph.WIDGET_BGCOLOR, 5),
      shape: Shapes.SQUARE,
      allowVisualPress: false,
      allowVisualHover: false,
      outline: false,
    });

    const bColor = new SmartButton(5, 35, 40, 40, node);
    bColor.shape = Shapes.CIRCLE;
    bColor.color = "crimson";
    (bColor.allowVisualHover = false),
      (bColor.allowVisualPress = false),
      (bColor.onPress = () => {
        cp.open();
        console.log("bColor  clicked");
      });

    const brushSlider = new SmartSlider(55, 35, 150, 20, node, {
      minValue: 1,
      maxValue: 100,
      value: 20,
      textColorNormalize: true,
      isProgressBar: true,
      //disableText: true,
      //textYoffset: 20,
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
    
    const dmR = new SmartDropdownMenu(
      55,
      60,
      40,
      15,
      node,
      "Ratio",
      ratioNames
    );

    const dmS = new SmartDropdownMenu(
      55 + 45,
      60,
      40,
      15,
      node,
      "Size",
      sizeNames
    );

    dmR.onSelect = () => {
      const itemA = ratiosArray[dmR.selectedItemIndex][1];
      const itemB = sizesArray[dmS.selectedItemIndex][1];
      pa.setNewSize(itemA, itemB);
      //console.log(itemA,itemB);
    };

    dmS.onSelect = () => {
      const itemA = ratiosArray[dmR.selectedItemIndex][1];
      const itemB = sizesArray[dmS.selectedItemIndex][1];
      pa.setNewSize(itemA, itemB);
      //console.log(itemA,itemB);
    };

    // block paint when drop menus open
    pa.onPress = () => {
      if (dmR.isOpen || dmS.isOpen) {
        pa.blockPainting = true;
      } else {
        pa.blockPainting = false;
      }
    };

    const bUndo = new SmartButton(185 - 25, 60, 20, 15, node, "↺", {
      textXoffset: 0,
    });
    bUndo.onClick = () => {
      pa.undo();
    };

    const bRedo = new SmartButton(185, 60, 20, 15, node, "↻", {
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

    const bClear = new SmartButton(
      215 + 45 + 45 + 45,
      35,
      40,
      15,
      node,
      "Clear",
      {
        textXoffset: 0,
      }
    );
    bClear.onClick = () => {
      pa.clearWithColor("white");
    };

    const layerSwitch = new SmartSwitch(215, 55, 175, 20, node);
    layerSwitch.textOn = "Foreground";
    layerSwitch.textOff = "Background";
    layerSwitch.onValueChange = () => {
      pa.switchLayer();
    };

    const bh = [];
    let index = 0; // Unique index for bh array
    for (let i = 1; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        const color = commonColors[index % commonColors.length]; // Capture color in scope
        const widget = new SmartWidget(
          512 - 22 * i - 3,
          35 + 22 * j,
          18,
          18,
          node,
          {
            color: color,
            shape: Shapes.CIRCLE,
            onClick: () => {
              bColor.color = color;
              bFill.tagColor = color;
              pa.brushColor = color;
              console.log(`Widget ${index} clicked`);
            },
          }
        );

        bh.push(widget);
        index++; // Increment unique index
      }
    }

    // Common Node Events
    node.onMouseMove = (e, pos) => {
      if (cp.isVisible) {
        cp.setColorUnderCurser(e);
        bColor.color = cp.selectedColor;
        bFill.tagColor = cp.selectedColor;
        pa.brushColor = cp.selectedColor;
      }
    };

    node.onMouseEnter = (e, pos) => {};

    node.onMouseLeave = (e) => {
      pa.sendDrawingToAPI();
    };

    app.canvas.canvas.onkeydown = (event) => {
      if (event.ctrlKey && event.key === "z") {
        console.log("Ctrl+Z was pressed");
        event.preventDefault();
      }
    };

    app.canvas.canvas.onkeydown = (event) => {
      if  (event.key === "Alt") {
        event.preventDefault();
        if (cp.isVisible && cp.x === 0){
          cp.x = 512-cp.width
        }else{cp.x = 0}
      }
    };

    app.canvas.canvas.onkeyup = (event) => {
      if (event.key === "Alt") {
        event.preventDefault();

      }
    };

    app.canvas.canvas.onmouseleave = () => {
    };

    const manager = new BaseSmartWidgetManager(node);
  },
});
