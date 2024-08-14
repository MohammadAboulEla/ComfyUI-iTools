## iTools

**iTools ImageLoaderPlus** is an enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt used to create an image. If the prompt isn't found directly, this node will search for the prompt within the following supported nodes in the workflow:

  - `CLIPTextEncodeSDXL`
  - `CLIPTextEncode`
  - `easy positive`
  - `ShowText|pysssss`
  - `Eff. Loader SDXL`
  - `SDXLPromptStyler`

If your prompt is within any of these nodes, you will be able to retrieve it. The `ShowText|pysssss` node is a convenient addition that you can integrate it into any workflow to make sure it will be retrieved by `iTools ImageLoaderPlus`.

![iTools ImageLoaderPlus](https://github.com/MohammadAboulEla/ComfyUI-iTools/blob/master/examples/Screenshot1.png)

**iTools PromptLoader:** will try to load a prompt from a txt file, you need to provide a full path to a .txt file or try use the default prompt.txt one is the examples folder, the node will return the prompt at given index (line number) not that count start from zero, node also will return a radom prompt from that file.

**iTools PromptSaver:** will append the given prompt as a new line to the given file, provide a full path to a .txt file or try use the default prompt.txt one.

[![Watch the video](https://github.com/user-attachments/assets/22af7830-066f-498e-a90f-0513b56fa343)](https://github.com/user-attachments/assets/22af7830-066f-498e-a90f-0513b56fa343)
