# Node status and known issues
- All nodes are now located in the `nodes` folder, and some of them are related to JS files in the `web` folder. I wish the Python and JS files had matching names to make them easier to identify.


- My final goal is to make all nodes compatible with ComfyUI Node 2.0 and, optionally, have them all follow the new `io.Schema` system. For now, only the `IToolsImageAdjust` node supports both.



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

ok. and compatible with ComfyUI Node.2.
(follows new io.Schema system and uses a custom DOM preview widget)


### IToolsCompareImage:

ok. and compatible with ComfyUI Node.2.
(follows new io.Schema system and uses a custom DOM preview widget)



### IToolsPromptRecord:

ok. and compatible with ComfyUI Node.2.
(follows new io.Schema system and uses a native HTML DOM toolbar widget)

## experimental

### IToolsPaintNode:

code is a mess but almost works. it uses SmartButton class and works fine and compatible with ComfyUI Node.2 it has a workaround since it is a single domWidget in the node.

### IToolsCropImage:

bad code but works for now
not compatible with ComfyUI Node.2.

## dev

dev nodes are not ment to be for users they are for me and for ai agents to be used as ref or guides of how to creat nodes.

### IToolsTestNode:

ok. and compatible with ComfyUI Node.2.

### IToolsDomNode:

ok. and compatible with ComfyUI Node.2.
