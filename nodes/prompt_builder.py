from ..backend.prompter import read_replace_and_combine
from ..backend.shared import FlexibleOptionalInputType, any_type


class IToolsPromptBuilder:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("prompt", "negative")
    FUNCTION = "process"
    CATEGORY = "iTools"
    OUTPUT_NODE = True

    def process(self, **kwargs):
        final_text = ""
        negative_text = ""
        if "PromptBuilderWidget" in kwargs:
            data = kwargs["PromptBuilderWidget"]
            prompt = data.get("prompt", "")
            negative = data.get("negative", "")
            category = data.get("category")
            style = data.get("style", "none")

            if style != "none" and category:
                # Merge if style is selected
                final_text, negative_text, _ = read_replace_and_combine(
                    style, prompt, negative, category
                )
                return {
                    "ui": {
                        "prompt": final_text,
                        "negative": negative_text,
                        "style": "none",
                    },
                    "result": (final_text, negative_text),
                }
            else:
                final_text = prompt
                negative_text = negative
        return {
            "ui": {"prompt": final_text, "negative": negative_text},
            "result": (final_text, negative_text),
        }

    def IS_CHANGED(**kwargs):
        if "PromptBuilderWidget" in kwargs:
            data = kwargs["PromptBuilderWidget"]
            style = data.get("style", "none")
            print("ITOOLS_PROMPT_BUILDER_STYLE", style)
            if style == "random":
                return float("nan")  # Force re-execution if template is "random"
            return False
