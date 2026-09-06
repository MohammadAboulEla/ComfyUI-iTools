from ..backend.overlay import add_text_bar
from ..backend.shared import tensor2pil, pil2tensor


class IToolsAddOverlay:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image": ("IMAGE", {}),
                "text": ("STRING", {"default": "img info:", "multiline": False}),
                "background_color": (
                    "STRING",
                    {"default": "#000000AA", "multiline": False},
                ),
                "font_size": ("INT", {"default": 40, "min": 10, "max": 1000}),
                "overlay_mode": ("BOOLEAN", {"default": True}),
            }
        }

    CATEGORY = "iTools"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "add_text_overlay"
    DESCRIPTION = (
        "Will add an overlay bottom bar to show a given text, you may change the background color of the "
        "overlay bar and the font size."
    )

    def add_text_overlay(self, image, text, font_size, background_color, overlay_mode):

        # Convert image to tensor
        pil_image = tensor2pil(image)

        # Add overlay or underlay
        if overlay_mode:
            composite = add_text_bar(
                pil_image,
                text,
                font_size=font_size,
                background_color=background_color,
                position="overlay",
            )
        else:
            composite = add_text_bar(
                pil_image,
                text,
                font_size=font_size,
                background_color=background_color,
                position="underlay",
            )

        # Convert back to tensor
        out = pil2tensor(composite)

        return (out,)
