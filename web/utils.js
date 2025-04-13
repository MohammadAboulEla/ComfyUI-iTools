export const Shapes = Object.freeze({
  SQUARE: "square",
  CIRCLE: "circle",
  ROUND: "round",
  ROUND_L: "round_left",
  ROUND_R: "round_right",
  TRIANGLE: "triangle",
  STAR: "star",
  ELLIPSE: "ellipse",
  HHL_CIRCLE: "half horizontal left circle",
  HVL_CIRCLE: "half vertical left circle",
  HHR_CIRCLE: "half horizontal right circle",
  HVR_CIRCLE: "half vertical right circle",
});

export const AppColors = Object.freeze({
  WIDGET_BGCOLOR: LiteGraph.WIDGET_BGCOLOR,
  WIDGET_OUTLINE_COLOR: LiteGraph.WIDGET_OUTLINE_COLOR,
  WIDGET_TEXT_COLOR: LiteGraph.WIDGET_TEXT_COLOR,
  WIDGET_SECONDARY_TEXT_COLOR: LiteGraph.WIDGET_SECONDARY_TEXT_COLOR,

  NODE_TITLE_COLOR: LiteGraph.NODE_TITLE_COLOR,
  NODE_SELECTED_TITLE_COLOR: LiteGraph.NODE_SELECTED_TITLE_COLOR,
  NODE_TEXT_COLOR: LiteGraph.NODE_TEXT_COLOR,
  NODE_DEFAULT_COLOR: LiteGraph.NODE_DEFAULT_COLOR,
  NODE_DEFAULT_BGCOLOR: LiteGraph.NODE_DEFAULT_BGCOLOR,
  NODE_DEFAULT_BOXCOLOR: LiteGraph.NODE_DEFAULT_BOXCOLOR,
  NODE_DEFAULT_SHAPE: LiteGraph.NODE_DEFAULT_SHAPE,
  NODE_BOX_OUTLINE_COLOR: LiteGraph.NODE_BOX_OUTLINE_COLOR,
  DEFAULT_SHADOW_COLOR: LiteGraph.DEFAULT_SHADOW_COLOR,

  LINK_COLOR: LiteGraph.LINK_COLOR,
  EVENT_LINK_COLOR: LiteGraph.EVENT_LINK_COLOR,
  CONNECTING_LINK_COLOR: LiteGraph.CONNECTING_LINK_COLOR,
});

export const Colors = [
  "#ffffff", // White
  "#000000", // Black
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow

  "#ff00ff", // Magenta
  "#00ffff", // Cyan
  "#ffa500", // Orange
  "#800080", // Purple
  "#008000", // Dark Green
  "#800000", // Maroon

  "#808000", // Olive
  "#008080", // Teal
  "#d3d3d3", // Light Gray
  "#000080", // Navy
  "#ffc0cb", // Pink
  "#a52a2a", // Brown

  "#add8e6", // Light Blue
  "#ff4500", // Orange Red
  "#90ee90", // Light Green
  "#4b0082", // Indigo
  "#ffb6c1", // Light Pink
  "#ffd700", // Gold

  "#f0e68c", // Khaki
  "#c0c0c0", // Silver
  "#696969", // Dim Gray
  "#1e90ff", // Dodger Blue
  "#32cd32", // Lime Green
  "#ff6347", // Tomato

  "#dc143c", // Crimson
  "#4682b4", // Steel Blue
  "#8b4513", // Saddle Brown
  "#ffdab9", // Peach Puff
  "#b22222", // Firebrick
  "#228b22", // Forest Green

  "#f5deb3", // Wheat
  "#2f4f4f", // Dark Slate Gray
  "#6a5acd", // Slate Blue
  "#e9967a", // Dark Salmon
  "#ff69b4", // Hot Pink
  "#bc8f8f", // Rosy Brown

  "#deb887", // Burlywood
  "#7fffd4", // Aquamarine
  "#ff8c00", // Dark Orange
];

export const canvasRatios = new Map([
  ["1:1", { width: 512, height: 512 }],

  ["2:3", { width: 341, height: 512 }], // Rounded to 341x512 (divisible by 64)
  ["3:4", { width: 384, height: 512 }], // Rounded to 384x512 (divisible by 64)
  ["9:16", { width: 288, height: 512 }], // Rounded to 288x512 (divisible by 64)
  ["9:21", { width: 192, height: 512 }], // Rounded to 192x512 (divisible by 64)

  ["3:2", { width: 512, height: 341 }], // Rounded to 512x341 (divisible by 64)
  ["4:3", { width: 512, height: 384 }], // Rounded to 512x384 (divisible by 64)
  ["16:9", { width: 512, height: 288 }], // Rounded to 512x288 (divisible by 64)
  ["21:9", { width: 512, height: 219 }], // Rounded to 512x219 (divisible by 64)
]);

