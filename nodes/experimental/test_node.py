from ...backend.shared import FlexibleOptionalInputType, any_type


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
        Click = 0
        for key, value in kwargs.items():
            print(key, value)
            if key == "Click":
                Click = int(value)
        return str(Click), Click
