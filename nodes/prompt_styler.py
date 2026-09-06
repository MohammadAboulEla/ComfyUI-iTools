from ..backend.prompter import read_replace_and_combine, templates
from ..backend.shared import styles


class IToolsPromptStyler:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text_positive": ("STRING", {"default": "", "multiline": True}),
                "text_negative": ("STRING", {"default": "", "multiline": False}),
                "style_file": (styles, {"default": "basic.yaml"}),
                "template_name": (templates,),
            },
        }

    @classmethod
    def VALIDATE_INPUTS(cls, template_name):
        # YOLO, anything goes!
        return True

    def IS_CHANGED(text_positive, text_negative, template_name, style_file):
        if template_name == "random":
            return float("nan")  # Force re-execution if template is "random"

    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("positive_prompt", "negative_prompt", "used_template")
    FUNCTION = "prompt_styler"
    CATEGORY = "iTools"
    DESCRIPTION = (
        "Helps you quickly populate your prompt using a template stored in YAML file."
    )

    def prompt_styler(self, text_positive, text_negative, template_name, style_file):
        positive_prompt, negative_prompt, used_template = read_replace_and_combine(
            template_name, text_positive, text_negative, style_file
        )
        return positive_prompt, negative_prompt, used_template
