import { app } from "../../../scripts/app.js";
import { allow_debug } from "../js_shared.js";

export class BaseSmartWidget {
  constructor(node) {
    this.node = node;
    this._autoAddSelfToNode = true;
    this._markDelete = false;
    this._mousePos = [0, 0];
    this.init();
  }

  init() {}

  computeSize(number) {
    return [0, 0]; // Important override comfy widget computedSize
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

  get autoAddSelfToNode() {
    return this._autoAddSelfToNode;
  }
}

export class BaseSmartWidgetManager extends BaseSmartWidget {
  constructor(node, nodeName) {
    super(node);
    this.nodeName = nodeName;
    this.allowDebug = false;
    this.otherWidgets = []
    this.init();
    this.initEventListeners();
  }

  init() {
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
      }
    });
  }

  addOtherWidget(widget) {
    this.otherWidgets.push(widget);
  }

  initEventListeners() {
    //works even out of node
    const originalMouseDown = app.canvas.onMouseDown;
    app.canvas.onMouseDown = (e) => {
      if (originalMouseDown) {
        originalMouseDown.call(app.canvas, e);
      }
      this.handleMouseDown(e);
    };

    // works after mouse down
    const originalClick = app.canvas.canvas.onclick;
    app.canvas.canvas.onclick = (e) => {
      if (originalClick) {
        originalClick.call(app.canvas.canvas, e);
      }
      this.handleMouseClick(e);
    };

    //works every where even when dragging
    const originalHandler = app.canvas.onDrawForeground;
    app.canvas.onDrawForeground = (ctx) => {
      if (originalHandler) {
        originalHandler.call(app.canvas, ctx);
      }
      this.handleMouseMove(ctx);
    };

    //works every where but not when dragging
    const originalMouseMove = app.canvas.canvas.onmousemove;
    app.canvas.canvas.onmousemove = (e) => {
      if (originalMouseMove) {
        originalMouseMove.call(app.canvas.canvas, e);
      }
      this.handleMouseDrag(e);
    };
  }

  handleMouseDown(e) {
    [...this.node.widgets, ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && this.node.type === this.nodeName) {
        widget.handleDown?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDown", this.mousePos);
  }

  handleMouseMove(e) {
    [...this.node.widgets, ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && this.node.type === this.nodeName) {
        widget.handleMove?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseMoved");
  }

  handleMouseClick(e) {
    [...this.node.widgets, ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && this.node.type === this.nodeName) {
        widget.handleClick?.(e);
      }
    });
    this.filterDeletedWIdgets();
    if (this.allowDebug) console.log("MouseClicked");
  }

  handleMouseDrag(e) {
    [...this.node.widgets, ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && this.node.type === this.nodeName) {
        widget.handleDrag?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDrag");
  }

  filterDeletedWIdgets() {
    // console.log('node.widgets',this.node.widgets)
    // console.log('node.widgets',this.node.widgets.length)

    // Filter out widgets marked for deletion
    this.node.widgets = this.node.widgets.filter((widget) => !widget.markDelete);
    this.node.setDirtyCanvas(true, true);

    // console.log('node.widgets',this.node.widgets.length)
    // console.log('node.widgets',this.node.widgets)
  }
}
