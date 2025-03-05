import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

class ValueClass {
  constructor(value) {
    this.name = "counter";
    this.value = value;
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
      div.style.width = "50px";
      div.style.height = "50px";
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
        vc.value = vc.value + 1;
      });

      btnDecrease.addEventListener("click", () => {
        label.textContent = parseInt(label.textContent) - 1;
        vc.value = vc.value - 1;
      });

      btnReset.addEventListener("click", () => {
        label.textContent = "0";
        vc.value = 0;
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
      screenY = screenY - 10 + node.size[1] * zoom - scaledHeight; // Align to bottom

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
      const divId = `node-${node.id+1}`;
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

    function createCounterApp() {
      let count = 0;
      // Create elements
      const container = document.createElement("div");
      container.id = `node-${node.id}`;
      container.style.position = "absolute";
      container.style.top = "80px";
      container.style.left = "80px";
      const counter = document.createElement("p");
      const incrementBtn = document.createElement("button");
      const decrementBtn = document.createElement("button");

      // Set text content
      counter.textContent = `Count: ${count}`;
      incrementBtn.textContent = "+";
      decrementBtn.textContent = "-";

      // Style elements
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.gap = "10px";
      counter.style.fontSize = "20px";
      incrementBtn.style.padding = decrementBtn.style.padding = "5px 10px";

      // Button actions
      incrementBtn.addEventListener("click", () => {
        count++;
        counter.textContent = `Count: ${count}`;
      });

      decrementBtn.addEventListener("click", () => {
        count--;
        counter.textContent = `Count: ${count}`;
      });

      // Append elements
      container.appendChild(decrementBtn);
      container.appendChild(counter);
      container.appendChild(incrementBtn);
      document.body.appendChild(container);
    }

    //START POINT
    node.size = [300, 300]; //init size
    const vc = new ValueClass(0);
    node.addCustomWidget(vc);
    //createDiv();
    // Create an input element
    // const inputElement = document.createElement("input");
    // inputElement.type = "text";
    // inputElement.placeholder = "Enter text";

    // // Add the input as a DOM widget
    // node.addDOMWidget("Text Input", "input", inputElement, {
    //   getValue: () => inputElement.value,
    //   setValue: (v) => (inputElement.value = v),
    // });

    // Create a container div
    const counterDiv = document.createElement("div");
    counterDiv.style.width = "100%";
    counterDiv.style.height = "100%";
    counterDiv.style.display = "flex";
    counterDiv.style.alignItems = "center";
    counterDiv.style.flexDirection = "column";
    counterDiv.style.justifyContent = "center";
    counterDiv.style.gap = "10px";
    counterDiv.style.padding = "5px";
    counterDiv.style.backgroundColor = "crimson";

    // Create a label
    const label = document.createElement("label");
    label.textContent = "addDOMWidget"

    // Create a wrapper
    const wrapper = document.createElement("div");
    wrapper.id = `node-${node.id+1}`;
    wrapper.style.width = "100%";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.appendChild(counterDiv);

    // Create a button to decrease the counter
    const minusButton = document.createElement("button");
    minusButton.textContent = "-";
    minusButton.onclick = () => updateCounter(-1);

    // Create a span to display the counter value
    const counterValue = document.createElement("span");
    counterValue.textContent = "0";

    // Create a button to increase the counter
    const plusButton = document.createElement("button");
    plusButton.textContent = "+";
    plusButton.onclick = () => updateCounter(1);

    // Append elements to the container
    counterDiv.appendChild(label);
    counterDiv.appendChild(minusButton);
    counterDiv.appendChild(counterValue);
    counterDiv.appendChild(plusButton);

    // Function to update the counter
    function updateCounter(delta) {
      counterValue.textContent = String(parseInt(counterValue.textContent) + delta);
    }

    // Add the counter as a DOM widget
    node.addDOMWidget("counter", "div", wrapper, {
      getValue: () => parseInt(counterValue.textContent),
      setValue: (v) => (counterValue.textContent = String(v)),
    });

    //createCounterApp()
    node.setDirtyCanvas(true, false);
    if (allow_debug) console.log("node", node);
    if (allow_debug) console.log("app", app);

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
      deleteDiv();
    };
  },
});
