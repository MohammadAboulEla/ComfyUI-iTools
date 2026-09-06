import os
import random
import json
import numpy as np  # type: ignore
from PIL import Image  # type: ignore
from PIL.PngImagePlugin import PngInfo  # type: ignore
import folder_paths  # type: ignore
from comfy.cli_args import args  # type: ignore


class IToolsVaePreview:
    def __init__(self):
        self.output_dir = folder_paths.get_temp_directory()
        self.type = "temp"
        self.prefix_append = "_temp_" + "".join(
            random.choice("abcdefghijklmnopqrstupvxyz") for x in range(5)
        )
        self.compress_level = 1

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "samples": ("LATENT", {"tooltip": "The latent to be decoded."}),
                "vae": (
                    "VAE",
                    {"tooltip": "The VAE model used for decoding the latent."},
                ),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "vae_preview"

    OUTPUT_NODE = True

    CATEGORY = "iTools"
    DESCRIPTION = "Merges VAE decoding and image preview into one node."

    def vae_preview(
        self,
        samples,
        vae,
        filename_prefix="ComfyUI",
        prompt=None,
        extra_pnginfo=None,
    ):

        def decode(vae, samples):
            images = vae.decode(samples["samples"])
            if len(images.shape) == 5:  # Combine batches
                images = images.reshape(
                    -1, images.shape[-3], images.shape[-2], images.shape[-1]
                )
            return (images,)

        return_options = decode(vae, samples)
        images = return_options[0]
        filename_prefix += self.prefix_append
        full_output_folder, filename, counter, subfolder, filename_prefix = (
            folder_paths.get_save_image_path(
                filename_prefix, self.output_dir, images[0].shape[1], images[0].shape[0]
            )
        )
        results = list()
        for batch_number, image in enumerate(images):
            i = 255.0 * image.cpu().numpy()
            img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
            metadata = None
            if not args.disable_metadata:
                metadata = PngInfo()
                if prompt is not None:
                    metadata.add_text("prompt", json.dumps(prompt))
                if extra_pnginfo is not None:
                    for x in extra_pnginfo:
                        metadata.add_text(x, json.dumps(extra_pnginfo[x]))

            filename_with_batch_num = filename.replace("%batch_num%", str(batch_number))
            file = f"{filename_with_batch_num}_{counter:05}_.png"
            img.save(
                os.path.join(full_output_folder, file),
                pnginfo=metadata,
                compress_level=self.compress_level,
            )
            results.append(
                {"filename": file, "subfolder": subfolder, "type": self.type}
            )
            counter += 1

        return {"ui": {"images": results}, "result": return_options}
