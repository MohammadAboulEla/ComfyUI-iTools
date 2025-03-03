import base64
from PIL import Image, ImageSequence, ImageOps
import io
from ..backend.shared import pil2tensor, project_dir
import os
from server import PromptServer
from aiohttp import web
import json
import folder_paths
import node_helpers
import numpy as np
import torch
import hashlib


def install_package(package):
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])


def base64_to_pil(base64_string):
    header, encoded = base64_string.split(",", 1)  # Remove the data URL header
    image_data = base64.b64decode(encoded)
    return Image.open(io.BytesIO(image_data))


class MyCustomError(Exception):
    def __init__(self, message="Something went wrong"):
        super().__init__(message)


class IToolsFreeSchnell:

    def __init__(self):
        ud_dir = os.path.join(folder_paths.base_path, "user", "default")
        settings_file = os.path.join(ud_dir, "comfy.settings.json")

        with open(settings_file, "r") as file:
            settings = json.load(file)

        self.together_api = settings.get("iTools.Nodes. together.ai Api Key", "None")

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"forceInput": True}),
                "width": ("INT", {"default": 1024, "min": 0, "max": 2048}),
                "height": ("INT", {"default": 1024, "min": 0, "max": 2048}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xFFFFFFFF}),
                # "batch": ("INT", {"default": 1, "min": 1, "max": 8}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "generate_image"
    DESCRIPTION = "Will return free Flux-Schnell image from a together.ai free API"

    def generate_image(self, prompt, width, height, seed):
        # check if together is available
        try:
            from together import Together  # type: ignore
        except ImportError:
            install_package("together")

        api_key = (
            self.together_api
            if self.together_api and self.together_api != "None"
            else os.environ.get("TOGETHER_API_KEY")
        )

        try:
            client = Together(api_key=api_key)
        except Exception as e:
            # If the first key fails, try the environment variable
            api_key = (
                os.environ.get("TOGETHER_API_KEY")
                if api_key != os.environ.get("TOGETHER_API_KEY")
                else None
            )
            if not api_key:
                raise MyCustomError(
                    "Invalid or missing API key.\n"
                    "Get a free key from together.ai and add it to iTools settings,\n"
                    "or set it in your environment as TOGETHER_API_KEY.\n"
                    "Don't forget to restart ComfyUI after adding your key."
                ) from e
            try:
                client = Together(api_key=api_key)
            except Exception as e:
                raise MyCustomError(
                    "Failed to initialize Together client with the fallback key."
                ) from e

        #   if not self.together_api or self.together_api == "None":
        #     if not os.environ.get('TOGETHER_API_KEY'):
        #         raise MyCustomError(
        #         "API key not found in iTools settings or in your environment.\n"
        #         "Get a free key from together.ai, then add it to iTools settings."
        #         )

        #     api_key = self.together_api if self.together_api != "None" else os.environ.get('TOGETHER_API_KEY')
        #     client = Together(api_key=api_key)

        response = client.images.generate(
            prompt=prompt,
            model="black-forest-labs/FLUX.1-schnell-Free",
            width=width,
            height=height,
            steps=4,
            n=1,
            seed=seed,
            response_format="b64_json",
        )
        images = []
        # # # Decode the base64 image
        image_data = base64.b64decode(response.data[0].b64_json)
        image = Image.open(io.BytesIO(image_data))
        images.append(pil2tensor(image))
        return images


class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


any_type = AnyType("*")


class FlexibleOptionalInputType(dict):
    def __init__(self, type):
        self.type = type

    def __getitem__(self, key):
        return (self.type,)

    def __contains__(self, key):
        return True


class IToolsTestNode:

    @classmethod
    def INPUT_TYPES(self):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("my_counter_string", "my_counter")
    FUNCTION = "test_func"
    DESCRIPTION = "The widgets and logic of this node runs in javascript code, only the result is sent to python class"

    def test_func(self, **kwargs):
        for key, value in kwargs.items():
            print(key, value)
            if key == "Click":
                Click = int(value)
        return str(Click), Click

class IToolsDomNode:

    @classmethod
    def INPUT_TYPES(self):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("my_string", "my_int")
    FUNCTION = "dom_func"
    DESCRIPTION = "a try to create dom object in nodes"

    def dom_func(self, **kwargs):
        counter = 0
        print("dom start")
        for key, value in kwargs.items():
            print("domFunc")
            print(key, value)
            if key == "counter":
                counter = int(value)
        return str(counter), counter


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
        for key, value in kwargs.items():
            if key == "crop" and value is not None:
                # print(f"key:{key} value:{value}")
                cropped_img = base64_to_pil(value["data"])

        image_path = folder_paths.get_annotated_filepath(image)
        # filename = image.rsplit('.', 1)[0]  # get image name
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
            result = [cropped_img]
            return pil2tensor(result)
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


