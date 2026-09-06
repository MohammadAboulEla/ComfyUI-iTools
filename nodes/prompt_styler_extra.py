from ..backend.prompter_multi import (
    combine_multi,
    templates_basic,
    templates_extra1,
    templates_extra2,
    templates_extra3,
)
from ..backend.shared import styles


class IToolsPromptStylerExtra:

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text_positive": ("STRING", {"default": "", "multiline": True}),
                "text_negative": ("STRING", {"default": "", "multiline": False}),
                "base_file": ((styles), {"default": "basic.yaml"}),
                "base_style": ((templates_basic),),
                "second_file": ((styles), {"default": "camera.yaml"}),
                "second_style": ((templates_extra1),),
                "third_file": ((styles), {"default": "artist.yaml"}),
                "third_style": ((templates_extra2),),
                "fourth_file": ((styles), {"default": "mood.yaml"}),
                "fourth_style": ((templates_extra3),),
            },
        }

    @classmethod
    def VALIDATE_INPUTS(cls, base_style, second_style, third_style, fourth_style):
        # YOLO, anything goes!
        return True

    def IS_CHANGED(
        text_positive,
        text_negative,
        base_file,
        base_style,
        second_file,
        second_style,
        third_file,
        third_style,
        fourth_file,
        fourth_style,
    ):
        if (
            base_style == "random"
            or second_style == "random"
            or third_style == "random"
            or fourth_style == "random"
        ):
            return float("nan")  # Force re-execution if template is "random"

    RETURN_TYPES = (
        "STRING",
        "STRING",
        "STRING",
    )
    RETURN_NAMES = ("positive_prompt", "negative_prompt", "used_templates")
    FUNCTION = "prompt_styler_extra"
    CATEGORY = "iTools"
    DESCRIPTION = "Helps you quickly populate your prompt using templates from up to 4 YAML files."

    def prompt_styler_extra(
        self,
        text_positive,
        text_negative,
        base_file,
        base_style,
        second_file,
        second_style,
        third_file,
        third_style,
        fourth_file,
        fourth_style,
    ):
        positive_prompt, negative_prompt, _templates = combine_multi(
            text_positive,
            text_negative,
            base_file,
            base_style,
            second_file,
            second_style,
            third_file,
            third_style,
            fourth_file,
            fourth_style,
        )
        return positive_prompt, negative_prompt, _templates
