try:
    from together import Together
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "together", "--no-deps"])
    from together import Together  # Retry the import after installation  
import base64
from PIL import Image
import io
from ..backend.shared import pil2tensor
import os
from server import PromptServer
import json
import folder_paths

class IToolsFreeSchnell:
    # user\default
    
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
        # Iterate through all generated images in the batch
        # for img_data in response.data:
        #     # Decode each base64 image
        #     image_data = base64.b64decode(img_data.b64_json)
        #     image = Image.open(io.BytesIO(image_data))

        #     # Convert the image to a tensor and append to the list
        #     images.append(pil2tensor(image))

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
    def INPUT_TYPES(s):
        return {"required":
            {
                "test": ("STRING", {"default": 'test', "multiline": False}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffff}),
            },
            "optional": FlexibleOptionalInputType(any_type),
            "hidden": {},
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("prompt", "count")
    FUNCTION = "test_func"
    DESCRIPTION = ("Will..")

    def test_func(self, test, seed, **kwargs):
        print("start test")
        prompt = f"{test}"
        for key, value in kwargs.items():
            print("key: ", key)
            print("value: ", value)
            if value:
                prompt += f"{value}"
        count = seed
        return prompt, count



