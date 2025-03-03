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
  trackMouseColor,
  fakeMouseDown,
  getIndexByDimensions,
} from "./utils.js";
import { BaseSmartWidget, SmartInfo } from "./makadi.js";

class ValueClass{
  constructor(value){
    this.name = "counter"
    this.value = value
  }
}

app.registerExtension({
  name: "iTools.domNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsDomNode") {
      return;
    }
    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = async function (message) {
      onExecuted?.apply(this, arguments);
      if (allow_debug) console.log("iToolsDomNode executed", message);
    };
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsDomNode") {
      return;
    }
    node.size = [300,300] 

    // wait for init
    const timeout = 3000; // 3 seconds
    const startTime = Date.now();
    while (!node.graph) {
      if (Date.now() - startTime > timeout) {
        if (allow_debug) console.error("Timeout: Failed to load graph.");
        break;
      }
      if (allow_debug) console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    const vc = new ValueClass(0)
    node.addCustomWidget(vc)
    
    // Function to style buttons
    function styleButton(button) {
      button.style.backgroundColor = "#4CAF50"; // Green background
      button.style.border = "none";
      button.style.color = "white";
      button.style.padding = "5px 12px";
      button.style.textAlign = "center";
      button.style.textDecoration = "none";
      button.style.display = "inline-block";
      button.style.fontSize = "0.8em";
      button.style.margin = "4px 2px";
      button.style.cursor = "pointer";
      button.style.borderRadius = "4px";
    }
    
    function createDiv() {
      const div = document.createElement("div");
      div.style.visibility = "hidden";
      div.id = `node-${node.id}`;
      div.style.width = "0px";
      div.style.height = "0px";
      div.style.position = "absolute";
      div.style.top = "0px";
      div.style.left = "0px";
      div.style.backgroundColor = "crimson"; // Neutral background
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.alignItems = "center";
      div.style.justifyContent = "center";
      div.style.border = "none"; // Removed border
      div.style.borderRadius = "12px"; // Increased border radius
      div.style.padding = "5px"; // Increased padding
   

      const label0 = document.createElement("label");
      label0.textContent = "HTML DOM Elements in Comfy Node";
      label0.style.fontSize = "0.8em"; // Increased font size
      label0.style.fontWeight = "bold"; // Added font weight
      label0.style.marginBottom = "5px"; // Added margin bottom

      const label1 = document.createElement("label");
      label1.textContent = "CounterApp example using vanilla js";
      label1.style.fontSize = "0.7em"; // Increased font size
      label1.style.fontWeight = "bold"; // Added font weight
      label1.style.marginBottom = "5px"; // Added margin bottom

      const label = document.createElement("label");
      label.textContent = "0";
      label.style.fontSize = "2em"; // Increased font size
      label.style.marginBottom = "5px"; // Added margin bottom

      const buttonContainer = document.createElement("div"); // Container for buttons
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "10px"; // Added gap between buttons

      const btnIncrease = document.createElement("button");
      btnIncrease.textContent = "+";
      styleButton(btnIncrease); // Apply button styles

      const btnDecrease = document.createElement("button");
      btnDecrease.textContent = "-";
      styleButton(btnDecrease);

      const btnReset = document.createElement("button");
      btnReset.textContent = "Reset";
      styleButton(btnReset);

      btnIncrease.addEventListener("click", () => {
        label.textContent = parseInt(label.textContent) + 1;
        vc.value = vc.value + 1
      });

      btnDecrease.addEventListener("click", () => {
        label.textContent = parseInt(label.textContent) - 1;
        vc.value = vc.value - 1
      });

      btnReset.addEventListener("click", () => {
        label.textContent = "0";
        vc.value = 0
      });

      buttonContainer.appendChild(btnIncrease);
      buttonContainer.appendChild(btnDecrease);
      buttonContainer.appendChild(btnReset);

      div.appendChild(label0);
      div.appendChild(label1);
      div.appendChild(label);
      div.appendChild(buttonContainer);

      document.body.appendChild(div);
    }
    
    function updateDivPosition(node, offsetX = 40, offsetY = 0) {
      if (!node || !node.pos || !node.size || !app.canvas.ds) return;

      const div = document.getElementById(`node-${node.id}`);
      if (!div) return;
      div.style.visibility = "visible";

      const zoom = app.canvas.ds.scale || 1;
      if(allow_debug) console.log('zoom',zoom);
      const canvasOffsetX = app.canvas.ds.offset[0] || 0;
      const canvasOffsetY = app.canvas.ds.offset[1] || 0;

      // Calculate scaled dimensions with margin
      const scaledWidth = (node.size[0] * zoom * 95) / 100;
      const scaledHeight = (node.size[1] * zoom * 70) / 100;

      // Apply translation (include offsets)
      let screenX = (node.pos[0] + canvasOffsetX + offsetX / zoom) * zoom;
      let screenY = (node.pos[1] + canvasOffsetY + offsetY / zoom) * zoom;

      // Center horizontally and align to bottom
      screenX = screenX + (node.size[0] * zoom - scaledWidth) / 2; // Center in x-axis
      screenY = screenY -10 + node.size[1] * zoom - scaledHeight; // Align to bottom

      div.style.width = `${scaledWidth}px`;
      div.style.height = `${scaledHeight}px`;
      div.style.transform = `translate(${screenX}px, ${screenY}px)`;
      div.style.borderRadius = `${zoom * 8}px`;

      // Disable rendering of div *content* if zoom is below a value
      const children = div.children; // Get all children of the div
      for (let i = 0; i < children.length; i++) {
        if (zoom < 0.6) {
          children[i].style.visibility = "hidden"; // Hide each child
        } else {
          children[i].style.visibility = "visible"; // Show each child
        }
      }
    }

    function deleteDiv() {
      // Construct the div's id based on the node's id
      const divId = `node-${node.id}`;
      // Retrieve the div element
      const div = document.getElementById(divId);
      // If the div exists, remove it from its parent
      if (div) {
          div.remove();
      } else {
          console.warn(`Div with id ${divId} not found.`);
      }
  }
  

    function mousePos(node) {
      const graphMouse = app.canvas.graph_mouse;
      return {
        x: graphMouse[0] - node.pos[0],
        y: graphMouse[1] - node.pos[1],
      };
    }

    //START POINT
    if (allow_debug) console.log("node", node);
    if (allow_debug) console.log("app", app);

    createDiv();
    node.setDirtyCanvas(true, false);

    //BINDING
    app.canvas.onMouseDown = (e) => {
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsDomNode") {
        }
      });
    };
    app.canvas.onDrawForeground = (ctx) => {
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsDomNode") {
          updateDivPosition(n);
        }
      });
    };
    app.canvas.canvas.onclick = (e) => {
      const nodes = app.graph.nodes;
      nodes.forEach((n) => {
        if (n.type === "iToolsDomNode") {
        }
      });
    };

    node.onRemoved = () => {
      deleteDiv()
    };

  },
});
