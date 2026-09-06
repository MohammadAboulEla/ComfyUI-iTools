class IToolsPromptRecord:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "text": (
                    "STRING",
                    {"default": "", "multiline": True, "placeholder": "text"},
                ),
                "timeline_data": ("STRING", {"default": ""}),
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "text_entry"
    OUTPUT_NODE = True
    CATEGORY = "iTools"
    DESCRIPTION = (
        "Tracks your prompts during node execution or when using ▶ button.\n"
        "Provides quick access to previously used prompts. "
        "Includes a history system that saves your favorite prompts."
    )

    def text_entry(self, text, timeline_data=""):
        return {"ui": {"text": text}, "result": (text,)}
