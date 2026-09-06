from pathlib import Path
import folder_paths  # type: ignore
import torch  # type: ignore
from PIL import Image  # type: ignore
from ..backend.shared import pil2tensor


class IToolsLoadImages:
    @classmethod
    def INPUT_TYPES(s):
        default_dir = folder_paths.output_directory
        return {
            "required": {
                "images_directory": (
                    "STRING",
                    {"default": default_dir, "multiline": False},
                ),
                "start_index": ("INT", {"default": 0, "min": 0, "max": 200}),
                "load_limit": ("INT", {"default": 4, "min": 2, "max": 200}),
                "output_mode": (["list", "batch"], {"default": "list"}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING", "INT")
    RETURN_NAMES = ("images", "images names", "count")
    FUNCTION = "load_images"
    CATEGORY = "iTools"
    OUTPUT_IS_LIST = (True, True, False)
    DESCRIPTION = (
        "Will return list of images from a given directory with a given limit, for example if the limit is "
        "4 it will return first 4 images in that directory. it will also return the list of these images "
        "names."
    )

    def load_images(
        self, images_directory, load_limit, start_index, output_mode="list"
    ):
        image_extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
        images_path = Path(images_directory.replace('"', ""))

        if not images_path.exists():
            raise FileNotFoundError(
                f"Image directory {images_directory} does not exist"
            )

        images = []
        images_names = []
        for idx, image_path in enumerate(images_path.iterdir()):
            if idx < start_index:
                continue  # Skip images until reaching the start_index
            if image_path.suffix.lower() in image_extensions:
                images.append(pil2tensor(Image.open(image_path)))
                images_names.append(
                    image_path.stem
                )  # Add the image name without extension
                if len(images) >= load_limit:
                    break

        count = len(images)
        if output_mode == "batch" and images:
            images = [torch.cat(images, dim=0)]

        return images, images_names, count
