export function lightenColor(color, percent) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  color = ctx.fillStyle;

  if (!color.startsWith("#")) {
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch) {
      color = `#${rgbMatch
        .map((x) => parseInt(x).toString(16).padStart(2, "0"))
        .join("")}`;
    }
  }

  color = color.replace(/^#/, "");
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);

  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function isLowQuality() {
  var _a;
  const canvas = app.canvas;
  return (
    (((_a = canvas.ds) === null || _a === void 0 ? void 0 : _a.scale) || 1) <=
    0.5
  );
}

export function hexToImageData(hex) {
  const byteArray = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(canvas.width, canvas.height);

  // Assuming the image is in RGBA format (4 bytes per pixel)
  imageData.data.set(byteArray);
  return imageData;
}

// Function to convert hex data to a Blob
export function hexToBlob(hex) {
  const byteArray = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
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

export const Shapes = Object.freeze({
  SQUARE: "square",
  CIRCLE: "circle",
  ROUND: "round",
  TRIANGLE: "triangle",
  STAR: "star",
  ELLIPSE: "ellipse",
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
  ["1x", 1],
  ["2x", 2],
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
  "#808080", // Gray
];
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
import { api } from "../../../scripts/api.js";
import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import {
  Button,
  Label,
  Slider,
  DropdownMenu,
  Widget,
  Checkbox,
  ColorPicker
} from "./widgets.js";
import { Shapes, Colors,} from "./utils.js";

*/

// //console.log('pointer',app.pointer);
// console.log('app',app);
// console.log('node',node);
// if (w.isClicked(pos[0],pos[1]))
//   w.isChecked = !w.isChecked
// w.handleClick(pos[0],pos[1])
// //c.handleOnClick(pos)
// l.textColor = c.selectedColor;

// const drawing_app = new DrawingApp(node);
// node.addCustomWidget(drawing_app);
// const w = new Checkbox(75,5);
// node.addCustomWidget(w);

// const l = new Label(5,5,"Selected Color:");
// node.addCustomWidget(l);

// const c = new ColorPicker(5,20,100,100,);
// node.addCustomWidget(c);
