import { app } from "../../../scripts/app.js";

import { allow_debug } from "../js_shared.js";

export class BaseIWidget {
  constructor() {
    this._markDelete = false;
    this._mousePos = {x: 0, y: 0};
    this.init();
  }

  init() {
    
  }

  isMouseDown() {
    return app.canvas.pointer.isDown;
  }

  isLowQuality() {
    const canvas = app.canvas;
    const scale = canvas?.ds?.scale ?? 1; // Get scale, default to 1 if undefined
    return scale <= 0.5;
  }

  delete(node) {
    node.widgets = node.widgets.filter((widget) => widget !== this);
    node.setDirtyCanvas(true, true);
  }

  // callback(value, canvas, node, pos, e){
  //   if(allow_debug) console.log('e',e);
  // }

  // onPointerDown(pointer, node, canvas){
  //   if(allow_debug) console.log('pointer',pointer);
  // }

  get markDelete() {
    return this._markDelete;
  }

  set markDelete(value) {
    this._markDelete = Boolean(value);
  }

  get mousePos() {
    return this._mousePos;
  }
  
  set mousePos(value) {
    this._mousePos = value;
  }

}

export class BaseIWidgetManager extends BaseIWidget {
  constructor(node) {
    super();
    this.node = node;
    this.init();
    this.initEventListeners();
  }

  init() {
  }

  initEventListeners() {
    app.canvas.onMouseDown = (e) => this.handleMouseDown(e); //works even out of node
    app.canvas.canvas.onclick = (e) => this.handleMouseClick(e); // works after mouse down
    app.canvas.onDrawForeground = (ctx) => this.handleMouseMove(ctx); //works every where even when dragging
    app.canvas.canvas.onmousemove = (e) => this.handleMouseDrag(e); //works every where but not when dragging
  }

  handleMouseDown(e) {
    const pos = this.calcMousePos()
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseIWidget) {
        widget.mousePos = pos;
        widget.handleDown?.(e, pos);
        widget.iObjects? widget.iObjects.forEach((obj) => {
          obj.handleDown?.(e, pos);
        }) : null
      }
    });
  }

  handleMouseMove(ctx) {
    const pos = this.calcMousePos()
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseIWidget) {
        widget.mousePos = pos;
        widget.handleMove?.(ctx,pos);
        widget.iObjects? widget.iObjects.forEach((obj) => {
          obj.handleMove?.(ctx, pos);
        }) : null
      }
    });
  }

  handleMouseClick(e) {
    const pos = this.calcMousePos()
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseIWidget) {
        widget.mousePos = pos;
        widget.handleClick?.(e,pos);
        widget.iObjects? widget.iObjects.forEach((obj) => {
          obj.handleClick?.(e, pos);
        }) : null
      }
    });
    this.filterDeletedWIdgets();
  }

  handleMouseDrag(e) {
    const pos = this.calcMousePos()
    Object.values(this.node.widgets).forEach((widget) => {
      if (widget instanceof BaseIWidget) {
        widget.mousePos = pos;
        widget.handleDrag?.(e,pos);
      }
    });
  }

  filterDeletedWIdgets() {
    // Filter out widgets marked for deletion
    this.node.widgets = this.node.widgets.filter((widget) => !widget.markDelete);
    this.node.setDirtyCanvas(true, true);
  }

  calcMousePos() {
    const graphMouse = app.canvas.graph_mouse;
    return {
      x: graphMouse[0] - this.node.pos[0],
      y: graphMouse[1] - this.node.pos[1],
    };
  }

}


export class TestIWidget extends BaseIWidget {
  constructor(color){
    super();
    this.color = color;
    this.type= "custom";
    this.name= "myTestWidget";
    this.value= "7";
    this.options= {};
    this.margin = 10
  }

  mouse(event, pointerOffset, node){
    if(allow_debug) console.log('pointerOffset',pointerOffset);
  }

  draw(ctx, node, widget_width, y, H){
    ctx.fillStyle = this.color;
    ctx.fillRect(0+this.margin/2, this.last_y+this.margin/2, node.width-this.margin, node.height-30-this.last_y-this.margin);
  }

  handleDown(e, pos) {
    if(allow_debug) console.log('this',this);
    //console.log("Pointer position:", pos);
    return false;
  }
  
  handleMove(ctx,pos) {
    //if(allow_debug) console.log('mouse move',pos);
    return false;
  }
  
  handleClick(e) {
    //if(allow_debug) console.log('mouse up',e);
    return false;
  }

}

import { IContainer } from "./IContainer.js";
export async function iWidgetExample(node){
  async function nodeCreated(node) {
    if (node.comfyClass !== "iToolsPaintNode") {
      return;
    }

    while (node.graph === null) {
      if (allow_debug) console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // NODE SETTINGS
    node.setSize([512, 592]);
    node.resizable = true;
    node.setDirtyCanvas(true, true);
    node.shape = "box"
    node.title = "You're using ComfyUI incorrectly"

    if (allow_debug) console.log("node", node);

    // START POINT
    const ic = new IContainer(node)
    node.addCustomWidget(ic)

    const mm = new BaseIWidgetManager(node);
  }
  return nodeCreated(node)
}