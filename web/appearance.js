import { app } from "../../../scripts/app.js";
const allow_debug = true;

function print(txt){
if (allow_debug){
console.log(txt)
}
}

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
            }
        }
});
