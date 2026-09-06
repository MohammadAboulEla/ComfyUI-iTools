import os
from PIL import Image  # type: ignore
from ...backend.shared import (
    project_dir,
    pil2tensor,
    FlexibleOptionalInputType,
    any_type,
)


class IToolsPaintNode:
    @classmethod
    def INPUT_TYPES(self):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "paint_func"
    DESCRIPTION = "Will paint"

    def paint_func(self, **kwargs):
        save_directory = os.path.join(project_dir, "backend")
        background_path = os.path.join(
            save_directory, "iToolsPaintedImage_background.png"
        )
        foreground_path = os.path.join(
            save_directory, "iToolsPaintedImage_foreground.png"
        )
        background_img = Image.open(background_path)
        foreground_img = Image.open(foreground_path)

        # Overlay the foreground onto the background
        final_img = Image.alpha_composite(background_img, foreground_img)

        final_img = final_img.convert("RGB")

        result = [final_img]
        return pil2tensor(result)

    def IS_CHANGED(
        cls,
    ):
        return True
