import hashlib
import os
import folder_paths  # type: ignore
import node_helpers  # type: ignore
import numpy as np  # type: ignore
import torch  # type: ignore
from PIL import Image, ImageSequence, ImageOps  # type: ignore
from ...backend.shared import (
    pil2tensor,
    base64_to_pil,
    FlexibleOptionalInputType,
    any_type,
)


class IToolsCropImage:
    @classmethod
    def INPUT_TYPES(s):
        ratios = [
            "free",
            "grid",
            "1:1",
            "2:3",
            "3:4",
            "4:5",
            "9:16",
            "9:21",
            "3:2",
            "4:3",
            "5:4",
            "16:9",
            "21:9",
        ]
        input_dir = folder_paths.get_input_directory()
        files = [
            f
            for f in os.listdir(input_dir)
            if os.path.isfile(os.path.join(input_dir, f))
        ]
        return {
            "required": {
                "resize_rule": (ratios, {"default": "grid"}),
                "grid_step": ("INT", {"default": 64, "min": 1, "max": 128}),
                "image": (sorted(files), {"image_upload": True}),
            },
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE",)  # "MASK", "STRING", "STRING")
    RETURN_NAMES = ("image",)  # "MASK", "possible prompt", "image name")
    FUNCTION = "crop_image"
    DESCRIPTION = "Crop an Image."
    OUTPUT_NODE = True

    def crop_image(self, image, **kwargs):
        cropped_img = None
        for key, value in kwargs.items():
            if key == "crop" and value is not None:
                cropped_img = base64_to_pil(value["data"])

        image_path = folder_paths.get_annotated_filepath(image)
        img = node_helpers.pillow(Image.open, image_path)
        output_images = []
        w, h = None, None
        excluded_formats = ["MPO"]
        for i in ImageSequence.Iterator(img):
            i = node_helpers.pillow(ImageOps.exif_transpose, i)
            if i.mode == "I":
                i = i.point(lambda i: i * (1 / 255))
            image = i.convert("RGB")
            if len(output_images) == 0:
                w = image.size[0]
                h = image.size[1]
            if image.size[0] != w or image.size[1] != h:
                continue
            image = np.array(image).astype(np.float32) / 255.0
            image = torch.from_numpy(image)[None,]
            output_images.append(image)
        if len(output_images) > 1 and img.format not in excluded_formats:
            output_image = torch.cat(output_images, dim=0)
        else:
            output_image = output_images[0]
        try:
            if cropped_img is not None:
                result = [cropped_img]
                return pil2tensor(result)
            return (output_image,)
        except Exception as e:
            return (output_image,)

    @classmethod
    def IS_CHANGED(cls, image, **kwargs):
        image_path = folder_paths.get_annotated_filepath(image)
        m = hashlib.sha256()
        with open(image_path, "rb") as f:
            m.update(f.read())
        return m.digest().hex()

    @classmethod
    def VALIDATE_INPUTS(cls, image):
        if not folder_paths.exists_annotated_filepath(image):
            return "Invalid image file: {}".format(image)

        return True
