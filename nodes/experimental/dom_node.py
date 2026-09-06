from ...backend.shared import FlexibleOptionalInputType, any_type


class IToolsDomNode:
    @classmethod
    def INPUT_TYPES(self):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("output",)
    FUNCTION = "dom_func"
    DESCRIPTION = "Example to create dom HTML object in nodes"
    OUTPUT_NODE = True

    def dom_func(self, **kwargs):
        counter = "0"
        text = ""
        for key, value in kwargs.items():
            if key == "CounterWidget":
                print(key, value)
                counter = str(value["count"]) or "0"
                text = value["text"] or ""
        return (str(text + " " + counter),)
