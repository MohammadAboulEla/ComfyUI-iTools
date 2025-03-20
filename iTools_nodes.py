import hashlib
import os
import time
from pathlib import Path
import random
from PIL.PngImagePlugin import PngInfo
import comfy.samplers
import folder_paths
import node_helpers
import numpy as np
import torch
from PIL import Image, ImageSequence, ImageOps
from .backend.checker_board import ChessTensor, ChessPattern
from nodes import common_ksampler
import json
from .backend.file_handeler import FileHandler
from .backend.grid_filler import fill_grid_with_images_new, tensor_to_images, image_to_tensor
from .backend.metadata_extractor import get_prompt
from .backend.overlay import add_text_bar
from .backend.prompter import read_replace_and_combine, templates
from .backend.prompter_multi import combine_multi, templates_basic, templates_extra1, templates_extra2, \
    templates_extra3
from .backend.shared import styles, tensor2pil, pil2tensor, project_dir
from comfy.cli_args import args


class IToolsLoadImagePlus:
    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]
        return {"required":
                    {"image": (sorted(files), {"image_upload": True})},
                }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE", "MASK", "STRING", "STRING")
    RETURN_NAMES = ("IMAGE", "MASK", "possible prompt", "image name")
    FUNCTION = "load_image"
    DESCRIPTION = ("An enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt "
                   "used to create an image.")

    def load_image(self, image):
        image_path = folder_paths.get_annotated_filepath(image)
        filename = image.rsplit('.', 1)[0]  # get image name
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
        return (output_image, output_mask, output_prompt, filename)

    @classmethod
    def IS_CHANGED(cls, image):
        image_path = folder_paths.get_annotated_filepath(image)
        m = hashlib.sha256()
        with open(image_path, 'rb') as f:
            m.update(f.read())
        return m.digest().hex()

    @classmethod
    def VALIDATE_INPUTS(cls, image):
        if not folder_paths.exists_annotated_filepath(image):
            return "Invalid image file: {}".format(image)

        return True


class IToolsPromptLoader:

    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                "file_path": ("STRING", {"default": 'prompts.txt', "multiline": False}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffff}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("prompt", "count")
    FUNCTION = "load_file"
    DESCRIPTION = ("Will return a prompt (line number) from txt file at given "
                   "index, note that count start from zero.")

    def load_file(self, file_path, seed, fallback="Yes"):
        prompt = ""
        count = 0
        if file_path == "prompts.txt":
            file = os.path.join(project_dir, "examples", "prompts.txt")
        else:
            file = file_path.replace('"', '')
        if os.path.exists(file):
            fh = FileHandler(file)
            try:
                count = fh.len_lines()
                line = fh.read_line(seed)
                prompt = fh.unescape_quotes(line)
            except IndexError:
                if fallback == "Yes":
                    seed = seed % fh.len_lines()
                    line = fh.read_line(seed)
                    prompt = fh.unescape_quotes(line)
        else:
            prompt = f"File not exist, {file}"
        return prompt, count


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
    DESCRIPTION = "Will append the given prompt as a new line to the given txt file"

    def save_to_file(self, file_path, prompt):
        if file_path == "prompts.txt":
            file = os.path.join(project_dir, "examples", "prompts.txt")
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


class IToolsPromptStyler:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text_positive": ("STRING", {"default": "", "multiline": True}),
                "text_negative": ("STRING", {"default": "", "multiline": False}),
                "style_file": (styles, {"default": "basic.yaml"}),
                "template_name": (templates,),
            },
        }

    @classmethod
    def VALIDATE_INPUTS(cls, template_name):
        # YOLO, anything goes!
        return True
    
    def IS_CHANGED(text_positive, text_negative, template_name, style_file):
        if template_name == "random":
            return float("nan")  # Force re-execution if template is "random"


    RETURN_TYPES = ('STRING', 'STRING',)
    RETURN_NAMES = ('positive_prompt', 'negative_prompt',)
    FUNCTION = 'prompt_styler'
    CATEGORY = 'iTools'
    DESCRIPTION = "Helps you quickly populate your prompt using a template stored in YAML file."

    def prompt_styler(self, text_positive, text_negative, template_name, style_file):
        positive_prompt, negative_prompt = read_replace_and_combine(template_name, text_positive,
                                                                    text_negative, style_file)
        return positive_prompt, negative_prompt


