from ..backend.shared import FlexibleOptionalInputType, any_type


class IToolsInstructorNode:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("instruction",)
    FUNCTION = "process_instructions"
    CATEGORY = "iTools"
    OUTPUT_NODE = True

    def process_instructions(self, **kwargs):
        final_text = ""
        if "InstructorWidget" in kwargs:
            data = kwargs["InstructorWidget"]
            # Use the pre-assembled text from JS
            final_text = data.get("finalText", "")

        return (final_text,)
