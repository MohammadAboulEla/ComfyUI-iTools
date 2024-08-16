## iTools
The iTools are some quality of life nodes, like read a possible prompt used to create an image, save a prompt to file as a new line, read prompts from a multiline file.

### Nodes:
**iTools Image Loader Plus** is an enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt used to create an image. If the prompt isn't found directly, this node will search for the prompt within the following supported nodes in the workflow:

  - `CLIPTextEncodeSDXL`
  - `CLIPTextEncode`
  - `easy positive`
  - `ShowText|pysssss`
  - `Eff. Loader SDXL`
  - `SDXLPromptStyler`

If your prompt is within any of these nodes, you will be able to retrieve it. The `ShowText|pysssss` node is a convenient addition that you can integrate it into any workflow to make sure it will be retrieved by `iTools ImageLoaderPlus`.

![iTools ImageLoaderPlus](https://github.com/MohammadAboulEla/ComfyUI-iTools/blob/master/examples/Screenshot1.jpg)

**iTools Prompt Loader:** will try to load a prompt from a txt file, you need to provide a full path to a .txt file or try use the default prompt.txt one is the examples folder, the node will return the prompt at given index (line number) not that count start from zero, node also will return a radom prompt from that file.

**iTools Prompt Saver:** will append the given prompt as a new line to the given file, provide a full path to a .txt file or try use the default prompt.txt one.

[![Watch the video](https://github.com/user-attachments/assets/22af7830-066f-498e-a90f-0513b56fa343)](https://github.com/user-attachments/assets/22af7830-066f-498e-a90f-0513b56fa343)

**iTools Add Text Overlay:** will add an overlay bottom bar to show a given text, you may change the background color of the overlay bar and the fon size

![iTools Add Text Overlay](https://github.com/MohammadAboulEla/ComfyUI-iTools/blob/master/examples/Screenshot2.jpg)

![iTools Add Text Overlay](https://github.com/MohammadAboulEla/ComfyUI-iTools/blob/master/examples/Screenshot3.jpg)