class IToolsAddOverlay:
    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                "image": ("IMAGE", {}),
                "text": ("STRING", {"default": 'img info:', "multiline": False}),
                "background_color": ("STRING", {"default": '#000000AA', "multiline": False}),
                "font_size": ("INT", {"default": 40, "min": 10, "max": 1000}),
                "overlay_mode": ("BOOLEAN", {"default": True}),
            }
        }

    CATEGORY = "iTools"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "add_text_overlay"
    DESCRIPTION = ("Will add an overlay bottom bar to show a given text, you may change the background color of the "
                   "overlay bar and the font size.")
    
    def add_text_overlay(self, image, text, font_size, background_color, overlay_mode):
              
        # Convert image to tensor
        pil_image = tensor2pil(image)

        # Add overlay or underlay
        if overlay_mode:
            composite = add_text_bar(pil_image, text, font_size=font_size, background_color=background_color,position="overlay")
        else:
            composite = add_text_bar(pil_image, text, font_size=font_size, background_color=background_color,position="underlay")

        # Convert back to tensor
        out = pil2tensor(composite)

        return (out,)


class IToolsLoadImages:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "images_directory": ("STRING", {"multiline": False}),
            "start_index": ("INT", {"default": 0, "min": 0, "max": 200}),
            "load_limit": ("INT", {"default": 4, "min": 2, "max": 200})
        }}

    RETURN_TYPES = ('IMAGE', "STRING", "INT")
    RETURN_NAMES = ('images', 'images names', 'count')
    FUNCTION = 'load_images'
    CATEGORY = 'iTools'
    OUTPUT_IS_LIST = (True, True, False)
    DESCRIPTION = ("Will return list of images from a given directory with a given limit, for example if the limit is "
                   "4 it will return first 4 images in that directory. it will also return the list of these images "
                   "names.")

    def load_images(self, images_directory, load_limit, start_index):
        image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'}
        images_path = Path(images_directory.replace('"', ''))

        if not images_path.exists():
            raise FileNotFoundError(f"Image directory {images_directory} does not exist")

        images = []
        images_names = []
        for idx, image_path in enumerate(images_path.iterdir()):
            if idx < start_index:
                continue  # Skip images until reaching the start_index
            if image_path.suffix.lower() in image_extensions:
                images.append(pil2tensor(Image.open(image_path)))
                images_names.append(image_path.stem)  # Add the image name without extension
                if len(images) >= load_limit:
                    break

        return images, images_names, len(images)


class IToolsPromptStylerExtra:

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text_positive": ("STRING", {"default": "", "multiline": True}),
                "text_negative": ("STRING", {"default": "", "multiline": False}),
                "base_file": ((styles), {"default": "basic.yaml"}),
                "base_style": ((templates_basic),),
                "second_file": ((styles), {"default": "camera.yaml"}),
                "second_style": ((templates_extra1),),
                "third_file": ((styles), {"default": "artist.yaml"}),
                "third_style": ((templates_extra2),),
                "fourth_file": ((styles), {"default": "mood.yaml"}),
                "fourth_style": ((templates_extra3),),
            },
        }

    @classmethod
    def VALIDATE_INPUTS(cls,
                        base_style,
                        second_style,
                        third_style,
                        fourth_style):
        # YOLO, anything goes!
        return True

    def IS_CHANGED(text_positive, text_negative,
                   base_file, base_style,
                   second_file,second_style,
                   third_file,third_style,
                   fourth_file,fourth_style
                   ):
        if base_style == "random" or second_style == "random" or third_style == "random" or fourth_style== "random":
            return float("nan")  # Force re-execution if template is "random"

    RETURN_TYPES = ('STRING', 'STRING', 'STRING',)
    RETURN_NAMES = ('positive_prompt', 'negative_prompt', 'used_templates')
    FUNCTION = 'prompt_styler_extra'
    CATEGORY = 'iTools'
    DESCRIPTION = ("Helps you quickly populate your prompt using templates from up to 4 YAML files.")

    def prompt_styler_extra(self, text_positive, text_negative,
                            base_file, base_style,
                            second_file, second_style,
                            third_file, third_style,
                            fourth_file, fourth_style,
                            ):
        positive_prompt, negative_prompt, _templates = combine_multi(
            text_positive, text_negative,
            base_file, base_style,
            second_file, second_style,
            third_file, third_style,
            fourth_file,
            fourth_style, )
        return positive_prompt, negative_prompt, _templates


