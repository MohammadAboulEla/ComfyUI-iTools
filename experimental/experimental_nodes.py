try:
    from together import Together
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "together"])
    from together import Together  # Retry the import after installation  
import base64
from PIL import Image
import io
from ..backend.shared import pil2tensor, project_dir
import os
from server import PromptServer
from aiohttp import web
import json
import folder_paths


class IToolsFreeSchnell:
    
    def __init__(self):
        ud_dir = os.path.join(folder_paths.base_path, "user","default")
        settings_file = os.path.join(ud_dir,'comfy.settings.json')
        
        with open(settings_file, 'r') as file:
            settings = json.load(file)

        self.together_api = settings.get('iTools.iTools TogetherApi', 'default_value')
        
        
    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                "prompt": ("STRING", {"forceInput":True}),
                "width": ("INT", {"default": 1024, "min": 0, "max": 2048}),
                "height": ("INT", {"default": 1024,"min": 0, "max": 2048}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffff}),
                # "batch": ("INT", {"default": 1, "min": 1, "max": 8}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "generate_image"
    DESCRIPTION = ("Will return free Flux-Schnell image from a together.ai free API")

    def generate_image(self, prompt, width, height,seed):
        
        # if self.together_api != "None":
        #     api_key = self.together_api
        # elif os.environ.get('TOGETHER_API_KEY'):
        #     api_key = os.environ.get('TOGETHER_API_KEY')
        # else:  
        #     api_key = None
            
        # Seems like free Schnell works with None
        client = Together(api_key = None)
        response = client.images.generate(
            prompt=prompt,
            model="black-forest-labs/FLUX.1-schnell-Free",
            width=width,
            height=height,
            steps=4,
            n=1,
            seed=seed,
            response_format="b64_json"
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
    return (self.type, )

  def __contains__(self, key):
    return True

class IToolsTestNode:
    
    @classmethod
    def INPUT_TYPES(self):
        return {
            "required":{},
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING","INT")
    RETURN_NAMES = ("my_counter_string","my_counter")
    FUNCTION = "test_func"
    DESCRIPTION = ("The widgets and logic of this node runs in javascript code, only the result is sent to python class")

    def test_func(self, **kwargs):
        for key, value in kwargs.items():
            print(key,value)
            if key == "Click":
                Click = int(value)
        return str(Click), Click

class IToolsPaintNode:
    
    @classmethod
    def INPUT_TYPES(self):
        return {
            "required":{},
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "paint_func"
    DESCRIPTION = ("Will paint")

    def paint_func(self, **kwargs):
        save_directory = os.path.join(project_dir, "backend")
        background_path = os.path.join(save_directory, "iToolsPaintedImage_background.png")
        foreground_path = os.path.join(save_directory, "iToolsPaintedImage_foreground.png")
        background_img = Image.open(background_path)
        foreground_img = Image.open(foreground_path)
        
        
        # Overlay the foreground onto the background
        final_img = Image.alpha_composite(background_img, foreground_img)
        
        final_img = final_img.convert("RGB")
        
        result = [final_img]        
        return pil2tensor(result)

    def IS_CHANGED(cls,):
        return True

@PromptServer.instance.routes.post("/itools/request_save_paint")
async def respond_to_request_save_paint(request):
    post = await request.post()

    # Get the uploaded files
    foreground_file = post.get("foreground")
    background_file = post.get("background")

    if not foreground_file or not background_file:
        return web.json_response({"status": "error", "message": "Missing foreground or background file"}, status=400)

    # Define the directory where the images will be saved
    save_directory = os.path.join(project_dir, "backend")
    #os.makedirs(save_directory, exist_ok=True)

    # Save the foreground file
    foreground_path = os.path.join(save_directory, foreground_file.filename)
    with open(foreground_path, "wb") as f:
        f.write(foreground_file.file.read())

    # Save the background file
    background_path = os.path.join(save_directory, background_file.filename)
    with open(background_path, "wb") as f:
        f.write(background_file.file.read())

    return web.json_response({
        "status": "success",
        "foreground": foreground_path,
        "background": background_path
    })
    
@PromptServer.instance.routes.post("/itools/request_the_paint_file")
async def respond_to_request_the_paint_file(request):
    post = await request.post()

    filename_prefix = post.get("filename_prefix")
    if not filename_prefix:
        return web.json_response({"status": "error", "message": "Filename prefix is required"}, status=400)

    # Define the directory where the images are saved
    save_directory = os.path.join(project_dir, "backend")

    # Define file paths
    foreground_path = os.path.join(save_directory, f"{filename_prefix}_foreground.png")
    background_path = os.path.join(save_directory, f"{filename_prefix}_background.png")

    # Check if both files exist
    if not os.path.exists(foreground_path) or not os.path.exists(background_path):
        return web.json_response({"status": "error", "message": "File not found"}, status=404)

    # Read the files
    with open(foreground_path, "rb") as fg_file:
        foreground_data = fg_file.read()

    with open(background_path, "rb") as bg_file:
        background_data = bg_file.read()

    return web.json_response({
        "status": "success",
        "data": {
            "foreground": foreground_data.hex(),
            "background": background_data.hex()
        }
    })      

@PromptServer.instance.routes.post("/itools/request_load_img")
async def respond_to_request_load_img(request):
    post = await request.post()

    filename_prefix = post.get("filename_prefix")
    if not filename_prefix:
        return web.json_response({"status": "error", "message": "Filename prefix is required"}, status=400)

    # Define the directory where the images are saved
    save_directory = os.path.join(project_dir, "backend")

    # Define file paths
    img_path = os.path.join(save_directory, f"{filename_prefix}.png")

    # Check if both files exist
    if not os.path.exists(img_path):
        return web.json_response({"status": "error", "message": "File not found"}, status=404)

    # Read the files
    with open(img_path, "rb") as fg_file:
        img_data = fg_file.read()

    return web.json_response({
        "status": "success",
        "data": {
            "img": img_data.hex(),
        }
    })

    