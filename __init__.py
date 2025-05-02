import json
import os
import folder_paths # type: ignore
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

def get_user_dev_mode2():
    try:
        ud_dir = os.path.join(folder_paths.base_path, "user", "default")
        settings_file = os.path.join(ud_dir, 'comfy.settings.json')
        with open(settings_file, 'r') as file:
            settings = json.load(file)
        return settings.get('iTools.Nodes.Dev Mode2', False)
    except (OSError, json.JSONDecodeError, AttributeError):
        return False

allow_beta_nodes = get_user_dev_mode()
allow_dev_nodes = get_user_dev_mode2()
allow_experimental_nodes = True

if allow_beta_nodes:
    try:
        from .experimental.experimental_nodes import *
        
        NODE_CLASS_MAPPINGS["iToolsPaintNode"] = IToolsPaintNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsPaintNode"] = "iTools Paint Node (Beta)"

        NODE_CLASS_MAPPINGS["iToolsCropImage"] = IToolsCropImage
        NODE_DISPLAY_NAME_MAPPINGS["iToolsCropImage"] = "iTools Crop Image (Beta)"

    except ModuleNotFoundError as e:
        pass
        #print(e)

if allow_dev_nodes:
    try:
        from .experimental.experimental_nodes import *
        
        NODE_CLASS_MAPPINGS["iToolsTestNode"] = IToolsTestNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsTestNode"] = "iTools Test Node (Dev)"
        
        NODE_CLASS_MAPPINGS["iToolsDomNode"] = IToolsDomNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsDomNode"] = "iTools Dom Node (Dev)"

    except ModuleNotFoundError as e:
        pass

if allow_experimental_nodes:
    try:
        from .experimental.experimental_nodes import *
                
        NODE_CLASS_MAPPINGS["iToolsFreeChat"] = IToolsFreeChat
        NODE_DISPLAY_NAME_MAPPINGS["iToolsFreeChat"] = "iTools Free Chat (API)"
        
        NODE_CLASS_MAPPINGS["iToolsFreeSchnell"] = IToolsFreeSchnell
        NODE_DISPLAY_NAME_MAPPINGS["iToolsFreeSchnell"] = "iTools Free Schnell (API)"
        
    except ModuleNotFoundError as e:
        pass

WEB_DIRECTORY = "./web"
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']



