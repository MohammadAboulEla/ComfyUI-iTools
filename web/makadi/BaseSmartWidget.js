import { app } from "../../../scripts/app.js";

export class BaseSmartWidget {
  constructor(node) {
    this.node = node;
    this._markDelete = false;
    this._mousePos = { x: 0, y: 0 };
  }

  init() {}

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  isLowQuality() {
    const canvas = app.canvas;
    const scale = canvas?.ds?.scale ?? 1;
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

export class BaseSmartWidgetManager extends BaseSmartWidget {
  constructor(node) {
    super(node);
    this.allowDebug = false;
    this.init();
    this.initEventListeners();
  }

  init() {}

  initEventListeners() {
    app.canvas.onMouseDown = (e) => this.handleMouseDown(e); //works even out of node
    app.canvas.canvas.onclick = (e) => this.handleMouseClick(e); // works after mouse down
    app.canvas.onDrawForeground = (ctx) => this.handleMouseMove(ctx); //works every where even when dragging
    app.canvas.canvas.onmousemove = (e) => this.handleMouseDrag(e); //works every where but not when dragging
  }

  handleMouseDown(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleDown?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDown", this.mousePos);
  }

  handleMouseMove(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleMove?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseMoved");
  }

  handleMouseClick(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleClick?.(e);
      }
    });
    this.filterDeletedWIdgets();
    if (this.allowDebug) console.log("MouseClicked");
  }

  handleMouseDrag(e) {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
        widget.handleDrag?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDrag");
  }

  filterDeletedWIdgets() {
    // Filter out widgets marked for deletion
    this.node.widgets = this.node.widgets.filter((widget) => !widget.markDelete);
    this.node.setDirtyCanvas(true, true);
  }
}