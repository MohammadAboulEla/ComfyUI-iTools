# Node status and known issues

- My final goal is to make all nodes compatible with ComfyUI Node 2.0 and, optionally, have them all follow the new `io.Schema` system. For now, only the `IToolsImageAdjust` node supports both.

- My `SmartWidget` and its inheritance system seem to be broken after the recent ComfyUI updates. For now, the easiest approach may be to use them inside a `DOMWidget` and add the DOM to the node.

`IToolsPaintNode` is a perfect example. It moves itself as a single widget in `web/paint_node.js` while keeping its old design and behavior.


## core

### IToolsPromptLoader:

ok. and compatible with ComfyUI Node.2.

### IToolsPromptSaver:

ok. and compatible with ComfyUI Node.2.

### IToolsPromptStyler:

ok. and compatible with ComfyUI Node.2.

### IToolsAddOverlay:

ok. and compatible with ComfyUI Node.2.

### IToolsLoadImages:

ok. and compatible with ComfyUI Node.2.

### IToolsPromptStylerExtra:

ok. and compatible with ComfyUI Node.2.

### IToolsGridFiller:

ok. and compatible with ComfyUI Node.2.

### IToolsLineLoader:

ok. and compatible with ComfyUI Node.2.

### IToolsTextReplacer:

ok. and compatible with ComfyUI Node.2.

### IToolsRegexNode:

ok. and compatible with ComfyUI Node.2.

### IToolsKSampler:

ok. and compatible with ComfyUI Node.2.

### IToolsCheckerBoard:

ok. and compatible with ComfyUI Node.2.

### IToolsLoadRandomImage:

ok. and compatible with ComfyUI Node.2.

### IToolsPreviewText:

ok. and compatible with ComfyUI Node.2.

> has a recent bug where it was compatible with ComfyUI Node.2 only if created before activating Node.2 in comfyui. but if Node.2 is allready activated it was giving an error. (seems to be fixed for now)

### IToolsInstructorNode:

ok. and compatible with ComfyUI Node.2. (most modern)

### IToolsPromptBuilder:

ok. and compatible with ComfyUI Node.2. (most modern)

### IToolsImageAdjust:

ok. and compatible with ComfyUI Node.2.
(most modern and follow new schema at python side)
almost berfect node to be used as guide or reference for perfect new way of creating new nodes.

### IToolsLoadImagePlus:

ok. and compatible with ComfyUI Node.2.
need to enhance possible prompt algorithm.

### IToolsVaePreview:

ok. and compatible with ComfyUI Node.2.

### IToolsPreviewImage:

broken like all nodes that uses SmartButton class.

### IToolsCompareImage:

broken like all nodes that uses SmartButton class.

### IToolsPromptRecord:

broken like all nodes that uses SmartButton class.

## experimental

### IToolsPaintNode:

code is a mess but almost works. it uses SmartButton class and works fine and compatible with ComfyUI Node.2 it has a workaround since it is a single domWidget in the node.

### IToolsCropImage:

bad code but works for now
not compatible with ComfyUI Node.2.

## dev

### IToolsTestNode:

ok. and compatible with ComfyUI Node.2.

### IToolsDomNode:

ok. and compatible with ComfyUI Node.2.
