import { app } from "../../../scripts/app.js";

export class BaseSmartWidget {
  constructor(node) {
    this.node = node;
    this._markDelete = false;
    this._mousePos = {x: 0, y: 0};
    this.init();
  }

  init() {
  }

  getIndex(array, item) {
    return array.indexOf(item);
  }

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  isLowQuality() {
    const canvas = app.canvas;
    const scale = canvas?.ds?.scale ?? 1; // Get scale, default to 1 if undefined
    return scale <= 0.5;
  }

  delete() {
    this.node.widgets = this.node.widgets.filter((widget) => widget !== this);
    this.node.setDirtyCanvas(true, true);
  }

  get markDelete() {
    return this._markDelete;
  }

  set markDelete(value) {
    this._markDelete = Boolean(value);
  }

  get mousePos() {
    const graphMouse = app.canvas.graph_mouse;
    return {
      x: graphMouse[0] - this.node.pos[0],
      y: graphMouse[1] - this.node.pos[1],
    };
  }
}