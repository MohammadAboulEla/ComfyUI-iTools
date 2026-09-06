import base64
import io as py_io
import json
import numpy as np  # type: ignore
import torch  # type: ignore
from PIL import Image, ImageEnhance  # type: ignore
from comfy_api.latest import io
import folder_paths  # type: ignore
import node_helpers  # type: ignore
from ..backend.shared import get_user_node_display_name_preferences


class IToolsImageAdjust(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        display_name = (
            "Image Adjustments 🎛️"
            if get_user_node_display_name_preferences()
            else "iTools Image Adjustments 🎛️"
        )
        return io.Schema(
            node_id="iToolsImageAdjust",  # same as node mapping
            display_name=display_name,
            category="iTools",
            description=(
                "Upload an image, right click to paste image from clipboard, or connect one from the workflow, then use the "
                "brightness and contrast sliders to adjust it. A connected IMAGE "
                "input takes priority over a manually uploaded image."
            ),
            inputs=[
                io.Image.Input(
                    "image",
                    optional=True,
                    tooltip="Optional IMAGE from another node. Takes priority over the uploaded image.",
                ),
                # widget_state stores all DOM widget values as a JSON string.
                # The JS extension removes the default text widget and replaces
                # it with the custom DOM widget (upload area + sliders).
                io.String.Input(
                    "widget_state",
                    default='{"brightness":0,"contrast":100,"saturation":100,"temperature":0,"gamma":100,"sharpness":100,"hue":0,"imagePath":""}',
                ),
            ],
            outputs=[
                io.Image.Output(display_name="image"),
            ],
        )

    @classmethod
    def execute(
        cls,
        widget_state: str = '{"brightness":0,"contrast":100,"saturation":100,"temperature":0,"gamma":100,"sharpness":100,"hue":0,"imagePath":""}',
        image=None,
    ) -> io.NodeOutput:
        state = json.loads(widget_state)
        processed_data = state.get("processedImageData", "")
        image_data     = state.get("imageData", "")
        image_path     = state.get("imagePath", "")

        MAX_BASE64_CHARS = 40 * 1024 * 1024  # ~30MB decoded payload cap
        MAX_IMAGE_DIMENSION = 8192  # Max width/height constraint against decompression bombs

        # Primary path: JS has already rendered all adjustments into processedImageData.
        # We just decode it — preview and output are guaranteed to match.
        if processed_data:
            if "," in processed_data:
                processed_data = processed_data.split(",", 1)[1]
            if len(processed_data) > MAX_BASE64_CHARS:
                raise ValueError("processedImageData exceeds the maximum allowed size")
            with Image.open(py_io.BytesIO(base64.b64decode(processed_data))) as img:
                if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
                    raise ValueError(f"processedImageData dimensions ({img.width}x{img.height}) exceed maximum allowed ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})")
                pil_img = img.convert("RGB")

        # Fallback: API / headless mode / optimal workflow path — JS does not send processedImageData bloat
        elif image is not None or image_data or image_path:
            if image is not None:
                if image.shape[1] > MAX_IMAGE_DIMENSION or image.shape[2] > MAX_IMAGE_DIMENSION:
                    raise ValueError(f"Image tensor dimensions exceed maximum allowed ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})")
                arr = (image[0].cpu().numpy() * 255).clip(0, 255).astype(np.uint8)
                pil_img = Image.fromarray(arr).convert("RGB")
            elif image_data:
                raw = image_data.split(",", 1)[1] if "," in image_data else image_data
                if len(raw) > MAX_BASE64_CHARS:
                    raise ValueError("imageData exceeds the maximum allowed size")
                with Image.open(py_io.BytesIO(base64.b64decode(raw))) as img:
                    if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
                        raise ValueError(f"imageData dimensions ({img.width}x{img.height}) exceed maximum allowed ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})")
                    pil_img = img.convert("RGB")
            elif image_path:
                full_path = folder_paths.get_annotated_filepath(image_path)
                img = node_helpers.pillow(Image.open, full_path)
                if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
                    raise ValueError(f"Image file dimensions ({img.width}x{img.height}) exceed maximum allowed ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})")
                pil_img = img.convert("RGB")

            brightness  = state.get("brightness",  0)   / 100.0
            contrast    = state.get("contrast",   100)  / 100.0
            saturation  = state.get("saturation", 100)  / 100.0
            temperature = state.get("temperature", 0)
            gamma       = state.get("gamma",      100)  / 100.0
            sharpness   = state.get("sharpness",  100)  / 100.0
            hue_shift   = state.get("hue",          0)

            pil_img = ImageEnhance.Brightness(pil_img).enhance(max(0.0, 1.0 + brightness))
            pil_img = ImageEnhance.Contrast(pil_img).enhance(max(0.0, contrast))
            pil_img = ImageEnhance.Color(pil_img).enhance(max(0.0, saturation))
            if temperature != 0:
                arr = np.array(pil_img).astype(np.float32)
                s = temperature / 100.0
                arr[:, :, 0] = np.clip(arr[:, :, 0] * (1.0 + s * 0.3), 0, 255)
                arr[:, :, 2] = np.clip(arr[:, :, 2] * (1.0 - s * 0.3), 0, 255)
                pil_img = Image.fromarray(arr.astype(np.uint8))
            if gamma != 1.0:
                arr = np.array(pil_img).astype(np.float32) / 255.0
                arr = np.power(np.clip(arr, 0, 1), 1.0 / max(gamma, 0.01))
                pil_img = Image.fromarray((arr * 255).astype(np.uint8))
            pil_img = ImageEnhance.Sharpness(pil_img).enhance(max(0.0, sharpness))
            if hue_shift != 0:
                hsv = np.array(pil_img.convert("HSV")).astype(np.int32)
                hsv[:, :, 0] = (hsv[:, :, 0] + int(hue_shift / 360.0 * 255)) % 256
                pil_img = Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")

        else:
            pil_img = Image.new("RGB", (512, 512), (64, 64, 64))

        out_arr = np.array(pil_img).astype(np.float32) / 255.0
        out_tensor = torch.from_numpy(out_arr).unsqueeze(0)
        return io.NodeOutput(out_tensor)
