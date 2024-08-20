import random

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
from .metadata.overlay import add_overlay_bar


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
                "fallback": (["No", "Yes"], {"default": "No"}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "STRING",)
    RETURN_NAMES = ("Prompt at index", "Prompt random")
    FUNCTION = "load_file"

    def load_file(self, file_path, seed, fallback):
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
                    prompt = f"IndexError: Line {seed} is not available"
            try:
                r_index = random.randint(0, fh.len_lines() - 1)
                prompt_random = fh.unescape_quotes(fh.read_line(r_index))
            except IndexError:
                prompt = f"IndexError: Line {r_index} is not available"
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


# A dictionary that contains all nodes you want to export with their names
# NOTE: names should be globally unique
NODE_CLASS_MAPPINGS = {
    "iToolsLoadImagePlus": IToolsLoadImagePlus,
    "iToolsPromptLoader": IToolsPromptLoader,
    "iToolsPromptSaver": IToolsPromptSaver,
    "iToolsAddOverlay": IToolsAddOverlay
}

# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = {
    "iToolsLoadImagePlus": "iTools Load Image Plus",
    "iToolsPromptLoader": "iTools Prompt Loader",
    "iToolsPromptSaver": "iTools Prompt Saver",
    "iToolsAddOverlay": "iTools Add Text Overlay"
}
