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
  PaintArea,
  Preview,
} from "./widgets.js";
import { Shapes, Colors, lightenColor } from "./utils.js";

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
    node.resizable = false;
    node.setDirtyCanvas(true, true);
    node.bgcolor = LiteGraph.NODE_DEFAULT_BGCOLOR;
    if (allow_debug) {
      console.log("node", node);
    }

    //create paint area

    const pa = new PaintArea(0, 80, 512, 512);
    pa.yOffset = 80;
    node.addCustomWidget(pa);

    // const ui = new Widget(0, 30, 512, 50);
    // ui.color = lightenColor(LiteGraph.NODE_DEFAULT_BGCOLOR, 5);
    // node.addCustomWidget(ui);

    const cp = new ColorPicker(0, 80, 100, 100);
    node.addCustomWidget(cp);

    const bColor = new Button(462 - 150, 35, "🎨");
    bColor.shape = Shapes.ROUND;
    bColor.color = "crimson";
    bColor.onClick = () => {
     cp.open();
    };
    node.addCustomWidget(bColor);

    const b2 = new Button(462 - 100, 35, "save");
    b2.shape = Shapes.ROUND;
    b2.color = "#5d8aa8";
    b2.onClick = () => {
      pa.saveTempImage();
    };
    node.addCustomWidget(b2);

    const b3 = new Button(462 - 50, 35, "load");
    b3.shape = Shapes.ROUND;
    b3.color = "#915c83";
    b3.onClick = () => {
      pa.loadTempImage();
    };
    node.addCustomWidget(b3);

    const bClear = new Button(462, 35, "clear");
    bClear.shape = Shapes.CIRCLE;
    bClear.color = "grey";
    bClear.onClick = () => {
      pa.clearWithColor("white");
    };
    node.addCustomWidget(bClear);

    const p = new Preview(0, 0);
    p.dashColor = "red";
    node.addCustomWidget(p);

    const s = new Slider(60, 40);
    s.onChange = (v) => {
      p.brushSize = v;
      pa.brushSize = v;
    };
    node.addCustomWidget(s);

    node.onMouseDown = (e, pos, node) => {
      if (pos[1] > 80 && !cp.isSelecting) pa.isPainting = true;
      bClear.handleClick(pos[0], pos[1]);
      bColor.handleClick(pos[0], pos[1]);
      b2.handleClick(pos[0], pos[1]);
      b3.handleClick(pos[0], pos[1]);

      if(cp.isSelecting){
        cp.close()
      }

      console.log('cp.isSelecting',cp.isSelecting);
      console.log("node", node);
    };

    node.onMouseMove = (e, pos, node) => {
      if (pos[1] > 80) pa.updateMousePos(pos);
      p.updateMousePos(pos);
      s.handleMouseMove(pos);
      
      cp.setColorUnderCurser(e);
      if(cp.isVisible) {
        bColor.color = cp.selectedColor;
        pa.brushColor = cp.selectedColor;
      }
    };

    node.onMouseUp = (e, pos, node) => {
      pa.isPainting = false;
      console.log("mouse up");
    };

    node.onMouseLeave = (e) => {
      pa.sendDrawingToAPI();
      p.isMouseIn = false;
    };

    node.onMouseEnter = (e) => {
      p.isMouseIn = true;
    };
  },
});
