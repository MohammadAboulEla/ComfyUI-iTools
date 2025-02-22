import json
import os
import folder_paths
from .iTools_nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

def get_user_dev_mode():
    try:
        ud_dir = os.path.join(folder_paths.base_path, "user", "default")
        settings_file = os.path.join(ud_dir, 'comfy.settings.json')
        with open(settings_file, 'r') as file:
            settings = json.load(file)
        return settings.get('iTools.Nodes.Dev Mode', True)
    except (OSError, json.JSONDecodeError, AttributeError):
        return True

allow_test_nodes = get_user_dev_mode()


if allow_test_nodes:
    try:
        from .experimental.experimental_nodes import *
        
        NODE_CLASS_MAPPINGS["iToolsTestNode"] = IToolsTestNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsTestNode"] = "iTools Test Node (Dev)"

        NODE_CLASS_MAPPINGS["iToolsPaintNode"] = IToolsPaintNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsPaintNode"] = "iTools Paint Node (Beta)"
        
        NODE_CLASS_MAPPINGS["iToolsFreeSchnell"] = IToolsFreeSchnell
        NODE_DISPLAY_NAME_MAPPINGS["iToolsFreeSchnell"] = "iTools Free Schnell (Beta)"
        
        NODE_CLASS_MAPPINGS["iToolsCropImage"] = IToolsCropImage
        NODE_DISPLAY_NAME_MAPPINGS["iToolsCropImage"] = "iTools Crop Image (Beta)"

    except ModuleNotFoundError as e:
        pass
        #print(e)

WEB_DIRECTORY = "./web"
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']



