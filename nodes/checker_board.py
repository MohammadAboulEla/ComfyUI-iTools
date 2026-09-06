from ..backend.checker_board import ChessTensor, ChessPattern
from ..backend.shared import pil2tensor


class IToolsCheckerBoard:
    def __init__(self): ...

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "width": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 8192}),
                "rows": ("INT", {"default": 9, "min": 1, "max": 128}),
                "cols": ("INT", {"default": 9, "min": 1, "max": 128}),
                "pattern": (
                    ChessPattern.to_list(),
                    {"default": ChessPattern.to_list()[1]},
                ),
                "is_colored": ("BOOLEAN", {"default": False}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xFFF}),
            },
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    FUNCTION = "generate_checkerboard"
    CATEGORY = "iTools"
    DESCRIPTION = "Generates chessboard-like patterns, either in black and white or with random colors"

    def generate_checkerboard(
        self, width, height, rows, cols, pattern, is_colored, seed
    ):

        _tensor = ChessTensor(
            width=width,
            height=height,
            rows=rows,
            cols=cols,
            pattern=ChessPattern.from_string(pattern),
            colored=is_colored,
        )
        _img = pil2tensor(_tensor.pil_img)

        _mask = _img[:, :, :, 0]
        return _img, _mask
