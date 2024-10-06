import { app } from "../../../scripts/app.js"
const _id = "iToolsCheckerBoard"

const allow_debug = true;

app.registerExtension({
    name: 'makadi.' + _id,
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== _id) {
            return;
        }
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const me = onNodeCreated?.apply(this);
            const cag = this.widgets.find(w => w.name == 'control_after_generate');
            if (allow_debug) {console.log("cag", cag);}
            cag.value = "fixed";
            return me;
        };
},
});
