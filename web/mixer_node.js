import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { BaseSmartWidget, SmartLayer, BaseSmartWidgetManager, SmartButton, SmartInfo } from "./makadi.js";
import { getCopyImageOption, Shapes } from "./utils.js";

const BaseImageObject = {
  
  draw(ctx, node, widget_width, y) {
    this._ctx = ctx;
    const { imgX, imgY, w, h } = this.rect(node, widget_width, y);
    ctx.drawImage(this._baseImg, 0, 0, this._baseImg.naturalWidth, this._baseImg.naturalHeight, imgX, imgY, w, h);
  },

  rect(node, widget_width, y) {
    const dw = widget_width;
    const dh = node.size[1] - y;

    this._baseImg = node.imgs[0];
    this._scale = Math.min(dw / this._baseImg.naturalWidth, dh / this._baseImg.naturalHeight, 1);
    this._w = this._baseImg.naturalWidth * this._scale;
    this._h = this._baseImg.naturalHeight * this._scale;
    this._imgX = (dw - this._w) / 2;
    this._imgY = (dh - this._h) / 2 + y;

    return {
      imgX: this._imgX,
      imgY: this._imgY,
      w: this._w,
      h: this._h,
    };
  },

  get img() {
    return this._baseImg;
  },
  get ctx() {
    return this._ctx;
  },
  get width() {
    return this._w;
  },
  get height() {
    return this._h;
  },
  get scale() {
    return this._scale;
  },
  get imgX() {
    return this._imgX;
  },
  get imgY() {
    return this._imgY;
  },

};

class LayerImage extends SmartLayer {
  constructor(img, node, x, y, w, h) {
    super(x, y, w, h, node, {});
    this.img = img;
    this.imgLoaded = true
  }

  onBaseImageChanged(baseImgX,baseImageY, baseImageScale) {
    // Get base image position and scale
    const baseX = BaseImageObject.imgX;
    const baseY = BaseImageObject.imgY;
    const baseScale = BaseImageObject.scale;
    
    // Adjust position relative to base image's new position
    const deltaX = baseX - this._lastBaseX || 0;
    const deltaY = baseY - this._lastBaseY || 0;
    
    this.myX += deltaX;
    this.myY += deltaY;
    
    // Adjust size according to base image's scale
    if (this._lastBaseScale) {
      const scaleRatio = baseScale / this._lastBaseScale;
      this.width *= scaleRatio;
      this.height *= scaleRatio;
    }
    
    // Store current values for next adjustment
    this._lastBaseX = baseX;
    this._lastBaseY = baseY;
    this._lastBaseScale = baseScale;
    
    this.yOffset = BaseImageObject.y

    this.node.setDirtyCanvas(true, true);
  }

  draw(mouse) {
    if (!this.img) return;

    const baseImg = BaseImageObject.img;
    const bw = BaseImageObject.width;
    const bh = BaseImageObject.height;
    const bx = BaseImageObject.imgX;
    const by = BaseImageObject.imgY;
    const ctx = BaseImageObject.ctx;
    super.draw(ctx)

    // // Setup canvases
    // this.tempCanvas.width = w;
    // this.tempCanvas.height = h;
    // this.layerCanvas.width = w;
    // this.layerCanvas.height = h;

    // const tempCtx = this.tempCanvas.getContext("2d");
    // const layerCtx = this.layerCanvas.getContext("2d");

    // // Draw overlay image maintaining its own aspect ratio
    // // const oScale = Math.min(w / this.img.naturalWidth, h / this.img.naturalHeight, 1);
    // // const oW = this.img.naturalWidth * oScale;
    // // const oH = this.img.naturalHeight * oScale;
    // // const oX = (w - oW) / 2;
    // // const oY = (h - oH) / 2;

    // layerCtx.drawImage(this.img, this.myX, this.myY, this.width, this.height);

    // // Apply masking for non-base images
    // layerCtx.globalCompositeOperation = "destination-in";
    // layerCtx.drawImage(this.baseImg, 0, 0, w, h);
    // layerCtx.globalCompositeOperation = "source-over";

    // // Draw to temp canvas
    // tempCtx.drawImage(this.layerCanvas, 0, 0);

    // // Draw final composition to main canvas
    // ctx.drawImage(this.tempCanvas, imgX, imgY);
  }
}

