// Adapter singleton that replaces reads from `app.canvas` inside Smart* widgets
// when the host node draws into its own <canvas> hosted in a DOM widget.
//
// One singleton, one active host at a time. paint_node's manager attaches the
// host canvas in nodeCreated; all BaseSmartWidget helpers (mousePos,
// isMouseDown, isLowQuality, etc.) funnel through here instead of reading
// litegraph globals.
//
// Legacy hosts (crop_node, preview_node, compare_node, text_entry) never
// attach, so `canvas` stays null and `setCursor` / `requestRedraw` delegate
// back to the litegraph canvas. That keeps their behavior identical to the
// pre-refactor version.

import { app } from "../../../scripts/app.js";

export const domCtx = {
  canvas: null,
  ctx: null,
  node: null,
  mouseX: 0,
  mouseY: 0,
  pointerDown: false,
  scale: 1,
  _dirty: false,
  _rafPending: false,
  _onFrame: null,

  attach(canvas, ctx, node, onFrame) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.node = node;
    this._onFrame = onFrame;
    this.requestRedraw();
  },

  detach() {
    this.canvas = null;
    this.ctx = null;
    this.node = null;
    this._onFrame = null;
    this._dirty = false;
    this._rafPending = false;
  },

  requestRedraw(legacyNode = null) {
    // DOM mode: event-driven rAF. One frame per requestRedraw call; the
    // frame callback does NOT re-arm itself, so the loop idles when nothing
    // is dirty. Callers (mouse handlers, paint stroke updates, etc.) must
    // call requestRedraw again when state changes.
    if (this.canvas) {
      this._dirty = true;
      if (this._rafPending) return;
      this._rafPending = true;
      requestAnimationFrame(() => {
        this._rafPending = false;
        if (!this._dirty || !this.canvas) return;
        this._dirty = false;
        this._onFrame?.();
      });
      return;
    }
    // Legacy mode: delegate to litegraph.
    if (legacyNode?.setDirtyCanvas) {
      legacyNode.setDirtyCanvas(true, true);
    } else if (app?.canvas?.setDirty) {
      app.canvas.setDirty(true, true);
    }
  },

  setCursor(cursor) {
    if (this.canvas) {
      this.canvas.style.cursor = cursor;
      return;
    }
    if (app?.canvas?.canvas) {
      app.canvas.canvas.style.cursor = cursor;
    }
  },
};