class IToolsGridFiller:

    @classmethod
    def INPUT_TYPES(s):
        directions = ["rows", "cols"]
        return {"required":
            {
                "images": ("IMAGE", {}),
                "width": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "rows": ("INT", {"default": 3, "min": 1, "max": 10}),
                "cols": ("INT", {"default": 3, "min": 1, "max": 10}),
                "gaps": ("FLOAT", {"default": 2, "min": 0.0, "max": 50, "steps": 1}),
                "background_color": ("STRING", {"default": '#000000AA', "multiline": False}),
                "fill_direction": (directions, {"default": directions[0]}),
            }
        }

    RETURN_TYPES = ('IMAGE',)
    RETURN_NAMES = ('images',)
    FUNCTION = 'fill_grid'
    CATEGORY = 'iTools'
    INPUT_IS_LIST = (True, False, False, False, False, False, False)
    OUTPUT_IS_LIST = (False, False, False, False, False, False, False)
    DESCRIPTION = ("Arranging a set of images into specified rows and columns, applying "
                   "optional spacing and background color")

    def fill_grid(self, images, width, height, rows, cols, gaps, background_color, fill_direction):
        # Convert tensor to Pillow images
        pillow_images = tensor_to_images(images)

        # Process images using the provided function
        processed_image = fill_grid_with_images_new(pillow_images, rows=rows, cols=cols, grid_size=(width, height),
                                                    gap=gaps,
                                                    bg_color=background_color, direction=fill_direction[0])
        print("fill_direction",fill_direction)
        # Convert the processed Pillow image back to a tensor
        output_tensor = image_to_tensor(processed_image)

        return (output_tensor,)