app.registerExtension({
  name: "iTools.imageMixerNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name === "iToolsImageMixer") {
    }
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsImageMixer") {
      return;
    }

    // init size
    node.size = [285, 330];
    let y = 0;
    let mouse = {
      mouseInNode: false,
      x: 0,
      y: 0,
    };
    let layers = []; // array of LayerImage

    // Clear existing layers and recreate them
    function createLayers() {
      const baseImg = node.imgs[0];
      const m = new BaseSmartWidgetManager(node, "iToolsImageMixer");
      // Create layers with proper baseImg reference
      node.imgs.forEach((img, index) => {
        const nl = new LayerImage(img, node, 100,100,100,100)
        m.addOtherWidget(nl)
        layers.push(nl);
      });
    }

    function clearLayers() {
      layers.forEach((layer) => {
        layer.markDelete = true;
      });
      layers = [];
    }

    node.onExecuted = async function (message) {
      // await for !node.imgs
      for (let i = 0; i < 30 && !node.imgs; i++) {
        if (allow_debug) console.log("node.imgs wait...", i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // await for ImagePreviewWidget
      const previewWidget = node.widgets.find((widget) => !(widget instanceof BaseSmartWidget));
      for (let i = 0; i < 30 && !previewWidget; i++) {
        if (allow_debug) console.log("previewWidget wait...", i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!previewWidget) {
        if (allow_debug) console.log("ImagePreviewWidget not found");
        return;
      }

      // create layers
      clearLayers()
      createLayers()
      // node.BaseImageObject = BaseImageObject

      // Skip first original frame
      node.setDirtyCanvas(true, false);

      // Override draw function in ImagePreviewWidget
      const originalDraw = previewWidget.draw;
      previewWidget.draw = function (ctx, node, widget_width, y, ...args) {
        
        // Update base image draw
        if (allow_debug) console.log("draw");
        BaseImageObject.draw(ctx, node, widget_width, y);

        // Draw all layers
        layers.forEach((layer) => {
          layer.draw(mouse);
        });

      };
    };

    node.onResize = function (newSize) {
      // limit width size while resizing
      node.size[0] = Math.max(285, newSize[0]);
      layers.forEach((layer) => {
        layer.onBaseImageChanged();
      });
      
    };

    // const originalClick = app.canvas.canvas.onclick;
    // app.canvas.canvas.onclick = (e) => {
    //   if (originalClick) {
    //     originalClick.call(app.canvas.canvas, e);
    //   }

    //   // Check if click is inside node
    //   if (!mouse.mouseInNode || !node.imgs) return;

    //   // Loop through imgs except image 0
    //   for (let i = 1; i < node.imgs.length; i++) {
    //     // Calculate dimensions for this image
    //     const overlayImg = node.imgs[i];
    //     const dw = node.size[0];
    //     const dh = node.size[1] - y;
    //     const scale = Math.min(dw / overlayImg.naturalWidth, dh / overlayImg.naturalHeight, 1);
    //     const w = overlayImg.naturalWidth * scale;
    //     const h = overlayImg.naturalHeight * scale;
    //     const imgX = (dw - w) / 2;
    //     const imgY = (dh - h) / 2 + y;

    //     // Check if click is inside this image area
    //     if (mouse.x >= imgX && mouse.x <= imgX + w && mouse.y >= imgY && mouse.y <= imgY + h) {
    //       // Image was clicked
    //       node.imageIndex = i;
    //       if (allow_debug) console.log("image", node.imgs[node.imageIndex]);
    //       node.setDirtyCanvas(true, false);
    //     }
    //   }
    // };

    node.onMouseEnter = (e) => {
      mouse.mouseInNode = true;
    };

    node.onMouseLeave = (e) => {
      mouse.mouseInNode = false;
    };

    node.onMouseMove = (e, pos) => {
      if (mouse.mouseInNode) {
        const graphMouse = app.canvas.graph_mouse;
        mouse.x = graphMouse[0] - node.pos[0];
        mouse.y = graphMouse[1] - node.pos[1];
      }
    };

    const originalMenuOptions = node.getExtraMenuOptions;
    node.getExtraMenuOptions = function (_, options) {
      if (originalMenuOptions) {
        originalMenuOptions.call(node, _, options);
      }
      if (node.imgs) {
        // If node node has images then we add an open in new tab item
        let img = null;

        if (img) {
          options.unshift(
            {
              content: "Open Image",
              callback: () => {
                const url = new URL(img.src);
                url.searchParams.delete("preview");
                window.open(url, "_blank");
              },
            },
            ...getCopyImageOption(img),
            {
              content: "Save Image",
              callback: () => {
                const a = document.createElement("a");
                const url = new URL(img.src);
                url.searchParams.delete("preview");
                a.href = url.toString();
                a.setAttribute("download", new URLSearchParams(url.search).get("filename"));
                document.body.append(a);
                a.click();
                requestAnimationFrame(() => a.remove());
              },
            }
          );
        }
      }
    };

    
  },
});

