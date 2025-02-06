import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import {
  Button,
  Label,
  Slider,
  DropdownMenu,
  Widget,
  Checkbox,
  ColorPicker,
  Preview,
} from "./widgets.js";
import { Shapes, Colors, lightenColor } from "./utils.js";
import {
  BaseSmartWidgetManager,
  SmartButton,
  SmartWidget,
  SmartSlider,
  SmartLabel,
  SmartSwitch,
  SmartCheckBox,
  PaintArea,
} from "./makadi.js";

class PaintToolV1 {
  constructor(node) {
    this.node = node;

    const window = globalThis;
    console.log("app.window", window);

    // root.onkeydown = () => {
    //   console.log("wow");
    // };

    // const original = window.onkeydown
    // window.onkeydown = () =>{
    //   console.log('key down',);
    //   return original();
    // }

    // const originalSetTimeout = window.setTimeout;

    // window.setTimeout = function () {
    //   //console.log('ok',);

    //   return originalSetTimeout(5000);
    // };

    // Create paint area
    this.pa = new PaintArea(0, 80, 512, 512);
    this.pa.yOffset = 80;
    this.node.addCustomWidget(this.pa);

    // Color Picker
    this.cp = new ColorPicker(512 - 100, 80, 100, 100);
    this.node.addCustomWidget(this.cp);

    // Color Button
    this.bColor = new Button(462, 35, "🎨");
    this.bColor.shape = Shapes.ROUND;
    this.bColor.color = "crimson";
    this.bColor.onClick = () => {
      this.cp.open();
    };
    this.node.addCustomWidget(this.bColor);

    // Save Button
    this.b2 = new Button(462 - 100, 35, "save");
    this.b2.shape = Shapes.ROUND;
    this.b2.color = "#5d8aa8";
    this.b2.onClick = () => {
      this.pa.saveTempImage();
    };
    this.node.addCustomWidget(this.b2);

    // Load Button
    this.b3 = new Button(462 - 50, 35, "load");
    this.b3.shape = Shapes.ROUND;
    this.b3.color = "#915c83";
    this.b3.onClick = () => {
      this.pa.loadTempImage();
    };
    this.node.addCustomWidget(this.b3);

    // Clear Button
    this.bClear = new Button(462 - 150, 35, "clear");
    this.bClear.shape = Shapes.CIRCLE;
    this.bClear.color = "grey";
    this.bClear.onClick = () => {
      this.pa.clearWithColor("white");
    };
    this.node.addCustomWidget(this.bClear);

    // Preview
    this.p = new Preview(0, 0);
    this.p.dashColor = "red";
    this.node.addCustomWidget(this.p);

    // Slider
    this.s = new Slider(60, 40);
    this.s.onChange = (v) => {
      this.p.brushSize = v;
      this.pa.brushSize = v;
    };
    this.node.addCustomWidget(this.s);

    // Event Listeners
    this.node.onMouseDown = (e, pos) => this.onMouseDown(e, pos);
    this.node.onMouseMove = (e, pos) => this.onMouseMove(e, pos);
    this.node.onMouseUp = () => this.onMouseUp();
    this.node.onMouseLeave = () => this.onMouseLeave();
    this.node.onMouseEnter = (e, pos) => this.onMouseEnter(e, pos);
  }

  onMouseDown(e, pos) {
    console.log("node", this.node);
    this.node.locked = true;
    if (pos[1] > 80 && !this.cp.isSelecting) this.pa.isPainting = true;
    this.bClear.handleClick(pos[0], pos[1]);
    this.bColor.handleClick(pos[0], pos[1]);
    this.b2.handleClick(pos[0], pos[1]);
    this.b3.handleClick(pos[0], pos[1]);

    if (this.cp.isSelecting) {
      this.cp.close();
    }

    if (pos[1] > 80) {
      this.node.flags.pinned = true;
    }
  }

