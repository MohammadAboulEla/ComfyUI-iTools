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
  Preview
} from "./widgets.js";
import { Shapes, Colors, lightenColor} from "./utils.js";


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
    node.setDirtyCanvas(true, false);
    if (allow_debug) {
      console.log("node", node);
    }

    //create paint area
    
    const pa = new PaintArea(0,80,512,512);
    pa.yOffset = 80
    node.addCustomWidget(pa);

    const ui = new Widget(0,30,512,50);
    ui.color = lightenColor(LiteGraph.NODE_DEFAULT_BGCOLOR, 20 );
    node.addCustomWidget(ui);

    const b1 = new Button(10,40, "clear");
    b1.shape = Shapes.CIRCLE
    b1.color = "crimson"
    b1.onClick= () =>{
      pa.clearWithColor("white")
    }
    node.addCustomWidget(b1);

    const b2 = new Button(35,405, "save");
    b2.color = "green"
    b2.onClick= () =>{
      pa.saveTempImage()
    }
    node.addCustomWidget(b2);

    const b3 = new Button(65,405, "load");
    b3.color = "blue"
    b3.onClick= () =>{
      pa.loadTempImage()
    }
    node.addCustomWidget(b3);

    const p = new Preview(0,0);
    p.dashColor = "red"
    node.addCustomWidget(p);


    node.onMouseDown = (e, pos, node) => {

      b1.handleClick(pos[0],pos[1])
      b2.handleClick(pos[0],pos[1])
      b3.handleClick(pos[0],pos[1])

      console.log("node", node);
    };

    node.onMouseMove = (e, pos, node) => {
      pa.updateMousePos(pos)
      pa.isMouseDown()
      p.updateMousePos(pos)
    };

    node.onMouseUp = (e, pos, node) => {
      console.log('mouse up',);
    };
    
    node.onMouseLeave = (e) => {
      pa.sendDrawingToAPI()
      p.isMouseIn = false;
    }

    node.onMouseEnter = (e) => {
      p.isMouseIn = true;
    }




    
  },
});

