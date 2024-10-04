import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js"

const _id = "iToolsPromptStylerExtra"
const allow_debug = false;

async function send_request_templates_for_file(file_name) {
    const body = new FormData();
    body.append('file_name',file_name);
    const r = await api.fetchApi("/itools/request_templates_for_file", { method: "POST", body, });
    return r.json();
}

app.registerExtension({
    name: 'makadi.' + _id,
    async beforeRegisterNodeDef(nodeType, nodeData,app) {
        if (nodeData.name !== _id) {return;}
        //alert("iTools Prompt Styler Extra registered");

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {

            const me = onNodeCreated?.apply(this);
            if (allow_debug) {console.log("iToolsPromptStylerExtra", this);}

            const base_file = this.widgets.find(w => w.name == 'base_file');
            base_file.callback = async ()=> {
            this.widgets[3]["value"] = "loading ...";
            const options = await send_request_templates_for_file(base_file.value)
            this.widgets[3]["options"]["values"] = options.templates;
            this.widgets[3]["value"] = options.templates[0];
            this.setDirtyCanvas(true, true);
            }

            const second_file = this.widgets.find(w => w.name == 'second_file');
            second_file.callback = async ()=> {
            this.widgets[5]["value"] = "loading ...";
            const options = await send_request_templates_for_file(second_file.value)
            this.widgets[5]["options"]["values"] = options.templates;
            this.widgets[5]["value"] = options.templates[0];
            this.setDirtyCanvas(true, true);
            }

            const third_file = this.widgets.find(w => w.name == 'third_file');
            third_file.callback = async ()=> {
            this.widgets[7]["value"] = "loading ...";
            const options = await send_request_templates_for_file(third_file.value)
            this.widgets[7]["options"]["values"] = options.templates;
            this.widgets[7]["value"] = options.templates[0];
            this.setDirtyCanvas(true, true);
            }

            const fourth_file = this.widgets.find(w => w.name == 'fourth_file');
            fourth_file.callback = async ()=> {
            this.widgets[9]["value"] = "loading ...";
            const options = await send_request_templates_for_file(fourth_file.value)
            this.widgets[9]["options"]["values"] = options.templates;
            this.widgets[9]["value"] = options.templates[0];
            this.setDirtyCanvas(true, true);
            }

            fix_start_up_init(this, base_file,second_file,third_file,fourth_file);
            this.addWidget("button", "reset all", null, ()=> {
            reset_func(this,fourth_file)
            });
            return me;
        };
},

});


async function reset_func(node,fourth_file){
if (allow_debug) {console.log(node, this);}
    await waitForInitialization(node, fourth_file);

    node.widgets[2]["value"] = "basic.yaml";
    node.widgets[3]["value"] = "none";

    node.widgets[4]["value"] = "camera.yaml";
    node.widgets[5]["value"] = "none";

    node.widgets[6]["value"] = "artist.yaml";
    node.widgets[7]["value"] = "none";

    node.widgets[8]["value"] = "mood.yaml";
    node.widgets[9]["value"] = "none";

    const options = await send_request_templates_for_file("basic.yaml")
    const options2 = await send_request_templates_for_file("camera.yaml")
    const options3 = await send_request_templates_for_file("artist.yaml")
    const options4 = await send_request_templates_for_file("mood.yaml")

    node.widgets[3]["options"]["values"] = options.templates;
    node.widgets[5]["options"]["values"] = options2.templates;
    node.widgets[7]["options"]["values"] = options3.templates;
    node.widgets[9]["options"]["values"] = options4.templates;

    this.setDirtyCanvas(true, true);

}



async function fix_start_up_init(node, base,s1,s2,s3) {
    // Wait until node and style are fully initialized
    await waitForInitialization(node, s3);

    const options = await send_request_templates_for_file(base.value);
    if (options) {
        node.widgets[3]["options"]["values"] = options.templates;
    }
    const options2 = await send_request_templates_for_file(s1.value);
    if (options2) {
        node.widgets[5]["options"]["values"] = options2.templates;
    }
    const options3 = await send_request_templates_for_file(s2.value);
    if (options3) {
        node.widgets[7]["options"]["values"] = options3.templates;
    }
    const options4 = await send_request_templates_for_file(s3.value);
    if (options4) {
        node.widgets[9]["options"]["values"] = options4.templates;
    }
}


async function waitForInitialization(node, style) {
    // Poll until both node and style are initialized
    while (!node || !node.widgets || node.widgets.length < 4 || !style || !style.value) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
    }
}


// not used yet functions
function injectBackgroundColor(me,nodeData,app) {
    if (allow_debug) {
    console.log("iToolsPromptStylerExtra", me)
    console.log("iToolsPromptStylerExtra nodeData", nodeData)
    console.log("iToolsPromptStylerExtra app", app)
    ;}
    // Select all elements with the class 'comfy-multiline-input'
    const elements = document.querySelectorAll('.comfy-multiline-input');
    elements.forEach(element => {
        if (element.getAttribute('placeholder') === 'text_positive') {
            // Inject the background color style
            element.style.backgroundColor = 'rgba(0, 255, 0, 0.07)';
        }
        if (element.getAttribute('placeholder') === 'text_negative') {
            // Inject the background color style
            element.style.backgroundColor = 'rgba(255, 0, 0, 0.07)';
        }
    });
}

// not used
function executeAfterDelay(func, delay) {
    if (allow_debug) {console.log(my_node, my_file)}
    setTimeout(() => {
        func();
    }, delay);
}

// not used
async function send_style_message_multi(base,s1,s2,s3) {
    const request_body = new FormData();

    body.append('base',base);
    body.append('s1',s1);
    body.append('s2',s2);
    body.append('s3',s3);

    const respond = await api.fetchApi("/itools/style_change_multi", { method: "POST", request_body, });
    return respond.json();
}
