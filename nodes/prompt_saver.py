import os
from ..backend.shared import FileHandler, project_dir


class IToolsPromptSaver:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"forceInput": True}),
                "file_path": ("STRING", {"default": "prompts.txt", "multiline": False}),
            }
        }

    CATEGORY = "iTools"
    RETURN_TYPES = ()
    OUTPUT_NODE = True
    FUNCTION = "save_to_file"
    DESCRIPTION = "Will append the given prompt as a new line to the given txt file"

    def save_to_file(self, file_path, prompt):
        if file_path == "prompts.txt":
            file = os.path.join(project_dir, "examples", "prompts.txt")
        else:
            file = file_path.replace('"', "")
        if os.path.exists(file) and prompt is not None and prompt != "":
            fh = FileHandler(file)
            try:
                fh.append_line(prompt)
                print(f"Prompt: {prompt} saved to {file}")
            except Exception as e:
                print(f"Error while writing the prompt: {e}")
        else:
            print(f"Error while writing the prompt")
        return (True,)
