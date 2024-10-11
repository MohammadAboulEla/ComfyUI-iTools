from .iTools_nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
allow_test_nodes = False

if allow_test_nodes:
    try:
        from .excluded.experimental_nodes import *
        NODE_CLASS_MAPPINGS["iToolsTestNode"] = IToolsTestNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsTestNode"] = "iTools Test Node"

        NODE_CLASS_MAPPINGS["iToolsFreeSchnell"] = IToolsFreeSchnell
        NODE_DISPLAY_NAME_MAPPINGS["iToolsFreeSchnell"] = "iTools Free Schnell"

    except ModuleNotFoundError as e:
        pass

WEB_DIRECTORY = "./web"
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']



