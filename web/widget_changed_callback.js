import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js"
const _id = "iToolsPromptStyler"

async function send_style_message(style) {
    const body = new FormData();
    body.append('message',style);
    const r = await api.fetchApi("/itools/style_change", { method: "POST", body, });
    return r.json();
}

app.registerExtension({
    name: 'makadi.' + _id,
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== _id) {
            return;
        }
//        alert("iTools Prompt Styler registered");
//        console.log("node type", nodeType);
//        console.log("node data", nodeData);
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const me = onNodeCreated?.apply(this);
            const style = this.widgets.find(w => w.name == 'style_file');

            style.callback = async () => {
                //console.log(style.value);
                console.log("this", this);
                // Await the response from send_style_message
                const options = await send_style_message(style.value);
                if (options) {
                    this.widgets[3]["options"]["values"] = options.a;
                    this.widgets[3]["value"] = options.a[0];
                } else {
                    console.error("No options received or options are in the wrong format.");
                }
            }
            return me;
        };
    },
});



//function test(style.value){
//return ["a","b","c", "d"];
//}


//const fs = require('fs');
//const yaml = require('js-yaml');
//function loadYamlData(filePath) {
//    try {
//        const yamlFile = fs.readFileSync(filePath, 'utf8');
//        const yamlData = yaml.load(yamlFile);
//
//        if (Array.isArray(yamlData)) {
//            return yamlData;
//        } else {
//            throw new Error("YAML content is not a list of objects.");
//        }
//    } catch (error) {
//        if (error.code === 'ENOENT') {
//            console.error(`Error: The file '${filePath}' was not found.`);
//        } else if (error.name === 'YAMLException') {
//            console.error(`Error: Invalid YAML format. ${error.message}`);
//        } else {
//            console.error(`An error occurred: ${error.message}`);
//        }
//    }
//    return null;
//}
//
//function readStyles(value) {
//    const filePath = "E:\\StableDiffusion\\ComfyUI\\ComfyUI_normal_11\\ComfyUI\\custom_nodes\\ComfyUi-iTools\\styles\\" + value;
//    console.log(filePath);
//    const yamlData = loadYamlData(filePath);
//    console.log(yamlData);
//    if (!Array.isArray(yamlData)) {
//        console.error("Error: input data must be a list");
//        return null;
//    }
//
//    const names = [];
//
//    yamlData.forEach(item => {
//        if (typeof item === 'object' && item !== null) {
//            if ('name' in item) {
//                names.push(item.name);
//            }
//        }
//    });
//
//    return names;
//}
//


