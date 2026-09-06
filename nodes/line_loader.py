class IToolsLineLoader:

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "lines": ("STRING", {"default": "cat\ndog\nbunny", "multiline": True}),
                "seed": (
                    "INT",
                    {
                        "default": 0,
                        "control_after_generate": True,
                        "min": 0,
                        "max": 0xFFF,
                    },
                ),
            }
        }

    CATEGORY = "iTools"

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("line loaded", "count")
    FUNCTION = "load_line"
    DESCRIPTION = (
        "Will return a line from a multi line text at given "
        "index, note that count start from zero."
    )

    def load_line(self, lines, seed, fallback="Yes"):
        # Split the multiline string into individual lines
        line_list = lines.splitlines()

        # Count the total number of lines
        count = len(line_list)

        # Check if the seed index is valid
        if 0 <= seed < count:
            line = line_list[seed]
        elif fallback == "Yes" and count > 0:
            # If fallback is "Yes", mod the seed by the line count to wrap around
            seed_mod = seed % count
            line = line_list[seed_mod]
        else:
            # If the index is out of range and no fallback, return an empty string
            line = ""

        return line, count
