import yaml
import os
import folder_paths
import re
import time
import numpy as np
import torch
from PIL import Image

cn = folder_paths.folder_names_and_paths["custom_nodes"][0][0]


def time_it(func, *args, **kwargs):
    start_time = time.time()  # Record start time
    result = func(*args, **kwargs)  # Call the passed function with arguments
    end_time = time.time()  # Record end time
    print(f"Execution time: {end_time - start_time:.6f} seconds")
    return result


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


def load_yaml_data(_file_path):
    try:
        # Open the file with UTF-8 encoding
        with open(_file_path, 'r', encoding='utf-8') as yaml_file:
            # Load YAML content as Python objects
            _yaml_data = yaml.safe_load(yaml_file)

        # Ensure the data is returned as a list
        if isinstance(_yaml_data, list):
            return _yaml_data
        else:
            raise ValueError("YAML content is not a list of objects.")

    except FileNotFoundError:
        print(f"Error: The file '{_file_path}' was not found.")
    except yaml.YAMLError as e:
        print(f"Error: Invalid YAML format. {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

    return None


def get_yaml_names(_folder_path):
    names = []

    for file_name in os.listdir(_folder_path):
        if file_name.endswith(".yaml") or file_name.endswith(".yml"):
            names.append(file_name)

    return names


styles = get_yaml_names(os.path.join(cn, "ComfyUI-iTools", "styles"))


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


def tensor2pil(image):
    return Image.fromarray(
        np.clip(255.0 * image.cpu().numpy().squeeze(), 0, 255).astype(np.uint8)
    )


# suggested by devs
def pil2tensor(image):
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)

def pil2tensor_2(image):
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(1)


def pil2tensor_3(image):
    # Convert the PIL image to a NumPy array and normalize it to [0, 1]
    image_array = np.array(image).astype(np.float32) / 255.0

    # Move the channel dimension to the last position if needed (e.g., for RGB images)
    if image_array.ndim == 2:  # Grayscale image, no channel dimension
        image_array = np.expand_dims(image_array, axis=-1)

    # Add a batch dimension at the start
    tensor = torch.from_numpy(image_array).unsqueeze(0)  # Shape: (1, w, h, c)

    return tensor



def pil2mask(image):
    # Convert grayscale image to numpy array
    numpy_array = torch.tensor(np.array(image), dtype=torch.float32)
    # Normalize to binary mask: 0 for transparent (or dark), 1 for opaque (or bright)
    mask = (numpy_array > 0).float()  # Converts values to 1 if > 0, otherwise 0
    # Adding a batch dimension
    if mask.dim() == 2:
        mask = mask.unsqueeze(0)  # Shape: [1, H, W]
    return mask

