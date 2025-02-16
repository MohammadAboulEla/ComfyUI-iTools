import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

import {
  Shapes,
  Colors,
  lightenColor,
  canvasRatios,
  canvasScales,
  commonColors,
  trackMouseColor,
  fakeMouseDown,
  getIndexByDimensions,
} from "./utils.js";
import {
  BaseSmartWidgetManager,
  SmartButton,
  SmartWidget,
  SmartSlider,
  SmartLabel,
  SmartSwitch,
  SmartCheckBox,
  SmartPaintArea,
  SmartPreview,
  SmartColorPicker,
  SmartDropdownMenu,
  TextObject,
  AdvancedLabel,
  SmartInfo,
  SmartImage,
  CanvasButtonManager,
  SmartLoading,
} from "./makadi.js";

app.registerExtension({
  name: "iTools.paintNode",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== "iToolsPaintNode") {
      return;
    }
    const window = globalThis;

    // if (allow_debug) {
    //   console.log("window", window);
    //   console.log("nodeType", nodeType);
    //   console.log("nodeData", nodeData);
    //   console.log("app", app);
    // }
  },

  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsPaintNode") {
      return;
    }

    while (node.graph === null) {
      console.log("loading ...");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // NODE SETTINGS
    node.setSize([512, 592]);
    node.resizable = false;
    node.setDirtyCanvas(true, true);
    //node.selected = true;

    // if (allow_debug) {
    //   console.log("node", node);
    //   console.log("app", app);
    //   console.log("app.canvas", app.canvas);
    // }

    // START POINT
    let canvasImgs = [];
    let bc = [];
    let selectedImg = null;
    let loadedImageFile = null;
    let keyPick = false;
    let isHoldingShift = false;
    let loadedWidth = 0;
    let loadedHeight = 0;
    let loadedScale = 0;
    let loader = null;

    const pa = new SmartPaintArea(0, 80, 512, 512, node);
    const p = new SmartPreview(0, 80, 512, 512, node);
    // const bTest = new SmartButton(200, 200, 80, 20, node, "Test")
    // setTimeout(() => {
    //   bTest.delete()
    // }, 3000);
    const cp = new SmartColorPicker(0, 80, 170, 170, node);
    let info = null;
    function reCreateInfo() {
      info = new SmartInfo(512 / 2 - 40, 85, 80, 15, node, "canvas size");
    }
    reCreateInfo();
    const ui = new SmartWidget(0, 30, node.width, 50, node, {
      color: lightenColor(LiteGraph.WIDGET_BGCOLOR, 5),
      shape: Shapes.SQUARE,
      allowVisualPress: false,
      allowVisualHover: false,
      outline: false,
    });

    const bLoad = new SmartButton(5, 5, 80, 20, node, "Load Image", {
      textXoffset: 0,
      shape: Shapes.ROUND,
    });
    bLoad.onClick = () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".png";

      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          loadedImageFile = file;

          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target.result;

            // Create a temporary image element to get its dimensions
            const tempImg = new Image();
            tempImg.src = imageUrl;

            // Wait for the image to load
            tempImg.onload = () => {
              const naturalWidth = tempImg.naturalWidth;
              const naturalHeight = tempImg.naturalHeight;

              // Calculate the aspect ratio
              const aspectRatio = naturalWidth / naturalHeight;

              // Set a base height (or width) and calculate the other dimension based on the ratio
              const baseHeight = 256; // You can adjust this value as needed
              const calculatedWidth = baseHeight * aspectRatio;

              // Calculate the center position for the image
              const centerX = (node.width - calculatedWidth) / 2;
              const centerY = (80 + node.height - baseHeight) / 2;

              // Create a new SmartImage instance with dynamic dimensions
              const img = new SmartImage(centerX, centerY, calculatedWidth, baseHeight, node, {});

              // Update the image source dynamically
              img.updateImage(imageUrl);

              // Add the SmartImage instance to the canvasImgs array
              canvasImgs.push(img);
              // if (allow_debug) {
              //   console.log("canvasImgs", canvasImgs);
              // }

              // Define the onImgLoaded callback
              img.onImgLoaded = () => {
                // Remove old selected
                canvasImgs.forEach((i) => {
                  i.isSelected = false;
                });
                // select last loaded image
                canvasImgs[canvasImgs.length - 1].isSelected = true;

                if (allow_debug) console.log("Image loaded successfully!");
                // open canvas buttons
                openCanvas();
              };
            };

            // Handle errors if the image fails to load
            tempImg.onerror = () => {
              if (allow_debug) console.error("Failed to load the image.");
            };
          };

          // Read the file as a data URL
          reader.readAsDataURL(file);
        }
      });

      fileInput.click();
    };

    // const bPaste = new SmartButton(90, 5, 80, 20, node, "Paste Image", {
    //   textXoffset: 0,
    //   shape: Shapes.ROUND,
    // });
    // bPaste.onClick = () => {

    // }

    const bColor = new SmartButton(5, 35, 40, 40, node);
    bColor.shape = Shapes.HVL_CIRCLE;
    bColor.color = "crimson";
    (bColor.allowVisualHover = false),
      (bColor.allowVisualPress = false),
      (bColor.onPress = () => {
        cp.open();
      });

    const bColor2 = new SmartButton(5, 35, 40, 40, node);
    bColor2.shape = Shapes.HVR_CIRCLE;
    bColor2.color = "orange";
    (bColor2.allowVisualHover = false),
      (bColor2.allowVisualPress = false),
      (bColor2.onPress = () => {
        cp.openHidden();
      });

    const brushSlider = new SmartSlider(55, 35, 150, 20, node, {
      minValue: 1,
      maxValue: 100,
      value: 20,
      textColorNormalize: true,
      isProgressBar: true,
      text: "Brush Size: ",
      onValueChange: (value) => {
        p.brushSize = value;
        pa.brushSize = value;
      },
    });

    const ratiosArray = Array.from(canvasRatios.entries());
    const sizesArray = Array.from(canvasScales.entries());
    const ratioNames = Array.from(canvasRatios.keys());
    const sizeNames = Array.from(canvasScales.keys());

    let dmR = null; //new SmartDropdownMenu(5, 85, 40, 15, node, "Ratio", ratioNames);
    let dmS = null; //new SmartDropdownMenu(5 + 45, 85, 40, 15, node, "Size", sizeNames);
    let dmInfo = null;
    // TO DO
    function createDropMenus() {
      dmR = new SmartDropdownMenu(5, 85, 40, 15, node, "Ratio", ratioNames);
      dmS = new SmartDropdownMenu(5 + 45, 85, 40, 15, node, "Size", sizeNames);
      const infoXpos = 512 / 2 - 40 || 5 + 45 + 45;
      dmInfo = new SmartButton(infoXpos, 85, 80, 15, node, `${pa.width} x ${pa.height}`);

      // start invisible any way
      dmInfo.isVisible = false;
      dmR.isVisible = false;
      dmS.isVisible = false;

      dmR.onSelect = () => {
        if (dmR.isVisible) resizeCanvas(dmR, dmS, ratiosArray, sizesArray, pa, dmInfo);
      };
      dmS.onSelect = () => {
        if (dmS.isVisible) resizeCanvas(dmR, dmS, ratiosArray, sizesArray, pa, dmInfo);
      };
    }
    createDropMenus();

    const bCanvas = new SmartButton(55, 60, 50, 15, node, "Canvas", {
      textXoffset: 0,
      resetColor: false,
    });
    bCanvas.onClick = () => {
      bCanvas.toggleActive();
      if (dmR.isVisible) {
        dmR.isVisible = false;
        dmS.isVisible = false;
        dmInfo.isVisible = false;
      } else {
        createDropMenus(); // recreate menus to draw last
        updateDMindexes(); // re-update indexes
        dmInfo.isVisible = true;
        dmR.isVisible = true;
        dmS.isVisible = true;
      }
    };

    const bUndo = new SmartButton(190 - 20, 60, 15, 15, node, "↺", {
      textXoffset: 0,
    });
    bUndo.onClick = () => {
      pa.undo();
    };

    const bRedo = new SmartButton(190, 60, 15, 15, node, "↻", {
      textXoffset: 0,
    });
    bRedo.onClick = () => {
      pa.redo();
    };

    const bFill = new SmartButton(215, 35, 40, 15, node, "Fill", {
      withTagWidth: 10,
      textXoffset: 5,
    });
    bFill.onClick = () => {
      pa.fillWithColor(bColor.color);
    };

    const bHold = new SmartButton(215 + 45, 35, 40, 15, node, "Hold", {
      textXoffset: 0,
    });
    bHold.onClick = () => {
      pa.saveTempImage();
    };

    const bFetch = new SmartButton(215 + 45 + 45, 35, 40, 15, node, "Fetch", {
      textXoffset: 0,
    });
    bFetch.onClick = () => {
      pa.loadTempImage();
    };

    const bClear = new SmartButton(215 + 45 + 45 + 45, 35, 40, 15, node, "Clear", {
      textXoffset: 0,
    });
    bClear.onClick = () => {
      pa.clearWithColor("white");
      let text = pa.isPaintingBackground ? "Background" : "Foreground";
      showWarning(`${text} cleared`, 120, pa.isPaintingBackground ? "#cd7f32" : "#5f9ea0");
    };

    // Create layer switch
    const layerSwitch = new SmartSwitch(215, 55, 175, 20, node);
    layerSwitch.textOn = "Foreground";
    layerSwitch.textOff = "Background";
    layerSwitch.onValueChange = () => {
      pa.switchLayer();
      if (lCanvasInfo) {
        lCanvasInfo.text = getActiveCtxText().text;
        lCanvasInfo.color = getActiveCtxText().color;
      }
    };

    // Create colors buttons
    const bh = [];
    let bhIndex = 0;
    for (let i = 1; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        const color = commonColors[bhIndex % commonColors.length]; // Capture color in scope
        const t = color === "rgba(255, 255, 255, 0.0)" ? "E" : "";
        const widget = new SmartButton(512 - 22 * i - 3, 35 + 22 * j, 18, 18, node, "", {
          color: color,
          text: t,
          shape: Shapes.CIRCLE,
          onClick: () => {
            bColor.color = color;
            bFill.tagColor = color;
            pa.brushColor = color;
            if (this.allowDebug) console.log(`Widget ${bhIndex} clicked`);
          },
        });

        bh.push(widget);
        bhIndex++; // Increment unique index
      }
    }

    // create canvas buttons
    let bCloseCanvas = null;
    let bMaskCanvas = null;
    let bStampCanvas = null;
    let bFitCanvas = null;
    let bFillCanvas = null;
    let lCanvasInfo = null;

    // COMMON FUNCTIONS
    function showWarning(msg, newWidth = 120, newColor = "#cd7f32") {
      info.color = newColor;
      info.textColor = "black";

      info.restart(msg, newWidth, 85 + 20, 20);

      setTimeout(() => {
        info.color = info.originalColor;
        info.textColor = info.originalTextColor;
      }, info.previewDuration);
    }

    function getActiveCtxText() {
      let text = pa.isPaintingBackground ? "Background" : "Foreground";
      let color = pa.isPaintingBackground ? "#cd7f32" : "#5f9ea0"; //"#deb887";
      return { text: text, color: color };
    }

    function closeCanvas() {
      bCloseCanvas.isVisible = false;
      // enable brush preview
      p.isVisible = true;
      pa.isCheckerboardOn = false;
      // mark delete all canvas images
      canvasImgs.forEach((img) => {
        img.loader.markDelete = true;
        img.markDelete = true;
      });
      //clear canvas images list
      canvasImgs = [];
      // mark delete all buttons
      bc.forEach((b) => (b.markDelete = true));
    }

    function openCanvas() {
      createCanvasButtons();
      // disable brush preview
      p.isVisible = false;
      pa.isCheckerboardOn = true;
      // open all buttons
      bc.forEach((b) => (b.isVisible = true));
    }

    function fitCanvasImg(dim) {
      const img = canvasImgs.filter((img) => img.isSelected)[0];
      img?.fitImage([pa.width, pa.height], dim, 1 / pa.scaleFactor);
      if (!img || img.markDelete) showWarning("No Image Selected!");
    }

    function fillCanvasImg() {
      const img = canvasImgs.filter((img) => img.isSelected)[0];
      img?.fillImage([pa.width, pa.height], 1 / pa.scaleFactor);
      if (!img || img.markDelete) showWarning("No Image Selected!");
    }

    function selectCanvasImg() {
      if (bc.some((button) => button.isMouseIn?.())) return;
      let found = false; // Flag to stop after selecting the topmost image
      for (let i = canvasImgs.length - 1; i >= 0; i--) {
        let img = canvasImgs[i];
        if (!found && img.isMouseIn(10)) {
          img.isSelected = true;
          found = true; // Stop selecting after the first match (topmost image)
        } else {
          img.isSelected = false;
        }
      }
    }

    function pickColor(e,caller) {
      if (bCloseCanvas?.isVisible) return; // prevent picking in canvas mode

      if(caller === "click"){
        let trackedColor = trackMouseColor(e, app.canvas.canvas);
        cp.allowPickVis = true;
        if (isHoldingShift) {
          bFill.tagColor = trackedColor;
          pa.brushColor = trackedColor;
          cp.selectedColor = trackedColor;
  
          if (cp.isGhost) {
            bColor2.color = trackedColor;
          } else {
            bColor.color = trackedColor;
          }
        } else {
          cp.allowPickVis = false;
        }
      }else if(caller === "drag"){
        let trackedColor = trackMouseColor(e, app.canvas.canvas);
        cp.allowPickVis = true;
        if (cp.isVisible && !isHoldingShift) {
          bFill.tagColor = trackedColor;
          pa.brushColor = trackedColor;
          cp.selectedColor = trackedColor;
  
          if (cp.isGhost) {
            bColor2.color = trackedColor;
          } else {
            bColor.color = trackedColor;
          }
        } else {
          cp.allowPickVis = false;
        }
      }
      

    }

    function resizeCanvas(dmR, dmS, ratiosArray, sizesArray, pa, info) {
      if (dmR.selectedItemIndex === -1) dmR.selectedItemIndex = 0;
      if (dmS.selectedItemIndex === -1) dmS.selectedItemIndex = 0;
      const itemA = ratiosArray[dmR.selectedItemIndex][1];
      const itemB = sizesArray[dmS.selectedItemIndex][1];
      pa.setNewSize(itemA, itemB);
      //info.restart(`${itemA.width * itemB} x ${itemA.height * itemB}`);
      info.text = `${itemA.width * itemB} x ${itemA.height * itemB}`;
      // if (allow_debug) console.log(itemA, itemB);
    }

    function saveImgToDesk(delay = 500) {
      setTimeout(() => {
        if (!pa.isPainting) pa.sendDrawingToAPI();
      }, delay);
    }

    function createCanvasButtons() {
      const bcw = 50;
      const bch = 20;
      const bcx = 512 / 2 - bcw / 2;
      const bcy = 592 - 40;

      lCanvasInfo = new SmartButton(512 / 2 - 40, bcy + 15, 80, bch, node, getActiveCtxText().text || "", {
        textAlign: "center",
        textColor: "black",
        color: getActiveCtxText().color || "brown",
        textYoffset: 2.2,
        font: "13px Arial Bold",
        allowVisualPress: true,
        allowVisualHover: false,
        resetColor: false,
      });
      lCanvasInfo.onClick = () => {
        layerSwitch.callClick();
        // pa.switchLayer()
        //layerSwitch.onValueChange()
        // lCanvasInfo.text = getActiveCtxText().text;
        // lCanvasInfo.color = getActiveCtxText().color;
      };
      bc.push(lCanvasInfo);

      bCloseCanvas = new SmartButton(bcx - bcw * 2, bcy, bcw, bch, node, "Exit", {
        textXoffset: 0,
        shape: Shapes.ROUND_L,
      });
      bc.push(bCloseCanvas);
      bCloseCanvas.onClick = () => {
        closeCanvas();
      };
      bMaskCanvas = new SmartButton(bcx - bcw * 1, bcy, bcw, bch, node, "Mask", {
        textXoffset: 0,
        shape: Shapes.SQUARE,
      });
      bMaskCanvas.onClick = () => {
        let img = canvasImgs.find((img) => img.isSelected);

        if (img.isMasked) {
          showWarning("Image Already Masked!", 140);
          return;
        }
        // Get the value of a setting
        const allow_masking = app.extensionManager.setting.get("iTools.Nodes.Mask Tool", false);
        if (!allow_masking) {
          showWarning("Check iTools Settings", 140);
          return;
        }
        if (img && !img.markDelete) {
          img.requestMaskedImage(loadedImageFile);
        } else {
          showWarning("No Image Selected");
        }
      };
      bc.push(bMaskCanvas);
      bStampCanvas = new SmartButton(bcx, bcy, bcw, bch, node, "Stamp", {
        textXoffset: 0,
        shape: Shapes.SQUARE,
      });
      bStampCanvas.onClick = () => {
        const ctx = pa.isPaintingBackground ? pa.backgroundCtx : pa.foregroundCtx;
        let img = canvasImgs.find((img) => img.isSelected);
        if (img && !img.markDelete) {
          img.plotImageOnCanvas(ctx, pa.x, pa.y, dmS.selectedItemIndex);
        } else {
          showWarning("No Image Selected!");
        }
      };
      bc.push(bStampCanvas);
      bFitCanvas = new SmartButton(bcx + bcw * 1, bcy, bcw, bch, node, "Fit", {
        textXoffset: 0,
        shape: Shapes.SQUARE,
      });
      bFitCanvas.onClick = () => {
        fitCanvasImg("w");
      };
      bc.push(bFitCanvas);
      bFillCanvas = new SmartButton(bcx + bcw * 2, bcy, bcw, bch, node, "Fill", {
        textXoffset: 0,
        shape: Shapes.ROUND_R,
      });
      bFillCanvas.onClick = () => {
        fillCanvasImg();
      };
      bc.push(bFillCanvas);
      bc.forEach((b) => (b.isVisible = false));
    }

    function switchCanvasLayers(caller) {
      try {
      } catch (error) {}
    }

    // COMMON ACTIONS
    pa.onReInit = () => {
      updateDMindexes();
    };

    pa.onPress = () => {
      pa.blockPainting = false;
      
      if (allow_debug) {
        console.log("isHoldingShift", isHoldingShift);
      }
      
      // Block painting if holding shift
      if (isHoldingShift) {
        pa.blockPainting = true;
      }

      // Block painting when drop menus open
      if (dmR?.isMouseInMenu() || dmR?.isMouseIn() || dmS?.isMouseInMenu() || dmS?.isMouseIn()) {
        pa.blockPainting = true;
      }

      // Block painting on canvas buttons
      bc.forEach((b) => {
        if (b.isMouseIn?.()) {
          pa.blockPainting = true;
        }
      });

      // EITHER -- Block painting on images when mouse in
      // canvasImgs.forEach((img) => {
      //   if (img.isMouseIn(10) || img.isResizing || img.isRotating) {
      //     pa.blockPainting = true;
      //   }
      // });

      // OR -- Block painting on images permanently
      if (canvasImgs.length > 0) {
        pa.blockPainting = true;
        selectCanvasImg();
      }
    };

    pa.onUpdate = () => {};

    // COMMON NODE EVENTS
    node.onMouseDown = (e, pos, node) => {
      pickColor(e,"click");
      selectedImg = canvasImgs.find((img) => img.isSelected);
      if (selectedImg) {
        selectedImg.isUnderCover = false;
      }

      // if (allow_debug) {
      //   console.log("node", node);
      // }
    };

    node.onMouseUp = (e, pos, node) => {
      
      saveImgToDesk(200);
    };

    node.onMouseMove = (e, pos) => {
      pickColor(e,"drag");
      //prevent resize cursor while hovering over canvas buttons
      if (canvasImgs.length > 0 && bc.some((b) => b.isMouseIn())) {
        if (selectedImg) {
          selectedImg.isUnderCover = true;
        }
      }
    };

    node.onMouseEnter = (e, pos, node) => {};

    node.onMouseLeave = (e) => {
      saveImgToDesk(500);
    };

    // COMMON CLICKS EVENTS
    app.canvas.canvas.onkeydown = (event) => {
      if (event.key === "Alt") {
        info.restart("Alt", 40);
        event.preventDefault();
        // plot selected image on back ground
        canvasImgs.forEach((img) => {
          if (img.isSelected) {
            const ctx = pa.isPaintingBackground ? pa.backgroundCtx : pa.foregroundCtx;
            img.plotImageOnCanvas(ctx, pa.x, pa.y, dmS.selectedItemIndex);
          }
        });

        // change color picker position
        if (cp.isVisible) {
          cp.x === 0 ? (cp.x = 512 - cp.width) : (cp.x = 0);
        }
      }

      if (event.key === "Shift") {
        if(!isHoldingShift) info.restart("Shift", 40);
        isHoldingShift = true;
        // if (allow_debug) {
        //   console.log("isHoldingShift", isHoldingShift);
        // }
        // rotate with shift
        canvasImgs.forEach((img) => {
          if (img.isMouseIn(10)) {
            if (!img.isRotating) {
              img.handleRotateStart();
            } else {
              img.handleRotateEnd();
            }
          }
        });
      }
    };

    globalThis.onkeyup = (event) => {
      // if (allow_debug) {
      //   console.log("canvasImgs.length", canvasImgs.length);
      // }

      // if (allow_debug) {
      //   console.log("keyUp");
      // }
      info.done = true;
      isHoldingShift = false;
      // if (event.key === "Shift") {
      //   isHoldingShift = false;
      // }
    };

    app.canvas.canvas.onpaste = (...args) => {};

    globalThis.oncopy = (...args) => {};

    function updateDMindexes() {
      // Update dmR and dmS values after init
      const w = pa.width;
      const h = pa.height;

      const longSide = Math.max(w, h);
      let scale = 1;
      let scaleIndex = 0;

      if (longSide <= 512) {
        scale = 1;
        scaleIndex = 0;
      } else if (longSide <= 1024) {
        scale = 2;
        scaleIndex = 1;
      } else if (longSide <= 2048) {
        scale = 4;
        scaleIndex = 2;
      }

      dmS.selectedItemIndex = scaleIndex;
      dmR.selectedItemIndex = getIndexByDimensions(w / scale, h / scale);
    }

    const manager = new BaseSmartWidgetManager(node);
  },
});
