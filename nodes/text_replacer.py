class IToolsTextReplacer:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "text_in": ("STRING", {"forceInput": True, "multiline": False}),
                "match": ("STRING", {"forceInput": False, "multiline": False}),
                "replace": ("STRING", {"forceInput": False, "multiline": False}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text_out",)
    FUNCTION = "replace_text"
    DESCRIPTION = "Help you replace a match in a given text."

    def replace_text(self, text_in, match, replace):
        print(text_in)
        return (text_in.replace(match, replace),)