class IToolsLineLoader:

    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                "lines": ("STRING", {"default": 'cat\ndog\nbunny', "multiline": True}),
                "seed": ("INT", {"default": 0, "control_after_generate": "increment", "min": 0, "max": 0xfff}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("line loaded", "count")
    FUNCTION = "load_line"
    DESCRIPTION = ("Will return a line from a multi line text at given "
                   "index, note that count start from zero.")

    def load_line(self, lines, seed, fallback="Yes"):
        # Split the multiline string into individual lines
        line_list = lines.splitlines()

        # Count the total number of lines
        count = len(line_list)

        # Check if the seed index is valid
        if 0 <= seed < count:
            line = line_list[seed]
        elif fallback == "Yes" and count > 0:
            # If fallback is "Yes", mod the seed by the line count to wrap around
            seed_mod = seed % count
            line = line_list[seed_mod]
        else:
            # If the index is out of range and no fallback, return an empty string
            line = ""

        return line, count


class IToolsTextReplacer:

    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                "text_in": ("STRING", {"forceInput": True, "multiline": False}),
                "match": ("STRING", {"forceInput": False, "multiline": False}),
                "replace": ("STRING", {"forceInput": False, "multiline": False}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text_out",)
    FUNCTION = "replace_text"
    DESCRIPTION = "Help you replace a match in a given text."

    def replace_text(self, text_in, match, replace):
        print(text_in)
        return text_in.replace(match, replace),


class IToolsKSampler:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "model": ("MODEL", {"tooltip": "The model used for denoising the input latent."}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff,
                                 "tooltip": "The random seed used for creating the noise."}),
                "steps": ("INT", {"default": 20, "min": 1, "max": 10000,
                                  "tooltip": "The number of steps used in the denoising process."}),
                "cfg": ("FLOAT", {"default": 8.0, "min": 0.0, "max": 100.0, "step": 0.1, "round": 0.01,
                                  "tooltip": "The Classifier-Free Guidance scale balances creativity and adherence to the prompt. Higher values result in images more closely matching the prompt however too high values will negatively impact quality."}),
                "sampler_name": (comfy.samplers.KSampler.SAMPLERS, {
                    "tooltip": "The algorithm used when sampling, this can affect the quality, speed, and style of the generated output."}),
                "scheduler": (comfy.samplers.KSampler.SCHEDULERS,
                              {"tooltip": "The scheduler controls how noise is gradually removed to form the image."}),
                "positive": ("CONDITIONING", {
                    "tooltip": "The conditioning describing the attributes you want to include in the image."}),
                "negative": ("CONDITIONING", {
                    "tooltip": "The conditioning describing the attributes you want to exclude from the image."}),
                "latent_image": ("LATENT", {"tooltip": "The latent image to denoise."}),
                "denoise": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01,
                                      "tooltip": "The amount of denoising applied, lower values will maintain the structure of the initial image allowing for image to image sampling."}),
            }
        }

    RETURN_TYPES = ("LATENT", "STRING")
    RETURN_NAMES = ("LATENT", "INFO")
    OUTPUT_TOOLTIPS = ("The denoised latent.",)
    FUNCTION = "sample"

    CATEGORY = "iTools"
    DESCRIPTION = ("Identical to the original KSampler, but additionally provides the settings used to generate the "
                   "image and the execution time.")

    def sample(self, model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image, denoise=1.0):
        start_time = time.time()
        result = common_ksampler(model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image,
                                 denoise=denoise)
        end_time = time.time()
        execution_time = f"{end_time - start_time:.3f}s"

        info = f"time:{execution_time} "
        info += f"seed:{seed} "
        info += f"steps:{steps} "
        info += f"cfg:{cfg} "
        info += f"sampler:{sampler_name} "
        info += f"scheduler:{scheduler} "

        return result[0], info


class IToolsVaePreview:
    def __init__(self):
        self.output_dir = folder_paths.get_temp_directory()
        self.type = "temp"
        self.prefix_append = "_temp_" + ''.join(random.choice("abcdefghijklmnopqrstupvxyz") for x in range(5))
        self.compress_level = 1

    @classmethod
    def INPUT_TYPES(cls):
        return {"required":
            {
                # "images": ("IMAGE", ),
                "samples": ("LATENT", {"tooltip": "The latent to be decoded."}),
                "vae": ("VAE", {"tooltip": "The VAE model used for decoding the latent."}),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "vae_preview"

    OUTPUT_NODE = True

    CATEGORY = "iTools"
    DESCRIPTION = "Merges VAE decoding and image preview into one node."

    def vae_preview(self, samples, vae, filename_prefix="ComfyUI", prompt=None, extra_pnginfo=None, ):
        return_options = (vae.decode(samples["samples"]),)
        images = return_options[0]
        filename_prefix += self.prefix_append
        full_output_folder, filename, counter, subfolder, filename_prefix = folder_paths.get_save_image_path(
            filename_prefix, self.output_dir, images[0].shape[1], images[0].shape[0])
        results = list()
        for (batch_number, image) in enumerate(images):
            i = 255. * image.cpu().numpy()
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
            img.save(os.path.join(full_output_folder, file), pnginfo=metadata, compress_level=self.compress_level)
            results.append({
                "filename": file,
                "subfolder": subfolder,
                "type": self.type
            })
            counter += 1

        return {"ui": {"images": results}, "result": return_options}


class IToolsCheckerBoard:
    def __init__(self):
        ...

    @classmethod
    def INPUT_TYPES(cls):
        return {"required":
            {
                "width": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "rows": ("INT", {"default": 9, "min": 1, "max": 128}),
                "cols": ("INT", {"default": 9, "min": 1, "max": 128}),
                "pattern": (ChessPattern.to_list(), {"default": ChessPattern.to_list()[1]}),
                "is_colored": ("BOOLEAN", {"default": False}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xfff}),
            },
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    FUNCTION = "generate_checkerboard"
    # OUTPUT_NODE = True
    CATEGORY = "iTools"
    DESCRIPTION = "Generates chessboard-like patterns, either in black and white or with random colors"

    def generate_checkerboard(self, width, height, rows, cols, pattern, is_colored, seed):

        _tensor = ChessTensor(width=width, height=height, rows=rows, cols=cols,
                              pattern=ChessPattern.from_string(pattern), colored=is_colored)
        _img = pil2tensor(_tensor.pil_img)

        _mask = _img[:, :, :, 0]
        return _img, _mask

class IToolsLoadRandomImage:

    @classmethod
    def INPUT_TYPES(s):
        default_dir = folder_paths.output_directory
        return {"required": {
            "images_directory": ("STRING", {"default": default_dir, "multiline": False}),
            # "load_limit": ("INT", {"default": 100, "min": 2, "max": 200}),
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xfff}),
        }}

    RETURN_TYPES = ('IMAGE', "STRING",)
    RETURN_NAMES = ('image', 'image name',)
    FUNCTION = 'load_random_image'
    CATEGORY = 'iTools'
    DESCRIPTION = "Will return image from a given directory. it will also return the name of these image."

    def load_random_image(self, images_directory, seed):
        image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'}
        images_path = Path(images_directory.replace('"', ''))

        if not images_path.exists():
            raise FileNotFoundError(f"Image directory {images_directory} does not exist")

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