export const canvasScales = new Map([
  ["0.5x", 1],
  ["1x", 2],
  ["2x", 4],
]);

export const commonColors = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#0000FF", // Blue
  "#008000", // Green
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#800080", // Purple
  "#A52A2A", // Brown
  "rgba(255, 255, 255, 0.0)", // Transparent
  //"#808080", // Gray
];


export function log(...args) {
  if (allow_debug) {
    console.log(...args); // Spread args to log them properly
  }
}

export function lightenColor(color, percent) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  color = ctx.fillStyle;

  if (!color.startsWith("#")) {
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch) {
      color = `#${rgbMatch.map((x) => parseInt(x).toString(16).padStart(2, "0")).join("")}`;
    }
  }

  color = color.replace(/^#/, "");
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);

  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function isLowQuality() {
  var _a;
  const canvas = app.canvas;
  return (((_a = canvas.ds) === null || _a === void 0 ? void 0 : _a.scale) || 1) <= 0.5;
}

export function hexToImageData(hex) {
  const byteArray = new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(canvas.width, canvas.height);

  // Assuming the image is in RGBA format (4 bytes per pixel)
  imageData.data.set(byteArray);
  return imageData;
}

export function trackMouseColor(event, canvas) {
  if (!canvas) return "rgb(255, 255, 255)"; // Default color if canvas is null
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return "rgb(255, 255, 255)"; // Handle missing context

  try {
    const pixel = ctx.getImageData(mouseX, mouseY, 1, 1).data;
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  } catch (error) {
    console.error("Error reading pixel data:", error);
    return "rgb(255, 255, 255)"; // Default color on error
  }
}

