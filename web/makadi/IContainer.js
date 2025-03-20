import { BaseIWidget } from "./BaseIWidget.js";
import { allow_debug } from "../js_shared.js";

export class IContainer extends BaseIWidget {
  constructor(node,color='crimson'){
    super();
    this.node = node;
    this.color = color;
    this.margin = 5
    this.type= "custom";
    this.name= "IContainer";
    this.value= "7";
    this.options= {};
    this.init()
  }

  init(){
    this.iObjects = [];
    const o = new IObject(this);
    o.x = 10;
    o.y = 10;
    this.iObjects.push(o);
  }

  draw(ctx, node, widget_width, y, H){
    if(!this.ctx) this.ctx = ctx
    if(!this.xx) this.xx = 0 + this.margin/2;
    if(!this.yy) this.yy = this.last_y + this.margin/2;
    this.width = node.width-this.margin
    this.height = node.height-30-this.last_y-this.margin
    
    ctx.fillStyle = this.color;
    ctx.fillRect(this.xx, this.yy, this.width , this.height);

    // Draw all IObjects
    for (const obj of this.iObjects) {
      // Translate the context to container's position
      ctx.save();
      ctx.translate(this.xx, this.yy);
      obj.draw(ctx);
      ctx.restore();
      node.setDirtyCanvas(true,true)
    }
  }

  handleDown(e, pos) {
    if (this.isMouseIn){
    }
    return false;
  }
  
  handleMove(ctx,pos) {
    if (this.isMouseIn){
    //if(allow_debug) console.log('mouse move',pos);
    }
    return false;
  }
  
  handleClick(e) {
    return false;
  }

  get isMouseIn() {
    const {x, y} = this.mousePos ?? {x:0,y:0}
    return (
      x >= this.xx &&
      x <= this.xx + this.width &&
      y >= this.yy &&
      y <= this.yy + this.height
    );
  }

}

export class IObject {
    
    constructor(parent){
        this.parent = parent;
        this.x = 0;
        this.y = 0;
        this.width = 50;
        this.height = 50;
        this.color = "orange";
        this.dirX = 1;
        this.dirY = 1;
      }
    
    draw(ctx){
        if (!ctx) return
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        const text = `${Math.round(this.x)}, ${Math.round(this.y)}`;
        ctx.fillText(text, this.x + this.width / 2, this.y + this.height / 2);

        //this.animateInParent()
    }  

    handleDown(e, pos) {
      if(this.isMouseIn){
        this.color = this.randomColor();
      }
    }

    handleMove(ctx,pos) {
      if(this.isMouseIn){}
    }

    handleClick(e) {
      if(this.isMouseIn){}
    }

    animateInParent(){
        // Separate x and y directions
        if (!this.dirX) this.dirX = 1;
        if (!this.dirY) this.dirY = 1;
        
        // Update position
        this.x += this.dirX * 1;  // Increased speed
        this.y += this.dirY * 1;
        
        // Bounce off right and bottom walls
        if (this.x + this.width > this.parent.width) {
            this.dirX = -1;
            this.x = this.parent.width - this.width;  // Prevent sticking to wall
        }
        if (this.y + this.height > this.parent.height) {
            this.dirY = -1;
            this.y = this.parent.height - this.height;
        }
        
        // Bounce off left and top walls
        if (this.x < 0) {
            this.dirX = 1;
            this.x = 0;
        }
        if (this.y < 0) {
            this.dirY = 1;
            this.y = 0;
        }
    }

    get isMouseIn() {
      const {x, y} = this.parent.mousePos ?? {x:0,y:0}
      return (
        x >= this.x + this.parent.xx &&
        x <= this.x + this.parent.xx + this.width &&
        y >= this.y + this.parent.yy &&
        y <= this.y + this.parent.yy + this.height
      );
    }

    randomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }
      
}
