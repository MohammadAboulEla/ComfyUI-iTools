import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js"
const _id = "iToolsPromptStyler"

async function send_style_message(style) {
    const body = new FormData();
    body.append('message',style);
    const r = await api.fetchApi("/itools/style_change", { method: "POST", body, });
    return r.json();
}

const allow_debug = false;

app.registerExtension({
    name: 'makadi.' + _id,
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== _id) {
            return;
        }
        //alert("iTools Prompt Styler registered");
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const me = onNodeCreated?.apply(this);
            const style = this.widgets.find(w => w.name == 'style_file');
            if (allow_debug) {console.log("this", this);}
            style.callback = async () => {
                // Await the response from send_style_message
                this.widgets[3]["value"] = "loading ...";
                const options = await send_style_message(style.value);
                if (options) {
                    this.widgets[3]["options"]["values"] = options.new_templates;
                    this.widgets[3]["value"] = options.new_templates[0];
                    this.setDirtyCanvas(true, true);
                }
            }
            fix_start_up_init(this, style);
            return me;
        };
},

});

async function fix_start_up_init(node, style) {
    // Wait until node and style are fully initialized
    await waitForInitialization(node, style);

    // Proceed with sending the style message and updating node widgets
    const options = await send_style_message(style.value);
    if (options) {
        node.widgets[3]["options"]["values"] = options.new_templates;
    }
}


async function waitForInitialization(node, style) {
    // Poll until both node and style are initialized
    while (!node || !node.widgets || node.widgets.length < 4 || !style || !style.value) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
    }
}


function executeAfterDelay(func, delay) {
    if (allow_debug) {console.log(my_node, my_file)}
    setTimeout(() => {
        func();
    }, delay);
}