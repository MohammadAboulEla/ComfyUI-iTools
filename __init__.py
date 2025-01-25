from .iTools_nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
allow_test_nodes = True

if allow_test_nodes:
    try:
        from .experimental.experimental_nodes import *
        NODE_CLASS_MAPPINGS["iToolsTestNode"] = IToolsTestNode
        NODE_DISPLAY_NAME_MAPPINGS["iToolsTestNode"] = "iTools Test Node"

        NODE_CLASS_MAPPINGS["iToolsFreeSchnell"] = IToolsFreeSchnell
        NODE_DISPLAY_NAME_MAPPINGS["iToolsFreeSchnell"] = "iTools Free Schnell"

    except ModuleNotFoundError as e:
        pass
        #print(e)

WEB_DIRECTORY = "./web"
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']



