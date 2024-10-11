import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

app.registerExtension({
    name: "makadi.appearance",
        nodeCreated(node) {
            switch (node.comfyClass) {
                case "iToolsPromptStyler":
                    if(allow_debug){console.log("iToolsPromptStyler",node)}
                    node.color = LGraphCanvas.node_colors.green.color;
                    node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
                    break;
                case "iToolsPromptStylerExtra":
                    node.color = LGraphCanvas.node_colors.green.color;
                    node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
                    break;
                case "iToolsTextReplacer":
                    node.setSize([200, 58]);
                    node.color = LGraphCanvas.node_colors.green.color;
                    node.bgcolor = LGraphCanvas.node_colors.green.bgcolor;
                    break;
                case "iToolsAddOverlay":
                    node.setSize([240, 130]);
                    break;
                case "iToolsLineLoader":
                    node.setSize([200, 180]);
                    break;
            }
        }
});