function overrideDraw(node, widget_width, y, ctx, mouse, layers) {
  if (!node.imgs || node.imgs.length === 0) return;

  const baseImg = node.imgs[0];
  const dw = widget_width;
  const dh = node.size[1] - y;

  // Calculate dimensions while maintaining aspect ratio
  const scale = Math.min(dw / baseImg.naturalWidth, dh / baseImg.naturalHeight, 1);
  const w = baseImg.naturalWidth * scale;
  const h = baseImg.naturalHeight * scale;

  const imgX = (dw - w) / 2;
  const imgY = (dh - h) / 2 + y;

  ctx.drawImage(baseImg, 0, 0, w, h);

  // Create temp canvas for composition
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext("2d");

  // Process each input to apply overlays
  for (let i = 0; i < node.inputs.length; i++) {
    const input = node.inputs[i];
    if (!input || !input.link) continue;

    const linkInfo = node.graph?.links[input.link];
    if (!linkInfo) continue;

    const sourceNode = node.graph.getNodeById(linkInfo.origin_id);
    if (!sourceNode?.imgs?.length) continue;

    const overlayImg = sourceNode.imgs[sourceNode.imageIndex || 0];

    // Create layer for masking the overlay
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = w;
    layerCanvas.height = h;
    const layerCtx = layerCanvas.getContext("2d");

    // Draw overlay image maintaining its own aspect ratio
    const oScale = Math.min(w / overlayImg.naturalWidth, h / overlayImg.naturalHeight, 1);
    const oW = overlayImg.naturalWidth * oScale;
    const oH = overlayImg.naturalHeight * oScale;
    const oX = (w - oW) / 2;
    const oY = (h - oH) / 2;

    layerCtx.drawImage(overlayImg, oX, oY, oW, oH);

    if (i > 0) {
      // Skip masking for the first input (base image)
      layerCtx.globalCompositeOperation = "destination-in";
      layerCtx.drawImage(baseImg, 0, 0, w, h);
      layerCtx.globalCompositeOperation = "source-over";
    }

    // Draw the layer onto the temp canvas
    tempCtx.drawImage(layerCanvas, 0, 0);
  }

  // Draw final composition to main canvas
  ctx.drawImage(tempCanvas, imgX, imgY);

  // Debug visuals
  ctx.strokeStyle = "#888";
  ctx.strokeRect(imgX, imgY, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText(`I love pixaroma`, imgX + 5, imgY + 15);
}
