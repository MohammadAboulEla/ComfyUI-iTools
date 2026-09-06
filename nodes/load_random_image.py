from pathlib import Path
import folder_paths  # type: ignore
from PIL import Image  # type: ignore
from ..backend.shared import pil2tensor


class IToolsLoadRandomImage:
    @classmethod
    def INPUT_TYPES(s):
        default_dir = folder_paths.output_directory
        return {
            "required": {
                "images_directory": (
                    "STRING",
                    {"default": default_dir, "multiline": False},
                ),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xFFF}),
            }
        }

    RETURN_TYPES = (
        "IMAGE",
        "STRING",
    )
    RETURN_NAMES = (
        "image",
        "image name",
    )
    FUNCTION = "load_random_image"
    CATEGORY = "iTools"
    DESCRIPTION = "Will return image from a given directory. it will also return the name of these image."

    def load_random_image(self, images_directory, seed):
        image_extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
        images_path = Path(images_directory.replace('"', ""))

        if not images_path.exists():
            raise FileNotFoundError(
                f"Image directory {images_directory} does not exist"
            )

        all_images = []  # Store all valid image paths

        for image_path in images_path.iterdir():
            if image_path.suffix.lower() in image_extensions:
                all_images.append(image_path)

        if not all_images:
            raise ValueError("No valid images found in the directory")

        # Calculate the random index based on the seed
        random_index = seed % len(all_images)
        selected_image_path = all_images[random_index]

        # Load the selected image
        image = pil2tensor(Image.open(selected_image_path))
        image_name = selected_image_path.stem

        return image, image_name
