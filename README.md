## iTools

<table>
  <tr>
    <td style="border: none; vertical-align: top; padding-right: 20px;">
      <p><strong>Welcome to iTools</strong> – a comprehensive suite of productivity-enhancing nodes for ComfyUI! This collection transforms your workflow with powerful features including:</p>
      <ul>
        <li><strong>Smart Prompt Management</strong>: Advanced tools for reading, saving, and organizing your prompts</li>
        <li><strong>Intelligent Image Analysis</strong>: Extract prompts from generated images and analyze their metadata</li>
        <li><strong>Visual Comparison Tools</strong>: Compare and analyze your generations with precision</li>
        <li><strong>Template System</strong>: Streamline your workflow with the Prompt Styler, featuring customizable YAML templates</li>
        <li><strong>Real-time History Tracking</strong>: Never lose your creative progress with built-in prompt and image history</li>
        <li><strong>Enhanced Preview Features</strong>: Better visualization and comparison of your generations</li>
      </ul>
      <p>Whether you're a casual user or a power user, iTools provides the quality-of-life improvements you need to make your ComfyUI experience more efficient and enjoyable.</p>
    </td>
    <td style="border: none; vertical-align: top;">
      <img src="examples/iTools_a.webp" width="300" alt="iTools Preview" />
    </td>
  </tr>
</table>


## Nodes:
### **iTools Prompt Record 🪶:**

Tracks and records your prompts during workflow execution. Features a Timeline system that saves your prompt history between sessions, allowing you to quickly access and reuse previously successful prompts. Includes favorites management and prompt organization tools.

