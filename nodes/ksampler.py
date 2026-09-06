import time
import comfy.samplers  # type: ignore
from nodes import common_ksampler  # type: ignore


class IToolsKSampler:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "model": (
                    "MODEL",
                    {"tooltip": "The model used for denoising the input latent."},
                ),
                "seed": (
                    "INT",
                    {
                        "default": 0,
                        "min": 0,
                        "max": 0xFFFFFFFFFFFFFFFF,
                        "tooltip": "The random seed used for creating the noise.",
                    },
                ),
                "steps": (
                    "INT",
                    {
                        "default": 20,
                        "min": 1,
                        "max": 10000,
                        "tooltip": "The number of steps used in the denoising process.",
                    },
                ),
                "cfg": (
                    "FLOAT",
                    {
                        "default": 8.0,
                        "min": 0.0,
                        "max": 100.0,
                        "step": 0.1,
                        "round": 0.01,
                        "tooltip": "The Classifier-Free Guidance scale balances creativity and adherence to the prompt. Higher values result in images more closely matching the prompt however too high values will negatively impact quality.",
                    },
                ),
                "sampler_name": (
                    comfy.samplers.KSampler.SAMPLERS,
                    {
                        "tooltip": "The algorithm used when sampling, this can affect the quality, speed, and style of the generated output."
                    },
                ),
                "scheduler": (
                    comfy.samplers.KSampler.SCHEDULERS,
                    {
                        "tooltip": "The scheduler controls how noise is gradually removed to form the image."
                    },
                ),
                "positive": (
                    "CONDITIONING",
                    {
                        "tooltip": "The conditioning describing the attributes you want to include in the image."
                    },
                ),
                "negative": (
                    "CONDITIONING",
                    {
                        "tooltip": "The conditioning describing the attributes you want to exclude from the image."
                    },
                ),
                "latent_image": ("LATENT", {"tooltip": "The latent image to denoise."}),
                "denoise": (
                    "FLOAT",
                    {
                        "default": 1.0,
                        "min": 0.0,
                        "max": 1.0,
                        "step": 0.01,
                        "tooltip": "The amount of denoising applied, lower values will maintain the structure of the initial image allowing for image to image sampling.",
                    },
                ),
            }
        }

    RETURN_TYPES = ("LATENT", "STRING")
    RETURN_NAMES = ("LATENT", "INFO")
    OUTPUT_TOOLTIPS = ("The denoised latent.",)
    FUNCTION = "sample"

    CATEGORY = "iTools"
    DESCRIPTION = (
        "Identical to the original KSampler, but additionally provides the settings used to generate the "
        "image and the execution time."
    )

    def sample(
        self,
        model,
        seed,
        steps,
        cfg,
        sampler_name,
        scheduler,
        positive,
        negative,
        latent_image,
        denoise=1.0,
    ):
        start_time = time.time()
        result = common_ksampler(
            model,
            seed,
            steps,
            cfg,
            sampler_name,
            scheduler,
            positive,
            negative,
            latent_image,
            denoise=denoise,
        )
        end_time = time.time()
        execution_time = f"{end_time - start_time:.3f}s"

        info = f"time:{execution_time} "
        info += f"seed:{seed} "
        info += f"steps:{steps} "
        info += f"cfg:{cfg} "
        info += f"sampler:{sampler_name} "
        info += f"scheduler:{scheduler} "

        return result[0], info