export function getCopyImageOption(img) {
  if (typeof window.ClipboardItem === "undefined") return [];
  return [
    {
      content: "Copy Image",
      callback: async () => {
        const url = new URL(img.src);
        url.searchParams.delete("preview");

        const writeImage = async (blob) => {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
        };

        try {
          const data = await fetch(url);
          const blob = await data.blob();
          try {
            await writeImage(blob);
          } catch (error) {
            // Chrome seems to only support PNG on write, convert and try again
            if (blob.type !== "image/png") {
              const canvas = $el("canvas", {
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
              const ctx = canvas.getContext("2d");
              let image;
              if (typeof window.createImageBitmap === "undefined") {
                image = new Image();
                const p = new Promise((resolve, reject) => {
                  image.onload = resolve;
                  image.onerror = reject;
                }).finally(() => {
                  URL.revokeObjectURL(image.src);
                });
                image.src = URL.createObjectURL(blob);
                await p;
              } else {
                image = await createImageBitmap(blob);
              }
              try {
                ctx.drawImage(image, 0, 0);
                canvas.toBlob(writeImage, "image/png");
              } finally {
                if (typeof image.close === "function") {
                  image.close();
                }
              }

              return;
            }
            throw error;
          }
        } catch (error) {
          toastStore.addAlert(
            t("toastMessages.errorCopyImage", {
              error: error.message ?? error,
            })
          );
        }
      },
    },
  ];
}

export function getIndex(array, item) {
  return array.indexOf(item);
}

// Function to convert hex data to a Blob
export function hexToBlob(hex) {
  const byteArray = new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  return new Blob([byteArray], { type: "image/png" }); // Use 'image/png' for PNG images
}

// Function to convert hex data to an Image
export function hexDataToImage(hexData) {
  const blob = hexToBlob(hexData);
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url; // Set the image source to the created URL

  return img; // Return the image object
}

export async function getColorUnderMouseScreen(event) {
  // Create a hidden canvas
  const canvas = globalThis.LGraphCanvas.active_canvas.canvas;
  console.log("globalThis", globalThis);
  const context = canvas.getContext("2d");

  // Get mouse position relative to the canvas
  const x = event.offsetX;
  const y = event.offsetY;

  // Get the color at the mouse position (RGB)
  const pixel = context.getImageData(x, y, 1, 1).data;

  // Convert to RGB string
  const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

  return color;
}

export function fakeMouseDown(canvas, node) {
  const graphMouse = app.canvas.graph_mouse;
  const x = graphMouse[0] - node.pos[0];
  const y = graphMouse[1] - node.pos[1];

  const mouseDownEvent = new MouseEvent("mousedown", {
    bubbles: true, // Allow the event to bubble up the DOM
    cancelable: true, // Allow the event to be canceled
    view: window, // Window that the event is dispatched to
    clientX: x, // X coordinate of the mouse
    clientY: y, // Y coordinate of the mouse
  });

  console.log("x,y", x, y);
  // Dispatch the event on the specified element
  canvas.dispatchEvent(mouseDownEvent);
}

export function enterFreezeMode() {
  this.node.allow_interaction = false;
  this.node.allow_dragcanvas = false;
  this.node.allow_dragnodes = false;
}

export function exitFreezeMode() {
  this.node.allow_interaction = true;
  this.node.allow_dragcanvas = true;
  this.node.allow_dragnodes = true;
}

export function drawCheckerboard(ctx, width, height, cellSize = 10, yOffset = 80) {
  // Create an off-screen canvas for the pattern
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = cellSize * 2;
  patternCanvas.height = cellSize * 2;
  const pCtx = patternCanvas.getContext("2d");

  // Define colors
  const lightGray = "#CCCCCC";
  const darkGray = "#999999";

  // Draw checkerboard squares
  pCtx.fillStyle = lightGray;
  pCtx.fillRect(0, yOffset, cellSize * 2, cellSize * 2);
  pCtx.fillStyle = darkGray;
  pCtx.fillRect(0, yOffset, cellSize, cellSize);
  pCtx.fillRect(cellSize, cellSize, cellSize, cellSize);

  // Create pattern
  const pattern = ctx.createPattern(patternCanvas, "repeat");

  // Apply pattern to the main canvas
  ctx.fillStyle = pattern;
  ctx.fillRect(0, yOffset, width, height);
}

export function drawAngledStripsOld(ctx, width, height, stripeWidth = 5, angle = 45) {
  // Save the current state of the canvas
  ctx.save();

  const canvasWidth = 512;
  const canvasHeight = 592 + 80;
  // Calculate offsets to center the rectangle within the canvas
  const xOffset = (canvasWidth - width) / 2;
  const yOffset = (canvasHeight - height) / 2;

  // Define the clipping area with offset
  ctx.beginPath();
  ctx.rect(xOffset, yOffset, width, height); // Define a rectangle for clipping with offset
  ctx.clip(); // Apply the clipping area

  // Define transparent red colors
  const red1 = "rgba(128, 128, 128, 0.3)"; // Faded red
  const red2 = "rgba(128, 128, 128, 0.5)"; // Darker red

  // Move canvas origin to the center of the rectangle
  ctx.translate(xOffset + width / 2, yOffset + height / 2);

  // Rotate the canvas
  const radianAngle = (angle * Math.PI) / 180;
  ctx.rotate(radianAngle);

  // Calculate the diagonal length to cover the full area
  const diagonal = Math.sqrt(width * width + height * height);

  // Draw diagonal stripes within the clipped area
  for (let x = -diagonal; x < diagonal; x += stripeWidth * 2) {
    ctx.fillStyle = red1;
    ctx.fillRect(x, -diagonal / 2, stripeWidth, diagonal);
    ctx.fillStyle = red2;
    ctx.fillRect(x + stripeWidth, -diagonal / 2, stripeWidth, diagonal);
  }

  // Restore the original state of the canvas
  ctx.restore();
}

export function drawAngledStrips(ctx, width, height, scaleFactor = 1.0, stripeWidth = 5, angle = 45) {
  // Save the current state of the canvas
  ctx.save();

  // Define the fixed canvas dimensions
  const canvasWidth = 512;
  const canvasHeight = 592 + 80;

  // Apply inverse scaling transformation
  ctx.scale(1 / scaleFactor, 1 / scaleFactor);

  // Calculate offsets to center the rectangle within the scaled canvas
  const xOffset = (canvasWidth - width * scaleFactor) / 2;
  const yOffset = (canvasHeight - height * scaleFactor) / 2;

  // Define the clipping area with offset
  ctx.beginPath();
  ctx.rect(xOffset, yOffset, width * scaleFactor, height * scaleFactor);
  ctx.clip();

  // Define transparent colors
  const red1 = "rgba(128, 128, 128, 0.3)";
  const red2 = "rgba(128, 128, 128, 0.5)";

  // Move canvas origin to the center of the scaled canvas
  ctx.translate(canvasWidth / 2, canvasHeight / 2);

  // Rotate the canvas
  const radianAngle = (angle * Math.PI) / 180;
  ctx.rotate(radianAngle);

  // Calculate the diagonal length to ensure full coverage
  const diagonal = Math.sqrt(width ** 2 + height ** 2) * scaleFactor;

  // Keep stripe width constant (independent of scaleFactor)
  const scaledStripeWidth = stripeWidth;

  // Draw diagonal stripes across the clipped area
  for (let x = -diagonal; x < diagonal; x += scaledStripeWidth * 2) {
    ctx.fillStyle = red1;
    ctx.fillRect(x, -diagonal / 2, scaledStripeWidth, diagonal);
    ctx.fillStyle = red2;
    ctx.fillRect(x + scaledStripeWidth, -diagonal / 2, scaledStripeWidth, diagonal);
  }

  // Restore the original canvas state
  ctx.restore();
}

// Helper function to check if the color is transparent
export function isTransparent(color) {
  // Convert hex to RGBA (if needed)
  function hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
    return [r, g, b, a];
  }

  const rgba = hexToRgba(color); // Assumes the color is in hex format, convert if necessary
  return rgba[3] === 0.0; // Check if the alpha is 0
}

export function getRatioByDimensions(width, height) {
  for (let [ratio, dimensions] of canvasRatios.entries()) {
    if (dimensions.width === width && dimensions.height === height) {
      return ratio;
    }
  }
  return null; // Return null if no matching ratio is found
}

export function getIndexByDimensions(width, height) {
  const entriesArray = [...canvasRatios.entries()]; // Convert Map to array
  for (let i = 0; i < entriesArray.length; i++) {
    const [ratio, dimensions] = entriesArray[i];
    if (dimensions.width === width && dimensions.height === height) {
      return i; // Return the index if found
    }
  }
  return -1; // Return -1 if no matching dimensions are found
}

// const processMouseDown = LGraphCanvas.prototype.processMouseDown;
// LGraphCanvas.prototype.processMouseDown = function(e) {
//   if (this.allowDebug) console.log('MouseDown',e);
//   return processMouseDown.apply(this, arguments);
// };

// const processMouseMove = LGraphCanvas.prototype.processMouseMove;
// LGraphCanvas.prototype.processMouseMove= function(e) {
//   if (this.allowDebug) console.log('MouseMove',e);
//   return processMouseDown.apply(this, arguments);
// };

/*
LiteGraph.NODE_TITLE_COLOR,
LiteGraph.NODE_SELECTED_TITLE_COLOR,
LiteGraph.NODE_TEXT_COLOR,
LiteGraph.NODE_DEFAULT_COLOR,
LiteGraph.NODE_TEXT_SIZE,
LiteGraph.NODE_DEFAULT_BGCOLOR,
LiteGraph.NODE_DEFAULT_BOXCOLOR,
LiteGraph.NODE_BOX_OUTLINE_COLOR,
LiteGraph.DEFAULT_SHADOW_COLOR,

LiteGraph.WIDGET_BGCOLOR,
LiteGraph.WIDGET_OUTLINE_COLOR,
LiteGraph.WIDGET_TEXT_COLOR,
LiteGraph.WIDGET_SECONDARY_TEXT_COLOR,

LiteGraph.LINK_COLOR,
LiteGraph.EVENT_LINK_COLOR,
LiteGraph.CONNECTING_LINK_COLOR
*/

//const window = globalThis;

/*
Working Callbacks

app.canvas.onMouse = (e) => { // any mouse button
  if (this.allowDebug) console.log("onMouse",e);
};

app.canvas.onNodeMoved = ()=>{
  if (this.allowDebug) console.log('noe moved',);
}

app.canvas.canvas.onmousewheel = (e)=>{
  if (this.allowDebug) console.log('onmousewheel',);
}

app.canvas.canvas.onclick = (e) => {
  if (this.allowDebug) console.log("onclick");
};

app.canvas.canvas.onkeyup = (ke) => {  //onkeydown//onkeypress
  if (this.allowDebug) console.log("onkeyup",ke);
};

app.canvas.canvas.onkeydown = (ke) => {
  if (this.allowDebug) console.log("onkeyup",ke);
};

app.canvas.canvas.ondblclick = (e) => {
  if (this.allowDebug) console.log("ondblclick",e);
};

app.canvas.canvas.onmouseover = (e) => {
  if (this.allowDebug) console.log("onmouseover");
};

========================
NOT working callback

app.canvas.onMouseMoved = () => {
  if (this.allowDebug) console.log("Mouse moved");
};

app.canvas.onMouseUP = (e) => {
  if (this.allowDebug) console.log("Mouse UP");
};

app.canvas.canvas.onmouseup = (e) => {
  if (this.allowDebug) console.log("onmouseup",e);
};
*/
