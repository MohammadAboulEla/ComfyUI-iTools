## iTools
The iTools are some quality of life nodes, like read a possible prompt used to create an image, save a prompt to file as a new line, read prompts from a multiline file. and the newly amazing prompt styler node that will help you quickly populate your {prompt} using a template name stored in an easily editable yaml file.

![iTools Welcome](examples/iTools_a.webp)
### Nodes:
**# iTools Image Loader Plus:** is an enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt used to create an image. If the prompt isn't found directly, this node will search for the prompt within the following supported nodes in the workflow:

  - `CLIPTextEncodeSDXL`
  - `CLIPTextEncode`
  - `easy positive`
  - `ShowText|pysssss`
  - `Eff. Loader SDXL`
  - `SDXLPromptStyler`

If your prompt is within any of these nodes, you will be able to retrieve it. The `ShowText|pysssss` node is a convenient addition that you can integrate it into any workflow to make sure it will be retrieved by `iTools ImageLoaderPlus`.

![iTools ImageLoaderPlus](examples/Screenshot1.jpg)

**# iTools Prompt Styler 🖌️:** Helps you quickly populate your {prompt} using a template name stored in a yaml file. I chose yaml over json because it will be easier for the user to read, edit it or to add his own templates, it will load all yaml files in the styles folder, so you may add your unlimited files there and easily add your own templates.
![iTools Prompt Styler](examples/prompt_styler.jpg)

**# iTools Prompt Styler Extra 🖌️🖌️:** Like iTools Prompt Styler, but you can mix up to 4 styles from up to 4 yaml files. check examples folder for basic workflow for this node.
![iTools Prompt Styler Extra](examples/Screenshot6.jpg)

`Example:` here are some examples you just use "cute cat" as a prompt and let `iTools Prompt Styler Extra` do the magic of mixing 4 different styles togather.
![iTools Prompt Styler Extra](examples/Screenshot7.jpg)

**# iTools Prompt Loader:** will try to load a prompt from a txt file, you need to provide a full path to a .txt file or try to use the default prompt.txt one is the examples folder, the node will return the prompt at given index (line number) note that count start from zero.

**# iTools Prompt Saver:** will append the given prompt as a new line to the given file, provide a full path to a .txt file or try to use the default prompt.txt one.

[![Watch the video](https://github.com/user-attachments/assets/22af7830-066f-498e-a90f-0513b56fa343)](https://github.com/user-attachments/assets/22af7830-066f-498e-a90f-0513b56fa343)

**# iTools Add Text Overlay:** will add an overlay bottom bar to show a given text, you may change the background color of the overlay bar and the font size.

`Example 1:` add text overlay
![iTools Add Text Overlay](examples/Screenshot2.jpg)
`Example 2:` add full prompt
![iTools Add Text Overlay](examples/Screenshot4.jpg)
`Example 3:` change background color and font size
![iTools Add Text Overlay](examples/Screenshot3.jpg)
**Edit:** iTools Add Text Overlay has been updated, and now you can add the text over or under the image

`Example:` Add text if overlay off: 
![iTools Add Text Overlay](examples/overlay_preview.jpg)

**# iTools Load Images:** will return list of images from a given directory with a given limit, for example if the limit is 4 it will return first 4 images in that directory.it will also return the list of these images names.
![iTools Add Text Overlay](examples/Screenshot5.jpg)

Wait for more...

Support me on PayPal

[![Donate](https://img.shields.io/badge/Support-PayPal-blue.svg)](https://paypal.me/mohammadmoustafa1)

