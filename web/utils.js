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

export const Shapes = Object.freeze({
  SQUARE: "square",
  CIRCLE: "circle",
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
  
  


// LiteGraph.NODE_TITLE_COLOR,
// LiteGraph.NODE_SELECTED_TITLE_COLOR,
// LiteGraph.NODE_TEXT_COLOR,
// LiteGraph.NODE_DEFAULT_COLOR,
// LiteGraph.NODE_TEXT_SIZE,
// LiteGraph.NODE_DEFAULT_BGCOLOR,
// LiteGraph.NODE_DEFAULT_BOXCOLOR,
// LiteGraph.NODE_BOX_OUTLINE_COLOR,
// LiteGraph.DEFAULT_SHADOW_COLOR,

// LiteGraph.WIDGET_BGCOLOR,
// LiteGraph.WIDGET_OUTLINE_COLOR,
// LiteGraph.WIDGET_TEXT_COLOR,
// LiteGraph.WIDGET_SECONDARY_TEXT_COLOR,

// LiteGraph.LINK_COLOR,
// LiteGraph.EVENT_LINK_COLOR,
// LiteGraph.CONNECTING_LINK_COLOR
