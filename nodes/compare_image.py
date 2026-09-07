import os
import random
import json
import numpy as np  # type: ignore
from PIL import Image  # type: ignore
from PIL.PngImagePlugin import PngInfo  # type: ignore
import folder_paths  # type: ignore
from comfy.cli_args import args  # type: ignore
from comfy_api.latest import io
from ..backend.shared import get_user_node_display_name_preferences


class IToolsCompareImage(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        display_name = (
            "Image Compare 🔍"
            if get_user_node_display_name_preferences()
            else "iTools Image Compare 🔍"
        )
        return io.Schema(
            node_id="iToolsCompareImage",
            display_name=display_name,
            category="iTools",
            description="Compare A and B images with interactive split and lens modes.",
            inputs=[
                io.Image.Input("A", optional=True, tooltip="First image to compare."),
                io.Image.Input("B", optional=True, tooltip="Second image to compare."),
            ],
            outputs=[],
            is_output_node=True,
        )

    @classmethod
    def execute(
        cls,
        A=None,
        B=None,
        **kwargs,
    ) -> io.NodeOutput:
        if A is None:
            A = kwargs.get("A", kwargs.get("a", None))
        if B is None:
            B = kwargs.get("B", kwargs.get("b", None))

        output_dir = folder_paths.get_temp_directory()
        prefix_append = "_temp_" + "".join(
            random.choice("abcdefghijklmnopqrstupvxyz") for _ in range(5)
        )
        prompt = kwargs.get("prompt", None)
        extra_pnginfo = kwargs.get("extra_pnginfo", None)

        def save_tensor_images(images, label):
            if images is None:
                return []
            if isinstance(images, list):
                if len(images) == 0:
                    return []
                images = images[0]
            if not hasattr(images, "shape") or len(images.shape) < 3:
                return []
            if len(images.shape) == 3:
                images = images.unsqueeze(0)

            filename_prefix = f"ComfyUI_{label}" + prefix_append
            full_output_folder, filename, counter, subfolder, filename_prefix = (
                folder_paths.get_save_image_path(
                    filename_prefix, output_dir, images[0].shape[1], images[0].shape[0]
                )
            )
            results = []
            for batch_number, image in enumerate(images):
                i = 255.0 * image.cpu().numpy()
                img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
                metadata = None
                if not args.disable_metadata:
                    metadata = PngInfo()
                    if prompt is not None:
                        metadata.add_text("prompt", json.dumps(prompt))
                    if extra_pnginfo is not None:
                        for x in extra_pnginfo:
                            metadata.add_text(x, json.dumps(extra_pnginfo[x]))

                filename_with_batch_num = filename.replace("%batch_num%", str(batch_number))
                file = f"{filename_with_batch_num}_{counter:05}_.png"
                img.save(
                    os.path.join(full_output_folder, file),
                    pnginfo=metadata,
                    compress_level=1,
                )
                results.append(
                    {"filename": file, "subfolder": subfolder, "type": "temp"}
                )
                counter += 1
            return results

        results_a = save_tensor_images(A, "A")
        results_b = save_tensor_images(B, "B")

        return io.NodeOutput(
            ui={
                "itools_compare_a": results_a,
                "itools_compare_b": results_b,
                "itools_compare": results_a + results_b,
            }
        )
