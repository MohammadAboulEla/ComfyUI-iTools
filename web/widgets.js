import { app } from "../../scripts/app.js";

// CODE HERE WRITTEN BY Rgthree

function binarySearch(max, getValue, match) {
    let min = 0;
    while (min <= max) {
        let guess = Math.floor((min + max) / 2);
        const compareVal = getValue(guess);
        if (compareVal === match)
            return guess;
        if (compareVal < match)
            min = guess + 1;
        else
            max = guess - 1;
    }
    return max;
}
export function fitString(ctx, str, maxWidth) {
    let width = ctx.measureText(str).width;
    const ellipsis = "…";
    const ellipsisWidth = measureText(ctx, ellipsis);
    if (width <= maxWidth || width <= ellipsisWidth) {
        return str;
    }
    const index = binarySearch(str.length, (guess) => measureText(ctx, str.substring(0, guess)), maxWidth - ellipsisWidth);
    return str.substring(0, index) + ellipsis;
}
export function measureText(ctx, str) {
    return ctx.measureText(str).width;
}
export function isLowQuality() {
    var _a;
    const canvas = app.canvas;
    return (((_a = canvas.ds) === null || _a === void 0 ? void 0 : _a.scale) || 1) <= 0.5;
}
export function drawNodeWidget(ctx, options) {
    const lowQuality = isLowQuality();
    const data = {
        width: options.width,
        height: options.height,
        posY: options.posY,
        lowQuality,
        margin: 15,
        colorOutline: LiteGraph.WIDGET_OUTLINE_COLOR,
        colorBackground: LiteGraph.WIDGET_BGCOLOR,
        colorText: LiteGraph.WIDGET_TEXT_COLOR,
        colorTextSecondary: LiteGraph.WIDGET_SECONDARY_TEXT_COLOR,
    };
    ctx.strokeStyle = options.colorStroke || data.colorOutline;
    ctx.fillStyle = options.colorBackground || data.colorBackground;
    ctx.beginPath();
    ctx.roundRect(data.margin, data.posY, data.width - data.margin * 2, data.height, lowQuality ? [0] : options.borderRadius ? [options.borderRadius] : [options.height * 0.5]);
    ctx.fill();
    if (!lowQuality) {
        ctx.stroke();
    }
    return data;
}
export function drawRoundedRectangle(ctx, options) {
    const lowQuality = isLowQuality();
    options = { ...options };
    ctx.strokeStyle = options.colorStroke || LiteGraph.WIDGET_OUTLINE_COLOR;
    ctx.fillStyle = options.colorBackground || LiteGraph.WIDGET_BGCOLOR;
    ctx.beginPath();
    ctx.roundRect(options.posX, options.posY, options.width, options.height, lowQuality ? [0] : options.borderRadius ? [options.borderRadius] : [options.height * 0.5]);
    ctx.fill();
    !lowQuality && ctx.stroke();
}
export function drawNumberWidgetPart(ctx, options) {
    const arrowWidth = 9;
    const arrowHeight = 10;
    const innerMargin = 3;
    const numberWidth = 32;
    const xBoundsArrowLess = [0, 0];
    const xBoundsNumber = [0, 0];
    const xBoundsArrowMore = [0, 0];
    ctx.save();
    let posX = options.posX;
    const { posY, height, value, textColor } = options;
    const midY = posY + height / 2;
    if (options.direction === -1) {
        posX = posX - arrowWidth - innerMargin - numberWidth - innerMargin - arrowWidth;
    }
    ctx.fill(new Path2D(`M ${posX} ${midY} l ${arrowWidth} ${arrowHeight / 2} l 0 -${arrowHeight} L ${posX} ${midY} z`));
    xBoundsArrowLess[0] = posX;
    xBoundsArrowLess[1] = arrowWidth;
    posX += arrowWidth + innerMargin;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const oldTextcolor = ctx.fillStyle;
    if (textColor) {
        ctx.fillStyle = textColor;
    }
    ctx.fillText(fitString(ctx, value.toFixed(2), numberWidth), posX + numberWidth / 2, midY);
    ctx.fillStyle = oldTextcolor;
    xBoundsNumber[0] = posX;
    xBoundsNumber[1] = numberWidth;
    posX += numberWidth + innerMargin;
    ctx.fill(new Path2D(`M ${posX} ${midY - arrowHeight / 2} l ${arrowWidth} ${arrowHeight / 2} l -${arrowWidth} ${arrowHeight / 2} v -${arrowHeight} z`));
    xBoundsArrowMore[0] = posX;
    xBoundsArrowMore[1] = arrowWidth;
    ctx.restore();
    return [xBoundsArrowLess, xBoundsNumber, xBoundsArrowMore];
}
drawNumberWidgetPart.WIDTH_TOTAL = 9 + 3 + 32 + 3 + 9;
export function drawTogglePart(ctx, options) {
    const lowQuality = isLowQuality();
    ctx.save();
    const { posX, posY, height, value } = options;
    const toggleRadius = height * 0.36;
    const toggleBgWidth = height * 1.5;
    if (!lowQuality) {
        ctx.beginPath();
        ctx.roundRect(posX + 4, posY + 4, toggleBgWidth - 8, height - 8, [height * 0.5]);
        ctx.globalAlpha = app.canvas.editor_alpha * 0.25;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fill();
        ctx.globalAlpha = app.canvas.editor_alpha;
    }
    ctx.fillStyle = value === true ? "#89B" : "#888";
    const toggleX = lowQuality || value === false
        ? posX + height * 0.5
        : value === true
            ? posX + height
            : posX + height * 0.75;
    ctx.beginPath();
    ctx.arc(toggleX, posY + height * 0.5, toggleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return [posX, toggleBgWidth];
}
export function drawInfoIcon(ctx, x, y, size = 12) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, [size * 0.1]);
    ctx.fillStyle = "#2f82ec";
    ctx.strokeStyle = "#0f2a5e";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    const midX = x + size / 2;
    const serifSize = size * 0.175;
    ctx.stroke(new Path2D(`
    M ${midX} ${y + size * 0.15}
    v 2
    M ${midX - serifSize} ${y + size * 0.45}
    h ${serifSize}
    v ${size * 0.325}
    h ${serifSize}
    h -${serifSize * 2}
  `));
    ctx.restore();
}
export function drawLabelAndValue(ctx, label, value, width, posY, height, options) {
    var _a;
    const outerMargin = 15;
    const innerMargin = 10;
    const midY = posY + height / 2;
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    const labelX = outerMargin + innerMargin + ((_a = options === null || options === void 0 ? void 0 : options.offsetLeft) !== null && _a !== void 0 ? _a : 0);
    ctx.fillText(label, labelX, midY);
    const valueXLeft = labelX + ctx.measureText(label).width + 7;
    const valueXRight = width - (outerMargin + innerMargin);
    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
    ctx.textAlign = "right";
    ctx.fillText(fitString(ctx, value, valueXRight - valueXLeft), valueXRight, midY);
    ctx.restore();
}
export function drawWidgetButton(drawCtx, text, isMouseDownedAndOver = false) {
    if (!isLowQuality() && !isMouseDownedAndOver) {
        drawRoundedRectangle(drawCtx.ctx, {
            width: drawCtx.width - 30 - 2,
            height: drawCtx.height,
            posY: drawCtx.y + 1,
            posX: 15 + 1,
            borderRadius: 4,
            colorBackground: "#000000aa",
            colorStroke: "#000000aa",
        });
    }
    drawRoundedRectangle(drawCtx.ctx, {
        width: drawCtx.width - 30,
        height: drawCtx.height,
        posY: drawCtx.y + (isMouseDownedAndOver ? 1 : 0),
        posX: 15,
        borderRadius: isLowQuality() ? 0 : 4,
        colorBackground: isMouseDownedAndOver ? "#444" : LiteGraph.WIDGET_BGCOLOR,
    });
    if (!isLowQuality()) {
        drawCtx.ctx.textBaseline = "middle";
        drawCtx.ctx.textAlign = "center";
        drawCtx.ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
        drawCtx.ctx.fillText(text, drawCtx.node.size[0] / 2, drawCtx.y + drawCtx.height / 2 + (isMouseDownedAndOver ? 1 : 0));
    }
}