[![Watch the video](https://github.com/user-attachments/assets/99c55c91-f71d-4f5c-9067-cd5966cc9a75)](https://github.com/user-attachments/assets/99c55c91-f71d-4f5c-9067-cd5966cc9a75)

---
### **iTools Image Preview 🍿:**

Enhanced image preview node with built-in history tracking. Allows you to cycle through previously generated images and compare them side by side. Features quick access buttons for history navigation and image comparison.

[![Watch the video](https://github.com/user-attachments/assets/07acb50c-afca-4668-9073-75ea2c11895d)](https://github.com/user-attachments/assets/07acb50c-afca-4668-9073-75ea2c11895d)

---
### **iTools Image Compare 🔍:**

Advanced image comparison node that helps you analyze differences between images. Supports side-by-side comparison, overlay mode, and difference highlighting to easily spot changes between generations.

[![Watch the video](https://github.com/user-attachments/assets/f979194e-9ae1-4805-bb2f-67c22a216499)](https://github.com/user-attachments/assets/f979194e-9ae1-4805-bb2f-67c22a216499)

---
### **iTools Paint Node:**  

The iTools Paint node is currently in beta and functions as a standalone project. It may be the most complex node in ComfyUI, and future updates could break its functionality. However, I will strive to keep it working. All custom widget code was built from scratch specifically for ComfyUI and this node. It supports painting, compositing, remove background, text editing, and pasting images from the clipboard, making it the fastest mini Photoshop for ComfyUI.  

Compositing Example

[![Watch the video](https://github.com/user-attachments/assets/29781d9e-cf7e-49b1-9f7c-7c70684fdd9b)](https://github.com/user-attachments/assets/29781d9e-cf7e-49b1-9f7c-7c70684fdd9b)  

Using shift-key to get under-cursor pixel color

[![Watch the video](https://github.com/user-attachments/assets/7961aba8-1cfb-4493-bcad-500ca49f0297)](https://github.com/user-attachments/assets/7961aba8-1cfb-4493-bcad-500ca49f0297)

Add text to the canvas

[![Watch the video](https://github.com/user-attachments/assets/c0515b70-48a7-4b70-b3fa-080fb877cee5)](https://github.com/user-attachments/assets/c0515b70-48a7-4b70-b3fa-080fb877cee5)

Reset size and rotation when double-clicking the image

[![Watch the video](https://github.com/user-attachments/assets/1b21a05d-0c0d-4986-a577-5442c90cbffe)](https://github.com/user-attachments/assets/1b21a05d-0c0d-4986-a577-5442c90cbffe)  

#### **Features:**  
- **`Load image key`** – Will load an image from your desk to the canvas.
- **`Add text key`** - Will add custom text to the canvas.
- **`Paste image key`** - Will paste last copied image from the clipboard.
#### **UI buttons:**  
- **`canvas key`** – Sets the canvas size.  
- **`fill key`** – Fills the canvas with the selected color.  
- **`clear key`** – Clears the currently selected layer.  
- **`hold key`** – Saves the current state of the node (quick save).  
- **`fetch key`** – Restores the saved state of the node (quick load).  

#### **Shortcuts:**  
- **`Shift`** – Eyedropper tool for picking colors under the cursor while painting.  
- **`Alt`** – Stamps an image onto the background or foreground layer.  
- **`Alt`** (while the color picker is visible) – Swaps the position of the color palette.
- **`Double Click`** – Will Reset selecting image or text rotation.  
---
### **iTools Image Loader Plus:**

is an enhancement of the original ComfyUI ImageLoader node. It attempts to return the possible prompt used to create an image. If the prompt isn't found directly, this node will search for the prompt within the following supported nodes in the workflow:

  - `CLIPTextEncodeSDXL`
  - `CLIPTextEncode`
  - `easy positive`
  - `easy showAnything`
  - `ShowText|pysssss`
  - `Eff. Loader SDXL`
  - `SDXLPromptStyler`
  - `iToolsPromptStyler`
  - `iToolsPromptStylerExtra`

If your prompt is within any of these nodes, you will be able to retrieve it. The `ShowText|pysssss` node is a convenient addition that you can integrate it into any workflow to make sure it will be retrieved by `iTools ImageLoaderPlus`.

![iTools ImageLoaderPlus](examples/Screenshot1.jpg)
---
### **iTools Prompt Styler 🖌️:**

Helps you quickly populate your {prompt} using a template name stored in a yaml file. I chose yaml over json because it will be easier for the user to read, edit it or to add his own templates, it will load all yaml files in the styles folder, so you may add your unlimited files there and easily add your own templates.

![iTools Prompt Styler](examples/Screenshot21.jpg)
---
### **iTools Prompt Styler Extra 🖌️🖌️:**

Like iTools Prompt Styler, but you can mix up to 4 styles from up to 4 yaml files. check examples folder for basic workflow for this node.

![iTools Prompt Styler Extra](examples/Screenshot6.jpg)

`Example:` here are some examples you just use "cute cat" as a prompt and let `iTools Prompt Styler Extra` do the magic of mixing 4 different styles togather.
![iTools Prompt Styler Extra](examples/Screenshot7.jpg)

---
### **iTools Prompt Loader:**

will try to load a prompt from a txt file, you need to provide a full path to a .txt file or try to use the default prompt.txt one is the examples folder, the node will return the prompt at given index (line number) note that count start from zero.

---
### **iTools Prompt Saver:**

will append the given prompt as a new line to the given file, provide a full path to a .txt file or try to use the default prompt.txt one.

---
### **iTools Add Text Overlay:**

will add an overlay bottom bar to show a given text, you may change the background color of the overlay bar and the font size.

`Example 1:` add text overlay
![iTools Add Text Overlay](examples/Screenshot2.jpg)
`Example 2:` add full prompt
![iTools Add Text Overlay](examples/Screenshot4.jpg)
`Example 3:` change background color and font size
![iTools Add Text Overlay](examples/Screenshot3.jpg)
**Edit:** iTools Add Text Overlay has been updated, and now you can add the text over or under the image

`Example:` Add text if overlay off: 
![iTools Add Text Overlay](examples/Screenshot22.jpg)

---
### **iTools Load Images:**

will return list of images from a given directory with a given limit, for example if the limit is 4 it will return first 4 images in that directory.it will also return the list of these images names.

![iTools Add Text Overlay](examples/Screenshot5.jpg)

---
### **iTools Grid Filler:**

Arranging a set of images into specified rows and columns, applying optional spacing and background color.

`Example1:` when one image provided.
![iTools Grid Filler](examples/Screenshot13.jpg)

`Example2:` when multi-images provided
![iTools Grid Filler](examples/Screenshot14.jpg)

---
### **iTools KSampler:**

Identical to the original KSampler, but additionally provides the settings used to generate the image and the execution time.

![iTools KSampler](examples/Screenshot15.jpg)
---
### **iTools Line Loader:**

Will return a line from a multi line text at given index, help ypu make your own list of words or prompts and load them one by one or randomized.

![iTools Line Loader](examples/Screenshot9.jpg)
---
### **iTools Text Replacer:**

A text replacer tool that might also be useful.

`Example1:` with line loader tool you may quickly paste your prompts in lines and load them one by one or randomized, then you combine it with text replacer to get prompt variations. The total count of lines will be returned, allowing it to be used as a batch counter.
![iTools Text Replacer](examples/Screenshot10.jpg)

`Example2:` Another example useful for randomization: with two lists of just 5 elements each, you can get up to 25 possible outputs
![iTools Text Replacer](examples/Screenshot11.jpg)

`Example3:` With three lists you get up to 125 possible outputs
![iTools Text Replacer](examples/Screenshot12.jpg)

---
### **iTools Vae Preview:**

Merges VAE decoding and image preview into one node, The goal of `iTools Vae Preview`  is to Decode & Preview the image at same node, so you do not have to use the `VAEDecod` node every time before preview an image.
![iTools Vae Preview](examples/Screenshot16.jpg)

---
### **iTools Checkerboard:**

Generates chessboard-like patterns, either in black and white or with random colors.

![iTools Checkerboard](examples/Screenshot18.jpg)

`Example1:`
![iTools Checkerboard](examples/Screenshot17.jpg)

`Example2:`
![iTools Checkerboard](examples/Screenshot19.jpg)

---
### **iTools Regex Editor:**

A powerful regex pattern and text manipulation node. Helps you create, or quickly apply regular expressions to your prompts or any text input in real-time.

![iTools Regex Editor](examples/Screenshot20.jpg)

---

_Wait for more..._

Support me on PayPal

[![Donate](https://img.shields.io/badge/Support-PayPal-blue.svg)](https://paypal.me/mohammadmoustafa1)

