import { app } from "../../../scripts/app.js";
import { allow_debug } from "../js_shared.js";
import { domCtx } from "./DomCtx.js";

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

  // Legacy default reads litegraph pointer. Nodes that opt into DOM mode set
  // `node._useDomCtx = true` and the widgets read from the DomCtx singleton
  // instead. All other hosts keep their original behavior untouched.
  isMouseDown() {
    if (this.node?._useDomCtx) return domCtx.pointerDown;
    return app.canvas.pointer.isDown;
  }

  isLowQuality() {
    if (this.node?._useDomCtx) return false;
    const canvas = app.canvas;
    const scale = canvas?.ds?.scale ?? 1;
    return scale <= 0.5;
  }

  delete() {
    this.node.widgets = this.node.widgets.filter((widget) => widget !== this);
    if (this.node?._useDomCtx) {
      domCtx.requestRedraw();
    } else {
      this.node.setDirtyCanvas(true, true);
    }
  }

  get markDelete() {
    return this._markDelete;
  }

  set markDelete(value) {
    this._markDelete = Boolean(value);
  }

  get mousePos() {
    if (this.node?._useDomCtx) {
      return { x: domCtx.mouseX, y: domCtx.mouseY };
    }
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
    this.otherWidgets = [];
    this._domListeners = [];
    this.init();
    // Only install the global litegraph-canvas hooks when running in legacy
    // mode. DOM-mode hosts call attachDomCanvas() instead.
    if (!node._useDomCtx) {
      this.initEventListeners();
    }
  }

  init() {
    Object.values(this.node.widgets || {}).forEach((widget) => {
      if (widget instanceof BaseSmartWidget) {
      }
    });
  }

  addOtherWidget(widget) {
    this.otherWidgets.push(widget);
  }

  // --- Legacy path: hook litegraph canvas events ------------------------
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

  // --- DOM mode: hook a DOM canvas's events -----------------------------
  // logicalWidth/Height is the coordinate space Smart* widgets draw in
  // (e.g. 512x592 for paint_node). The backing bitmap can be any size —
  // the host scales the context to map logical → physical pixels, and
  // mouse events are mapped back to logical space here.
  attachDomCanvas(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this._logicalWidth = logicalWidth || canvas.width;
    this._logicalHeight = logicalHeight || canvas.height;

    const updateMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      domCtx.mouseX = ((e.clientX - rect.left) / rect.width) * this._logicalWidth;
      domCtx.mouseY = ((e.clientY - rect.top) / rect.height) * this._logicalHeight;
    };

    const onDown = (e) => {
      updateMouse(e);
      domCtx.pointerDown = true;
      this.handleMouseDown(e);
      domCtx.requestRedraw();
    };
    const onMove = (e) => {
      updateMouse(e);
      this.handleMouseMove(e);
      this.handleMouseDrag(e);
      domCtx.requestRedraw();
    };
    const onUp = (e) => {
      updateMouse(e);
      domCtx.pointerDown = false;
      domCtx.requestRedraw();
    };
    const onClick = (e) => {
      updateMouse(e);
      this.handleMouseClick(e);
      domCtx.requestRedraw();
    };
    const onLeave = () => {
      domCtx.pointerDown = false;
      domCtx.requestRedraw();
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onLeave);

    this._domListeners.push(
      ["mousedown", onDown],
      ["mousemove", onMove],
      ["mouseup", onUp],
      ["click", onClick],
      ["mouseleave", onLeave]
    );
  }

  // In DOM mode widgets live in node._smartWidgets (populated by the host's
  // addCustomWidget shim). In legacy mode they live in node.widgets.
  getSmartWidgets() {
    if (this.node._useDomCtx) return this.node._smartWidgets || [];
    return this.node.widgets || [];
  }

  handleMouseDown(e) {
    [...this.getSmartWidgets(), ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && (this.node._useDomCtx || this.node.type === this.nodeName)) {
        widget.handleDown?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDown", this.mousePos);
  }

  handleMouseMove(e) {
    [...this.getSmartWidgets(), ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && (this.node._useDomCtx || this.node.type === this.nodeName)) {
        widget.handleMove?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseMoved");
  }

  handleMouseClick(e) {
    [...this.getSmartWidgets(), ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && (this.node._useDomCtx || this.node.type === this.nodeName)) {
        widget.handleClick?.(e);
      }
    });
    this.filterDeletedWIdgets();
    if (this.allowDebug) console.log("MouseClicked");
  }

  handleMouseDrag(e) {
    [...this.getSmartWidgets(), ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && (this.node._useDomCtx || this.node.type === this.nodeName)) {
        widget.handleDrag?.(e);
      }
    });
    if (this.allowDebug) console.log("MouseDrag");
  }

  filterDeletedWIdgets() {
    if (this.node._useDomCtx) {
      if (this.node._smartWidgets) {
        this.node._smartWidgets = this.node._smartWidgets.filter((w) => !w.markDelete);
      }
      domCtx.requestRedraw();
      return;
    }
    this.node.widgets = this.node.widgets.filter((widget) => !widget.markDelete);
    this.node.setDirtyCanvas(true, true);
  }

  drawAll(ctx) {
    [...this.getSmartWidgets(), ...this.otherWidgets].forEach((widget) => {
      if (widget instanceof BaseSmartWidget && widget.draw) {
        widget.draw(ctx);
      }
    });
  }

  destroy() {
    if (this.canvas) {
      for (const [type, fn] of this._domListeners) {
        this.canvas.removeEventListener(type, fn);
      }
    }
    this._domListeners = [];
    if (this.node._useDomCtx) {
      this.node._smartWidgets = [];
    } else {
      this.node.widgets = [];
    }
  }
}