// CODE HERE WRITTEN BY Rgthree

export class RgthreeBaseWidget {
    constructor(name) {
        this.last_y = 0;
        this.mouseDowned = null;
        this.isMouseDownedAndOver = false;
        this.hitAreas = {};
        this.downedHitAreasForMove = [];
        this.name = name;
    }
    clickWasWithinBounds(pos, bounds) {
        let xStart = bounds[0];
        let xEnd = xStart + (bounds.length > 2 ? bounds[2] : bounds[1]);
        const clickedX = pos[0] >= xStart && pos[0] <= xEnd;
        if (bounds.length === 2) {
            return clickedX;
        }
        return clickedX && pos[1] >= bounds[1] && pos[1] <= bounds[1] + bounds[3];
    }
    mouse(event, pos, node) {
        var _a, _b, _c;
        const canvas = app.canvas;
        if (event.type == "pointerdown") {
            this.mouseDowned = [...pos];
            this.isMouseDownedAndOver = true;
            this.downedHitAreasForMove.length = 0;
            let anyHandled = false;
            for (const part of Object.values(this.hitAreas)) {
                if ((part.onDown || part.onMove) && this.clickWasWithinBounds(pos, part.bounds)) {
                    if (part.onMove) {
                        this.downedHitAreasForMove.push(part);
                    }
                    if (part.onDown) {
                        const thisHandled = part.onDown.apply(this, [event, pos, node, part]);
                        anyHandled = anyHandled || thisHandled == true;
                    }
                }
            }
            return (_a = this.onMouseDown(event, pos, node)) !== null && _a !== void 0 ? _a : anyHandled;
        }
        if (event.type == "pointerup") {
            if (!this.mouseDowned)
                return true;
            this.downedHitAreasForMove.length = 0;
            this.cancelMouseDown();
            let anyHandled = false;
            for (const part of Object.values(this.hitAreas)) {
                if (part.onUp && this.clickWasWithinBounds(pos, part.bounds)) {
                    const thisHandled = part.onUp.apply(this, [event, pos, node, part]);
                    anyHandled = anyHandled || thisHandled == true;
                }
            }
            return (_b = this.onMouseUp(event, pos, node)) !== null && _b !== void 0 ? _b : anyHandled;
        }
        if (event.type == "pointermove") {
            this.isMouseDownedAndOver = !!this.mouseDowned;
            if (this.mouseDowned &&
                (pos[0] < 15 ||
                    pos[0] > node.size[0] - 15 ||
                    pos[1] < this.last_y ||
                    pos[1] > this.last_y + LiteGraph.NODE_WIDGET_HEIGHT)) {
                this.isMouseDownedAndOver = false;
            }
            for (const part of this.downedHitAreasForMove) {
                part.onMove.apply(this, [event, pos, node, part]);
            }
            return (_c = this.onMouseMove(event, pos, node)) !== null && _c !== void 0 ? _c : true;
        }
        return false;
    }
    cancelMouseDown() {
        this.mouseDowned = null;
        this.isMouseDownedAndOver = false;
        this.downedHitAreasForMove.length = 0;
    }
    onMouseDown(event, pos, node) {
        return;
    }
    onMouseUp(event, pos, node) {
        return;
    }
    onMouseMove(event, pos, node) {
        return;
    }
}
export class RgthreeBetterButtonWidget extends RgthreeBaseWidget {
    constructor(name, mouseUpCallback) {
        super(name);
        this.value = "";
        this.mouseUpCallback = mouseUpCallback;
    }
    draw(ctx, node, width, y, height) {
        drawWidgetButton({ ctx, node, width, height, y }, this.name, this.isMouseDownedAndOver);
    }
    onMouseUp(event, pos, node) {
        return this.mouseUpCallback(event, pos, node);
    }
}
export class RgthreeBetterTextWidget {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    draw(ctx, node, width, y, height) {
        const widgetData = drawNodeWidget(ctx, { width, height, posY: y });
        if (!widgetData.lowQuality) {
            drawLabelAndValue(ctx, this.name, this.value, width, y, height);
        }
    }
    mouse(event, pos, node) {
        const canvas = app.canvas;
        if (event.type == "pointerdown") {
            canvas.prompt("Label", this.value, (v) => (this.value = v), event);
            return true;
        }
        return false;
    }
}
export class RgthreeDividerWidget {
    constructor(widgetOptions) {
        this.options = { serialize: false };
        this.value = null;
        this.name = "divider";
        this.widgetOptions = {
            marginTop: 7,
            marginBottom: 7,
            marginLeft: 15,
            marginRight: 15,
            color: LiteGraph.WIDGET_OUTLINE_COLOR,
            thickness: 1,
        };
        Object.assign(this.widgetOptions, widgetOptions || {});
    }
    draw(ctx, node, width, posY, h) {
        if (this.widgetOptions.thickness) {
            ctx.strokeStyle = this.widgetOptions.color;
            const x = this.widgetOptions.marginLeft;
            const y = posY + this.widgetOptions.marginTop;
            const w = width - this.widgetOptions.marginLeft - this.widgetOptions.marginRight;
            ctx.stroke(new Path2D(`M ${x} ${y} h ${w}`));
        }
    }
    computeSize(width) {
        return [
            width,
            this.widgetOptions.marginTop + this.widgetOptions.marginBottom + this.widgetOptions.thickness,
        ];
    }
}
export class RgthreeLabelWidget {
    constructor(name, widgetOptions) {
        this.options = { serialize: false };
        this.value = null;
        this.widgetOptions = {};
        this.posY = 0;
        this.name = name;
        Object.assign(this.widgetOptions, widgetOptions);
    }
    draw(ctx, node, width, posY, height) {
        this.posY = posY;
        ctx.save();
        ctx.textAlign = this.widgetOptions.align || "left";
        ctx.fillStyle = this.widgetOptions.color || LiteGraph.WIDGET_TEXT_COLOR;
        const oldFont = ctx.font;
        if (this.widgetOptions.italic) {
            ctx.font = "italic " + ctx.font;
        }
        if (this.widgetOptions.size) {
            ctx.font = ctx.font.replace(/\d+px/, `${this.widgetOptions.size}px`);
        }
        const midY = posY + height / 2;
        ctx.textBaseline = "middle";
        if (this.widgetOptions.align === "center") {
            ctx.fillText(this.name, node.size[0] / 2, midY);
        }
        else {
            ctx.fillText(this.name, 15, midY);
        }
        ctx.font = oldFont;
        if (this.widgetOptions.actionLabel === "__PLUS_ICON__") {
            const plus = new Path2D(`M${node.size[0] - 15 - 2} ${posY + 7} v4 h-4 v4 h-4 v-4 h-4 v-4 h4 v-4 h4 v4 h4 z`);
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.fillStyle = "#3a3";
            ctx.strokeStyle = "#383";
            ctx.fill(plus);
            ctx.stroke(plus);
        }
        ctx.restore();
    }
    mouse(event, nodePos, node) {
        if (event.type !== "pointerdown" ||
            isLowQuality() ||
            !this.widgetOptions.actionLabel ||
            !this.widgetOptions.actionCallback) {
            return false;
        }
        const pos = [nodePos[0], nodePos[1] - this.posY];
        const rightX = node.size[0] - 15;
        if (pos[0] > rightX || pos[0] < rightX - 16) {
            return false;
        }
        this.widgetOptions.actionCallback(event);
        return true;
    }
}
export class RgthreeInvisibleWidget {
    constructor(name, type, value, serializeValueFn) {
        this.serializeValue = undefined;
        this.name = name;
        this.type = type;
        this.value = value;
        if (serializeValueFn) {
            this.serializeValue = serializeValueFn;
        }
    }
    draw() { return; }
    computeSize(width) { return [0, 0]; }
}
