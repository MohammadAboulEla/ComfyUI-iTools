import { app } from "../../../scripts/app.js";

const _id = "iToolsLineLoader";

app.registerExtension({
  name: "makadi." + _id,
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== _id) {
      return;
    }
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const me = onNodeCreated?.apply(this);
      const cag = this.widgets?.find((w) => w.name === "control_after_generate");
      if (cag) cag.value = "increment";
      return me;
    };
  },
});
