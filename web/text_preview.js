import { app } from "../../../scripts/app.js";
import { ComfyWidgets } from "../../../scripts/widgets.js";
import { allow_debug } from "./js_shared.js";

app.registerExtension({
	name: "iTools.previewText",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "iToolsPreviewText") {
			function populate(text) {
				if (this.widgets?.length > 1) {
					this.widgets.slice(1).forEach(w => w.onRemove?.());
					this.widgets.splice(1);
				}
			
				const values = Array.isArray(text) ? text.filter(Boolean) : [text];
			
				for (const value of values) {
					const widget = ComfyWidgets["STRING"](this, "text2", ["STRING", { multiline: true }], app).widget;
					widget.inputEl.readOnly = true;
					widget.inputEl.style.opacity = "0.8";
					widget.value = value;
				}
			
				requestAnimationFrame(() => {
					let [width, height] = this.computeSize();
			
					// Estimate text height based on the number of lines (assuming 20px per line)
					const lineHeight = 20;
					const totalLines = values.reduce((sum, text) => sum + (text.split("\n").length || 1), 0);
					const textHeight = totalLines * lineHeight;
			
					// Add some extra padding
					const extraPadding = 40;
					const newHeight = height + textHeight + extraPadding;
			
					this.size[1] = Math.max(newHeight, this.size[1]);
					this.onResize?.([Math.max(width, this.size[0]), this.size[1]]);
					app.graph.setDirtyCanvas(true, false);
				});
			}
			
			const originalOnExecuted = nodeType.prototype.onExecuted;
			const originalOnConfigure = nodeType.prototype.onConfigure;
			
			nodeType.prototype.onExecuted = function (message) {
				originalOnExecuted?.apply(this, arguments);
				populate.call(this, message.text);
				if(allow_debug) console.log('iToolsPreviewText executed',);
			};
			
			nodeType.prototype.onConfigure = function () {
				originalOnConfigure?.apply(this, arguments);
				if (this.widgets_values?.length) {
					populate.call(this, this.widgets_values.filter(Boolean));
				}
			};
			
			
		}
	},
});
