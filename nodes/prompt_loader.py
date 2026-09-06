import os
from ..backend.shared import FileHandler, project_dir


class IToolsPromptLoader:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "file_path": ("STRING", {"default": "prompts.txt", "multiline": False}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xFFFF}),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("prompt", "count")
    FUNCTION = "load_file"
    DESCRIPTION = (
        "Will return a prompt (line number) from txt file at given "
        "index, note that count start from zero."
    )

    def load_file(self, file_path, seed, fallback="Yes"):
        prompt = ""
        count = 0
        if file_path == "prompts.txt":
            file = os.path.join(project_dir, "examples", "prompts.txt")
        else:
            file = file_path.replace('"', "")
        if os.path.exists(file):
            fh = FileHandler(file)
            try:
                count = fh.len_lines()
                line = fh.read_line(seed)
                prompt = fh.unescape_quotes(line)
            except IndexError:
                if fallback == "Yes":
                    seed = seed % fh.len_lines()
                    line = fh.read_line(seed)
                    prompt = fh.unescape_quotes(line)
        else:
            prompt = f"File not exist, {file}"
        return prompt, count
