import re


class IToolsRegexNode:
    @classmethod
    def INPUT_TYPES(s):
        patterns = [
            "custom",
            "contains_hello",
            "cat_or_dog",
            "starts_with_abc",
            "ends_with_xyz",
            "any_character",
            "digit",
            "non_digit",
            "whitespace",
            "non_whitespace",
            "word_character",
            "non_word_character",
            "all_caps",
            "all_lower",
            "integer",
            "floating_point",
            "no_numbers",
            "email",
            "phone_number",
            "double_quoted",
            "double_quoted_plus",
            "single_quoted",
            "single_quoted_plus",
            "in_parentheses",
            "in_parentheses_plus",
            "angle_brackets",
            "angle_brackets_plus",
        ]

        return {
            "required": {
                "text_in": ("STRING", {"forceInput": True, "multiline": False}),
                "regex_pattern": (
                    "STRING",
                    {"default": "", "forceInput": False, "multiline": False},
                ),
                "pattern_picker": (patterns, {"default": "custom"}),
                "replace_match": ("STRING", {"forceInput": False, "multiline": False}),
                "replace_non_match": (
                    "STRING",
                    {"forceInput": False, "multiline": False},
                ),
            }
        }

    CATEGORY = "iTools"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("match",)
    FUNCTION = "match_text"
    DESCRIPTION = "Uses Regex to find, match, or modify text. Returns matches if no replacement is set, otherwise, replaces matches or non-matches as specified."

    def match_text(
        self, text_in, regex_pattern, pattern_picker, replace_match, replace_non_match
    ):
        matches = re.findall(regex_pattern, text_in)  # Find all matches

        if replace_match == "" and replace_non_match == "":
            result = "".join(matches)
            return (result.strip(),)  # ok do not change
        elif replace_match != "" and replace_non_match == "":
            # Replace all matches globally
            result = re.sub(regex_pattern, replace_match, text_in)
            return (result.strip(),)  # ok do not change
        elif replace_non_match != "" and replace_match == "":
            # Replace all non-matching parts with replace_non_match
            parts = []
            last_end = 0
            for match in re.finditer(regex_pattern, text_in):
                start, end = match.span()
                parts.append(replace_non_match)  # Non-matching part before the match
                parts.append(text_in[start:end])  # Matching part
                last_end = end
            parts.append(replace_non_match)  # Non-matching part after the last match
            result = "".join(parts)
            return (result.strip(),)
        else:
            # Replace matches with replace_match and non-matches with replace_non_match
            parts = []
            last_end = 0
            for match in re.finditer(regex_pattern, text_in):
                start, end = match.span()
                if last_end < start:
                    parts.append(
                        replace_non_match
                    )  # Non-matching part before the match
                parts.append(replace_match)  # Replace the match
                last_end = end
            if last_end < len(text_in):
                parts.append(
                    replace_non_match
                )  # Non-matching part after the last match
            result = "".join(parts)
            return (result.strip(),)
