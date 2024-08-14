## iTools

The **iTools ImageLoaderPlus** is an enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt used to create an image. If the prompt isn't found directly, this node will search for the prompt within the following supported nodes in the workflow:

- `CLIPTextEncodeSDXL`
- `CLIPTextEncode`
- `easy positive`
- `ShowText|pysssss`
- `Eff. Loader SDXL`
- `SDXLPromptStyler`

If your prompt is within any of these nodes, you will be able to retrieve it. The `ShowText|pysssss` node is a convenient addition that you can integrate it into any workflow to make sure it will be retrieved by `iTools ImageLoaderPlus`.
![iTools ImageLoaderPlus](https://github.com/MohammadAboulEla/ComfyUI-iTools/blob/master/examples/Screenshot1.png)
