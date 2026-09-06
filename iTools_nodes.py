from .nodes import (
    IToolsLoadImagePlus,
    IToolsPromptLoader,
    IToolsPromptSaver,
    IToolsPromptStyler,
    IToolsAddOverlay,
    IToolsLoadImages,
    IToolsPromptStylerExtra,
    IToolsGridFiller,
    IToolsLineLoader,
    IToolsTextReplacer,
    IToolsRegexNode,
    IToolsKSampler,
    IToolsVaePreview,
    IToolsCheckerBoard,
    IToolsLoadRandomImage,
    IToolsPreviewText,
    IToolsPreviewImage,
    IToolsCompareImage,
    IToolsPromptRecord,
    IToolsInstructorNode,
    IToolsPromptBuilder,
    IToolsImageAdjust,
)
from .backend.shared import (
    get_user_node_display_name_preferences,
    get_user_dev_mode,
    get_user_dev_mode2,
)
from .backend import iserver

# A dictionary that contains all nodes you want to export with their names
# NOTE: names should be globally unique
NODE_CLASS_MAPPINGS = {
    "iToolsLoadImagePlus": IToolsLoadImagePlus,
    "iToolsPromptLoader": IToolsPromptLoader,
    "iToolsPromptSaver": IToolsPromptSaver,
    "iToolsAddOverlay": IToolsAddOverlay,
    "iToolsLoadImages": IToolsLoadImages,
    "iToolsPromptStyler": IToolsPromptStyler,
    "iToolsPromptStylerExtra": IToolsPromptStylerExtra,
    "iToolsGridFiller": IToolsGridFiller,
    "iToolsLineLoader": IToolsLineLoader,
    "iToolsTextReplacer": IToolsTextReplacer,
    "iToolsKSampler": IToolsKSampler,
    "iToolsVaePreview": IToolsVaePreview,
    "iToolsCheckerBoard": IToolsCheckerBoard,
    "iToolsLoadRandomImage": IToolsLoadRandomImage,
    "iToolsPreviewText": IToolsPreviewText,
    "iToolsRegexNode": IToolsRegexNode,
    "iToolsPreviewImage": IToolsPreviewImage,
    "iToolsCompareImage": IToolsCompareImage,
    "iToolsPromptRecord": IToolsPromptRecord,
    "iToolsInstructorNode": IToolsInstructorNode,
    "iToolsPromptBuilder": IToolsPromptBuilder,
    "iToolsImageAdjust": IToolsImageAdjust,
}

BASE_MAPPINGS = {
    "iToolsLoadImagePlus": "Load Image 🏕️",
    "iToolsPromptLoader": "Prompt Loader",
    "iToolsPromptSaver": "Prompt Saver",
    "iToolsAddOverlay": "Add Text Overlay",
    "iToolsLoadImages": "Load Images 📦",
    "iToolsPromptStyler": "Prompt Styler 🖌️",
    "iToolsPromptStylerExtra": "Prompt Styler Extra 🖌️",
    "iToolsGridFiller": "Grid Filler 📲",
    "iToolsLineLoader": "Line Loader",
    "iToolsTextReplacer": "Text Replacer",
    "iToolsKSampler": "KSampler",
    "iToolsVaePreview": "Preview Bridge ⛳",
    "iToolsCheckerBoard": "Checkerboard 🏁",
    "iToolsLoadRandomImage": "Load Random Image 🎲",
    "iToolsPreviewText": "Text Preview",
    "iToolsRegexNode": "Regex Editor",
    "iToolsPreviewImage": "Image Preview 🍿",
    "iToolsCompareImage": "Image Compare 🔍",
    "iToolsPromptRecord": "Prompt Record 🪶",
    "iToolsInstructorNode": "Instructor 👨🏻‍🏫",
    "iToolsPromptBuilder": "Prompt Builder 🛖",
    "iToolsImageAdjust": "Image Adjustments 🎛️",
}


# INIT NODE DISPLAY NAME MAPPINGS
def get_node_display_name_mappings():
    use_simple_names = get_user_node_display_name_preferences()
    if use_simple_names:
        return BASE_MAPPINGS

    # Add "iTools " prefix dynamically if simple names are not preferred
    return {k: f"iTools {v}" for k, v in BASE_MAPPINGS.items()}


# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = get_node_display_name_mappings()


def append_extra_nodes():
    use_simple_names = get_user_node_display_name_preferences()
    allow_beta_nodes = get_user_dev_mode()
    allow_dev_nodes = get_user_dev_mode2()
    allow_experimental_nodes = False
    if allow_beta_nodes:
        try:
            from .nodes.experimental import (
                IToolsPaintNode,
                IToolsCropImage,
            )

            NODE_CLASS_MAPPINGS["iToolsPaintNode"] = IToolsPaintNode
            NODE_DISPLAY_NAME_MAPPINGS["iToolsPaintNode"] = (
                "Paint Node (Beta)" if use_simple_names else "iTools Paint Node (Beta)"
            )

            NODE_CLASS_MAPPINGS["iToolsCropImage"] = IToolsCropImage
            NODE_DISPLAY_NAME_MAPPINGS["iToolsCropImage"] = (
                "Crop Image (Beta)" if use_simple_names else "iTools Crop Image (Beta)"
            )

        except ModuleNotFoundError as e:
            pass
            # print(e)

    if allow_dev_nodes:
        try:
            from .nodes.experimental import IToolsTestNode, IToolsDomNode

            NODE_CLASS_MAPPINGS["iToolsTestNode"] = IToolsTestNode
            NODE_DISPLAY_NAME_MAPPINGS["iToolsTestNode"] = (
                "Test Node (Dev)" if use_simple_names else "iTools Test Node (Dev)"
            )

            NODE_CLASS_MAPPINGS["iToolsDomNode"] = IToolsDomNode
            NODE_DISPLAY_NAME_MAPPINGS["iToolsDomNode"] = (
                "Dom Node (Dev)" if use_simple_names else "iTools Dom Node (Dev)"
            )

        except ModuleNotFoundError as e:
            pass


append_extra_nodes()
