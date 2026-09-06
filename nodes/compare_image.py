from nodes import PreviewImage  # type: ignore


class IToolsCompareImage(PreviewImage):

    CATEGORY = "iTools"
    DESCRIPTION = "Compare A and B images"
    FUNCTION = "compare_images"
    OUTPUT_NODE = True

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "A": ("IMAGE",),
                "B": ("IMAGE",),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    def compare_images(
        self, A, B, filename_prefix=None, prompt=None, extra_pnginfo=None
    ):
        _a = self.save_images(
            A,
        )[
            "ui"
        ]["images"]
        _b = self.save_images(
            B,
        )[
            "ui"
        ]["images"]

        return {
            "ui": {"images": _a + _b}
        }