class IToolsPreviewText:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "text": ("STRING", {"forceInput": True}),
            },
                "hidden": {
                "unique_id": "UNIQUE_ID",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ('text',)
    FUNCTION = 'preview_text'
    CATEGORY = 'iTools'
    DESCRIPTION = "Will show text from string input."
    INPUT_IS_LIST = True
    OUTPUT_NODE = True
    OUTPUT_IS_LIST = (True,)
    
    def preview_text(s, text,extra_pnginfo,unique_id):
        if unique_id is not None and extra_pnginfo is not None:
            if not isinstance(extra_pnginfo, list):
                print("Error: extra_pnginfo is not a list")
            elif (
                not isinstance(extra_pnginfo[0], dict)
                or "workflow" not in extra_pnginfo[0]
            ):
                print("Error: extra_pnginfo[0] is not a dict or missing 'workflow' key")
            else:        
                workflow = extra_pnginfo[0]["workflow"]
                node = next((x for x in workflow["nodes"] if str(x["id"]) == str(unique_id[0])),
                            None,)
                if node:
                    node["widgets_values"] = [text]

        return {"ui": {"text": text}, "result": (text,)}
    
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
    "iToolsPreviewText": IToolsPreviewText
}

# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = {
    "iToolsLoadImagePlus": "iTools Load Image 🏕️",
    "iToolsPromptLoader": "iTools Prompt Loader",
    "iToolsPromptSaver": "iTools Prompt Saver",
    "iToolsAddOverlay": "iTools Add Text Overlay",
    "iToolsLoadImages": "iTools Load Images 📦",
    "iToolsPromptStyler": "iTools Prompt Styler 🖌️",
    "iToolsPromptStylerExtra": "iTools Prompt Styler Extra 🖌️",
    "iToolsGridFiller": "iTools Grid Filler 📲",
    "iToolsLineLoader": "iTools Line Loader",
    "iToolsTextReplacer": "iTools Text Replacer",
    "iToolsKSampler": "iTools KSampler",
    "iToolsVaePreview": "iTools Vae Preview ⛳",
    "iToolsCheckerBoard": "iTools Checkerboard 🏁",
    "iToolsLoadRandomImage": "iTools Load Random Image 🎲",
    "iToolsPreviewText": "iTools Text Preview"
}