@PromptServer.instance.routes.post("/itools/request_save_paint")
async def respond_to_request_save_paint(request):
    post = await request.post()

    # Get the uploaded files
    foreground_file = post.get("foreground")
    background_file = post.get("background")

    if not foreground_file or not background_file:
        return web.json_response(
            {"status": "error", "message": "Missing foreground or background file"},
            status=400,
        )

    # Define the directory where the images will be saved
    save_directory = os.path.join(project_dir, "backend")
    # os.makedirs(save_directory, exist_ok=True)

    # Save the foreground file
    foreground_path = os.path.join(save_directory, foreground_file.filename)
    with open(foreground_path, "wb") as f:
        f.write(foreground_file.file.read())

    # Save the background file
    background_path = os.path.join(save_directory, background_file.filename)
    with open(background_path, "wb") as f:
        f.write(background_file.file.read())

    return web.json_response(
        {
            "status": "success",
            "foreground": foreground_path,
            "background": background_path,
        }
    )


@PromptServer.instance.routes.post("/itools/request_the_paint_file")
async def respond_to_request_the_paint_file(request):
    post = await request.post()

    filename_prefix = post.get("filename_prefix")
    if not filename_prefix:
        return web.json_response(
            {"status": "error", "message": "Filename prefix is required"}, status=400
        )

    # Define the directory where the images are saved
    save_directory = os.path.join(project_dir, "backend")

    # Define file paths
    foreground_path = os.path.join(save_directory, f"{filename_prefix}_foreground.png")
    background_path = os.path.join(save_directory, f"{filename_prefix}_background.png")

    # Check if both files exist
    if not os.path.exists(foreground_path) or not os.path.exists(background_path):
        return web.json_response(
            {"status": "error", "message": "File not found"}, status=404
        )

    # Read the files
    with open(foreground_path, "rb") as fg_file:
        foreground_data = fg_file.read()

    with open(background_path, "rb") as bg_file:
        background_data = bg_file.read()

    return web.json_response(
        {
            "status": "success",
            "data": {
                "foreground": foreground_data.hex(),
                "background": background_data.hex(),
            },
        }
    )


@PromptServer.instance.routes.post("/itools/request_load_img")
async def respond_to_request_load_img(request):
    post = await request.post()

    filename_prefix = post.get("filename_prefix")
    if not filename_prefix:
        return web.json_response(
            {"status": "error", "message": "Filename prefix is required"}, status=400
        )

    # Define the directory where the images are saved
    save_directory = os.path.join(project_dir, "backend")

    # Define file paths
    img_path = os.path.join(save_directory, f"{filename_prefix}.png")

    # Check if both files exist
    if not os.path.exists(img_path):
        return web.json_response(
            {"status": "error", "message": "File not found"}, status=404
        )

    # Read the files
    with open(img_path, "rb") as fg_file:
        img_data = fg_file.read()

    return web.json_response(
        {
            "status": "success",
            "data": {
                "img": img_data.hex(),
            },
        }
    )


def removeBackground(input_path, output_path):
    # Try importing rembg
    try:
        from rembg import remove
    except ImportError:
        install_package("rembg[gpu]")
        from rembg import remove  # Retry the import after installation

    input_img = Image.open(input_path)
    output_img = remove(input_img)
    output_img.save(output_path)


@PromptServer.instance.routes.post("/itools/request_mask_img")
async def respond_to_request_mask_img(request):
    # Parse the multipart form data
    reader = await request.multipart()

    # Read the uploaded file
    field = await reader.next()  # Get the first field (should be "image")
    if field.name != "image":
        return web.json_response(
            {"status": "error", "message": "Invalid field name"}, status=400
        )

    # Define the save directory and ensure it exists
    save_directory = os.path.join(project_dir, "backend")

    # Define the temporary file path
    temp_file_path = os.path.join(save_directory, "uploaded_image.png")

    # Open the file in binary write mode and write the entire content
    with open(temp_file_path, "wb") as f:
        f.write(await field.read())

    # Process the saved file
    img_out = os.path.join(save_directory, "iToolsMaskedImg.png")
    removeBackground(temp_file_path, img_out)

    # Clean up the temporary file if needed
    if os.path.exists(temp_file_path):
        try:
            os.remove(temp_file_path)
        except Exception as e:
            pass

    return web.json_response(
        {
            "status": "success",
        }
    )


# DEPRECATED
# @PromptServer.instance.routes.post("/itools/request_mask_img")
# async def respond_to_request_mask_img(request):
#     post = await request.post()

#     img_path = post.get("img_path")

#     # Define the directory where the images are saved
#     save_directory = os.path.join(project_dir, "backend")

#     # Define file paths
#     img_out = os.path.join(save_directory, "iToolsMaskedImg.png")


#     # # Check if both files exist
#     # if not os.path.exists(img_path):
#     #     return web.json_response({"status": "error", "message": "File not found"}, status=404)

#     # save image to desk
#     removeBackground(img_path,img_out)

#     return web.json_response({
#         "status": "success",
#     })
