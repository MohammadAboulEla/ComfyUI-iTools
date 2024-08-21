from pathlib import Path
import folder_paths
import os
import torch
import numpy as np
import hashlib
import torchvision.transforms.v2 as T

import node_helpers
from PIL import Image, ImageSequence, ImageOps
from .metadata.metadata_extractor import get_prompt
from .metadata.file_handeler import FileHandler
from .metadata.overlay import add_overlay_bar, img_to_tensor


class IToolsLoadImagePlus:
    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]
        return {"required":
                    {"image": (sorted(files), {"image_upload": True})},
                }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE", "MASK", "STRING")
    RETURN_NAMES = ("IMAGE", "MASK", "Possible Prompt")
    FUNCTION = "load_image"
    DESCRIPTION = ("An enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt "
                   "used to create an image.")


    def load_image(self, image):
        image_path = folder_paths.get_annotated_filepath(image)

        img = node_helpers.pillow(Image.open, image_path)

        output_images = []
        output_masks = []
        w, h = None, None

        excluded_formats = ['MPO']

        for i in ImageSequence.Iterator(img):
            i = node_helpers.pillow(ImageOps.exif_transpose, i)

            if i.mode == 'I':
                i = i.point(lambda i: i * (1 / 255))
            image = i.convert("RGB")

            if len(output_images) == 0:
                w = image.size[0]
                h = image.size[1]

            if image.size[0] != w or image.size[1] != h:
                continue

            image = np.array(image).astype(np.float32) / 255.0
            image = torch.from_numpy(image)[None,]
            if 'A' in i.getbands():
                mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
                mask = 1. - torch.from_numpy(mask)
            else:
                mask = torch.zeros((64, 64), dtype=torch.float32, device="cpu")
            output_images.append(image)
            output_masks.append(mask.unsqueeze(0))

        if len(output_images) > 1 and img.format not in excluded_formats:
            output_image = torch.cat(output_images, dim=0)
            output_mask = torch.cat(output_masks, dim=0)
        else:
            output_image = output_images[0]
            output_mask = output_masks[0]

        output_prompt = get_prompt(image_path)
        return (output_image, output_mask, output_prompt)

    @classmethod
    def IS_CHANGED(s, image):
        image_path = folder_paths.get_annotated_filepath(image)
        m = hashlib.sha256()
        with open(image_path, 'rb') as f:
            m.update(f.read())
        return m.digest().hex()

    @classmethod
    def VALIDATE_INPUTS(s, image):
        if not folder_paths.exists_annotated_filepath(image):
            return "Invalid image file: {}".format(image)

        return True