  onMouseMove(e, pos, node) {
    window.clearTimeout();
    //console.log("e", e.target.nodeName);
    if (this.s.isHandleClicked(pos)) this.s.handleMouseMove(pos);
    // this.s.isDragging(pos)
    //   ? (this.pa.blockPainting = true)
    //   : (this.pa.blockPainting = false);

    this.pa.updateMousePos(pos);
    this.p.updateMousePos(pos);

    if (this.cp.isVisible) {
      this.cp.setColorUnderCurser(e);
      this.bColor.color = this.cp.selectedColor;
      this.pa.brushColor = this.cp.selectedColor;
    }
  }

  onMouseUp() {
    this.pa.isPainting = false;
  }

  onMouseLeave() {
    this.pa.sendDrawingToAPI();
    this.p.isMouseIn = false;
    this.node.flags.pinned = false;
  }

  onMouseEnter(e, pos) {
    this.p.isMouseIn = true;
    //app.canvas.zoom_speed = 1.1; //disable zoom 1.0
  }

  typeError() {
    try {
    } catch (error) {
      if (error instanceof TypeError) {
        console.log("Caught a TypeError:", error.message);
      } else {
        throw error; // Re-throw if it's not a TypeError
      }
    }
  }
}

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
    //node.pos = [0, 0];
    //node.resizable = false;
    node.setDirtyCanvas(true, true);
    //node.bgcolor = LiteGraph.NODE_DEFAULT_BGCOLOR;
    if (allow_debug) {
      console.log("node", node);
      console.log("app.canvas", app.canvas);
    }
    // START POINT

    let pa = new PaintArea(0, 80, 512, 512, node);

    const ui = new SmartWidget(0, 30, node.width, 50, node, {
      color: lightenColor(LiteGraph.WIDGET_BGCOLOR, 5),
      shape: Shapes.SQUARE,
      allowVisualPress: false,
      allowVisualHover: false,
      outline: false,
    });

    const bColor = new SmartButton(5, 35, 40, 40, node);
    bColor.shape = Shapes.CIRCLE;
    (bColor.allowVisualHover = false),
      (bColor.allowVisualPress = false),
      (bColor.onClick = () => {
        console.log("bColor  clicked");
      });

    const brushSlider = new SmartSlider(55, 40, 150, 15, node, {
      minValue: 5,
      maxValue: 100,
      value: 20,
      textColorNormalize: true,
      isProgressBar: true,
      //disableText: true,
      //textYoffset: 20,
      text: "Brush Size: ",
      onValueChange: (value) => {
        //console.log("Slider value changed:", value);
      },
    });

    const lbl = new SmartLabel(70, 62.5, 12, 12, node, "Auto Pin");
    const cb = new SmartCheckBox(55, 60 + 2.5, 12, 12, node);

    const bFill = new SmartButton(215, 35, 40, 15, node, "Fill", {
      withTagWidth: 10,
      textXoffset: 5,
    });
    bFill.onClick = () => {
      pa.clearWithColor(bColor.color);
    };

    const bHold = new SmartButton(215 + 45, 35, 40, 15, node, "Hold", {
      textXoffset: 0,
    });
    bHold.onClick = () => {pa.saveTempImage()};

    const bFetch = new SmartButton(215 + 45 + 45, 35, 40, 15, node, "Fetch", {
      textXoffset: 0,
    });
    bFetch.onClick = () => {pa.loadTempImage()};

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
      pa.switchLayer()

    };

    const bh = []; // Declare an array
    const commonColors = [
      "#000000", // Black
      "#FFFFFF", // White
      "#FF0000", // Red
      "#0000FF", // Blue
      "#008000", // Green
      "#FFFF00", // Yellow
      "#FFA500", // Orange
      "#800080", // Purple
      "#A52A2A", // Brown
      "#808080", // Gray
    ];

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
              bColor.color = color; // Use captured color
              pa.brushColor = color;
              console.log(`Widget ${index} clicked`);
            },
          }
        );

        bh.push(widget);
        index++; // Increment unique index
      }
    }

    const manager = new BaseSmartWidgetManager(node);
  },
});
