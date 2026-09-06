from ..backend.grid_filler import (
    fill_grid_with_images_new,
    tensor_to_images,
    image_to_tensor,
)


class IToolsGridFiller:

    @classmethod
    def INPUT_TYPES(s):
        directions = ["rows", "cols"]
        return {
            "required": {
                "images": ("IMAGE", {}),
                "width": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "rows": ("INT", {"default": 3, "min": 1, "max": 10}),
                "cols": ("INT", {"default": 3, "min": 1, "max": 10}),
                "gaps": ("FLOAT", {"default": 2, "min": 0.0, "max": 50, "steps": 1}),
                "background_color": (
                    "STRING",
                    {"default": "#000000AA", "multiline": False},
                ),
                "fill_direction": (directions, {"default": directions[0]}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "fill_grid"
    CATEGORY = "iTools"
    INPUT_IS_LIST = (True, False, False, False, False, False, False)
    OUTPUT_IS_LIST = (False, False, False, False, False, False, False)
    DESCRIPTION = (
        "Arranging a set of images into specified rows and columns, applying "
        "optional spacing and background color"
    )

    def fill_grid(
        self, images, width, height, rows, cols, gaps, background_color, fill_direction
    ):
        # Convert tensor to Pillow images
        pillow_images = tensor_to_images(images)

        # Process images using the provided function
        processed_image = fill_grid_with_images_new(
            pillow_images,
            rows=rows,
            cols=cols,
            grid_size=(width, height),
            gap=gaps,
            bg_color=background_color,
            direction=fill_direction[0],
        )
        print("fill_direction", fill_direction)
        # Convert the processed Pillow image back to a tensor
        output_tensor = image_to_tensor(processed_image)

        return (output_tensor,)
