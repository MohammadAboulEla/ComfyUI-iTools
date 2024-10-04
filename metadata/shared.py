import yaml
import os
import folder_paths
import re


def clean_text_combined(text):
    # Combine the regular expressions into one to avoid multiple passes
    text = re.sub(r',(\S)|\s+,|,+|(\.,|,\.)', lambda m: ', ' if m.group(1) else '.' if m.group(2) else ',', text)

    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)

    # Strip leading and trailing spaces
    return text.strip()


def clean_text(text):
    # Remove duplicate commas
    text = re.sub(r',+', ',', text)

    # Replace any occurrence of " ," with ","
    text = re.sub(r'\s+,', ',', text)

    # Ensure there's a space after commas followed by a word without space
    text = re.sub(r',(\S)', r', \1', text)

    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)

    # Replace any occurrence of ".,", ",." with "."
    text = re.sub(r'\.,|,\.', '.', text)

    # Strip leading and trailing spaces
    return text.strip().replace(" .", ".")


def load_yaml_data(file_path):
    try:
        # Open the file with UTF-8 encoding
        with open(file_path, 'r', encoding='utf-8') as yaml_file:
            # Load YAML content as Python objects
            _yaml_data = yaml.safe_load(yaml_file)

        # Ensure the data is returned as a list
        if isinstance(_yaml_data, list):
            return _yaml_data
        else:
            raise ValueError("YAML content is not a list of objects.")

    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
    except yaml.YAMLError as e:
        print(f"Error: Invalid YAML format. {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

    return None


def get_yaml_names(folder_path):
    names = []

    for file_name in os.listdir(folder_path):
        if file_name.endswith(".yaml") or file_name.endswith(".yml"):
            names.append(file_name)

    return names


def read_styles(_yaml_data):
    if not isinstance(_yaml_data, list):
        print("Error: input data must be a list")
        return None

    names = []

    for item in _yaml_data:
        if isinstance(item, dict):
            if 'name' in item:
                names.append(item['name'])

    return names


p = folder_paths.folder_names_and_paths["custom_nodes"][0][0]
folder_path = os.path.join(p, "ComfyUI-iTools", "styles")
styles = get_yaml_names(folder_path)