class IToolsPromptLoader:

    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                "file_path": ("STRING", {"default": 'prompts.txt', "multiline": False}),
                "seed": ("INT", {"default": 0, "control_after_generate": 0, "min": 0, "max": 0xfffff}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("Prompt",)
    FUNCTION = "load_file"
    DESCRIPTION = ("Will return a prompt (line number) from txt file at given "
                   "index, note that count start from zero.")


    def load_file(self, file_path, seed, fallback="Yes"):
        prompt = ""
        prompt_random = ""
        cn = folder_paths.folder_names_and_paths["custom_nodes"][0][0]
        if file_path == "prompts.txt":
            file = os.path.join(cn, "ComfyUi-iTools\examples\prompts.txt")
        else:
            file = file_path.replace('"', '')
        if os.path.exists(file):
            fh = FileHandler(file)
            try:
                line = fh.read_line(seed)
                prompt = fh.unescape_quotes(line)
            except IndexError:
                if fallback == "Yes":
                    seed = seed % fh.len_lines()
                    line = fh.read_line(seed)
                    prompt = fh.unescape_quotes(line)
        else:
            prompt = f"File not exist, {file}"
        return (prompt, prompt_random)


class IToolsPromptSaver:
    @classmethod
    def INPUT_TYPES(s):
        return {"required":
                    {"prompt": ("STRING", {"forceInput": True}),
                     "file_path": ("STRING", {"default": 'prompts.txt', "multiline": False}),
                     }
                }

    CATEGORY = "iTools"
    RETURN_TYPES = ()
    OUTPUT_NODE = True
    FUNCTION = "save_to_file"
    DESCRIPTION = "Will append the given prompt as a new line to the given file"

    def save_to_file(self, file_path, prompt):
        cn = folder_paths.folder_names_and_paths["custom_nodes"][0][0]
        if file_path == "prompts.txt":
            file = os.path.join(cn, "ComfyUi-iTools\examples\prompts.txt")
        else:
            file = file_path.replace('"', '')
        if os.path.exists(file) and prompt is not None and prompt != "":
            fh = FileHandler(file)
            try:
                fh.append_line(prompt)
                print(f"Prompt: {prompt} saved to {file}")
            except Exception as e:
                print(f"Error while writing the prompt: {e}")
        else:
            print(f"Error while writing the prompt")
        return (True,)


class IToolsAddOverlay:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required":
            {
                "image": ("IMAGE", {}),
                "text": ("STRING", {"default": 'img info:', "multiline": False}),
                "background_color": ("STRING", {"default": '#000000AA', "multiline": False}),
                "font_size": ("INT", {"default": 40, "min": 10, "max": 1000})
            }
        }

    CATEGORY = "iTools"
    RETURN_TYPES = ("IMAGE",)
    # OUTPUT_NODE = True
    FUNCTION = "add_text_overlay"
    DESCRIPTION = ("Will add an overlay bottom bar to show a given text, you may change the background color of the "
                   "overlay bar and the font size.")
    def add_text_overlay(self, image, text, font_size, background_color):
        # Remove the batch dimension and rearrange to [C, H, W]
        tensor = image.squeeze(0).permute(2, 0, 1)

        # Ensure the values are in the range [0, 1]
        tensor = tensor.clamp(0, 1)

        # Convert to PIL Image
        to_pil = T.ToPILImage()
        pil_image = to_pil(tensor)

        # Add overlay (assuming add_overlay_bar is defined elsewhere)
        composite = add_overlay_bar(pil_image, text, font_size=font_size, background_color=background_color)

        # Convert back to tensor
        to_tensor = T.ToTensor()
        out = to_tensor(composite)

        # Add batch dimension to match original input
        out = out.unsqueeze(0)

        # Rearrange back to [B, H, W, C] to match input format
        out = out.permute(0, 2, 3, 1)

        return (out,)


class IToolsLoadImages:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "images_directory": ("STRING", {"multiline": False}),
            "load_limit": ("INT", {"default": 4, "min": 2, "max": 200})
        }}

    RETURN_TYPES = ('IMAGE', "STRING")
    RETURN_NAMES = ('images', 'images names')
    FUNCTION = 'load_images'
    CATEGORY = 'iTools'
    OUTPUT_IS_LIST = (True, True)
    DESCRIPTION = ("Will return list of images from a given directory with a given limit, for example if the limit is "
                   "4 it will return first 4 images in that directory. it will also return the list of these images "
                   "names.")

    def load_images(self, images_directory, load_limit):
        image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'}

        images_path = Path(images_directory.replace('"', ''))
        if not images_path.exists():
            raise FileNotFoundError(f"Image directory {images_directory} does not exist")

        images = []
        images_names = []
        for image_path in images_path.iterdir():
            if image_path.suffix.lower() in image_extensions:
                images.append(img_to_tensor(Image.open(image_path)))
                images_names.append(image_path.stem)  # Add the image name without extension
                if len(images) >= load_limit:
                    break

        return images, images_names


# A dictionary that contains all nodes you want to export with their names
# NOTE: names should be globally unique
NODE_CLASS_MAPPINGS = {
    "iToolsLoadImagePlus": IToolsLoadImagePlus,
    "iToolsPromptLoader": IToolsPromptLoader,
    "iToolsPromptSaver": IToolsPromptSaver,
    "iToolsAddOverlay": IToolsAddOverlay,
    "iToolsLoadImages": IToolsLoadImages
}

# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = {
    "iToolsLoadImagePlus": "iTools Load Image Plus",
    "iToolsPromptLoader": "iTools Prompt Loader",
    "iToolsPromptSaver": "iTools Prompt Saver",
    "iToolsAddOverlay": "iTools Add Text Overlay",
    "iToolsLoadImages": "iTools Load Images"
}
