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
import { BaseSmartWidgetManager, SmartButton, SmartWidget,SmartSlider, SmartLabel, SmartSwitch, SmartCheckBox } from "./makadi.js";

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
    node.bgcolor = LiteGraph.NODE_DEFAULT_BGCOLOR;
    if (allow_debug) {
      console.log("node", node);
      console.log("app.canvas", app.canvas);
    }
    // START POINT

    const sw = new SmartButton(20, 20, 50, 200, node);
    sw.shape = Shapes.CIRCLE
    sw.onClick = () => {
      console.log("sw clicked");
    };

    const b1 = new SmartButton(90, 60, 90, 20, node, "Button", {
      withTagWidth: 10
    });
    b1.onClick = () => {
      if (sw.color == "crimson") {sw.color = LiteGraph.WIDGET_BGCOLOR }
      else{ sw.color = "crimson"}
      sw.textColor = b1.textColor
      sw.text = "B Tag"
      console.log("b1 clicked");
    };

    const b2 = new SmartButton(190, 60, 60, 20, node, "Button2", {color:"#a4c639", textColor:"black"});
    b2.onClick = () => {
      sw.text = "B2"
      sw.color = b2.color
      sw.textColor = b2.textColor
      console.log("b2 clicked");
    };
    const b3 = new SmartButton(190 + 70, 60 , 20, 20 , node, "B3", 
      {color:"#b8860b", textColor:"black", shape: Shapes.CIRCLE});
    b3.onClick = () => {
      sw.text = "B3"
      sw.textColor = b3.textColor
      sw.color = b3.color
      console.log("b2 clicked");
    };

    const slider = new SmartSlider(90, 90, 200, 15, node, {
      minValue: 0,
      maxValue: 100,
      value: 50,
      text:"Slider: ",
      onValueChange: (value) => {
        //console.log("Slider value changed:", value);
      }
    });

    const slider2 = new SmartSlider(90, 120, 200, 15, node, {
      minValue: 0,
      maxValue: 100,
      value: 50,
      isProgressBar: true,
      //disableText: true,
      textYoffset : 20,
      text:"Progressbar: ",
      onValueChange: (value) => {
        //console.log("Slider value changed:", value);
      }
    });

    const swi = new SmartSwitch(120, 160, 80, 15, node,);
    
    const lbl = new SmartLabel(130, 180, 12, 12, node,"Grid Snap");
    const cb = new SmartCheckBox(115, 180, 10, 10, node,);


    const manager = new BaseSmartWidgetManager(node);

    // const canvas = window.LGraphCanvas
    // const myCtx = app.ctx
    // myCtx.fillStyle = "rgba(255, 0, 0, 1.0)";
    // myCtx.fillRect(50, 50, 200, 100); // Example: Red semi-transparent rectangle

    //     app.canvas.onDrawForeground = function(ctx) {
    //         // Custom Drawing on the Main Canvas
    //         ctx.fillStyle = "rgba(255, 0, 0, 1.0)";
    //         ctx.fillRect(50, 50, 200, 100); // Example: Red semi-transparent rectangle
    //     //app.draw(true, true);
    // }

    // Usage
    //const paintTool = new PaintToolV2(node);

    // //create paint area

    // const pa = new PaintArea(0, 80, 512, 512);
    // pa.yOffset = 80;
    // node.addCustomWidget(pa);

    // // const ui = new Widget(0, 30, 512, 50);
    // // ui.color = lightenColor(LiteGraph.NODE_DEFAULT_BGCOLOR, 5);
    // // node.addCustomWidget(ui);

    // const cp = new ColorPicker(512 - 100, 80, 100, 100);
    // node.addCustomWidget(cp);

    // const bColor = new Button(462, 35, "🎨"); //462 - 150, 35
    // bColor.shape = Shapes.ROUND;
    // bColor.color = "crimson";
    // bColor.onClick = () => {
    //   cp.open();
    // };
    // node.addCustomWidget(bColor);

    // const b2 = new Button(462 - 100, 35, "save");
    // b2.shape = Shapes.ROUND;
    // b2.color = "#5d8aa8";
    // b2.onClick = () => {
    //   pa.saveTempImage();
    // };
    // node.addCustomWidget(b2);

    // const b3 = new Button(462 - 50, 35, "load");
    // b3.shape = Shapes.ROUND;
    // b3.color = "#915c83";
    // b3.onClick = () => {
    //   pa.loadTempImage();
    // };
    // node.addCustomWidget(b3);

    // const bClear = new Button(462 - 150, 35, "clear"); // 462, 35
    // bClear.shape = Shapes.CIRCLE;
    // bClear.color = "grey";
    // bClear.onClick = () => {
    //   pa.clearWithColor("white");
    // };
    // node.addCustomWidget(bClear);

    // const p = new Preview(0, 0);
    // p.dashColor = "red";
    // node.addCustomWidget(p);

    // const s = new Slider(60, 40);
    // s.onChange = (v) => {
    //   p.brushSize = v;
    //   pa.brushSize = v;
    // };
    // node.addCustomWidget(s);

    // node.onMouseDown = (e, pos, node) => {
    //   if (pos[1] > 80 && !cp.isSelecting) pa.isPainting = true;
    //   bClear.handleClick(pos[0], pos[1]);
    //   bColor.handleClick(pos[0], pos[1]);
    //   b2.handleClick(pos[0], pos[1]);
    //   b3.handleClick(pos[0], pos[1]);

    //   if (cp.isSelecting) {
    //     cp.close();
    //   }

    //   console.log("cp.isSelecting", cp.isSelecting);
    //   console.log("node", node);
    // };

    // node.onMouseMove = (e, pos, node) => {
    //   if (pos[1] > 80) pa.updateMousePos(pos);
    //   p.updateMousePos(pos);
    //   s.handleMouseMove(pos);

    //   cp.setColorUnderCurser(e);
    //   if (cp.isVisible) {
    //     bColor.color = cp.selectedColor;
    //     pa.brushColor = cp.selectedColor;
    //   }

    //   //if(pos[1]>80) node.flags.pinned = true;
    // };

    // node.onMouseUp = (e, pos, node) => {
    //   pa.isPainting = false;
    //   console.log("mouse up");
    // };

    // node.onMouseLeave = (e) => {
    //   pa.sendDrawingToAPI();
    //   p.isMouseIn = false;
    //   //node.flags.pinned = false;
    // };

    // node.onMouseEnter = (e, pos) => {
    //   p.isMouseIn = true;
    // };
  },
});
