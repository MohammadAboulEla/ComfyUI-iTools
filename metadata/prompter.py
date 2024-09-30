from server import PromptServer
from aiohttp import web
from .shared import *


file_name = "basic.yaml"
file_path = os.path.join(p, f"ComfyUi-iTools\styles\{file_name}")
yaml_data = load_yaml_data(file_path)
templates = read_styles(yaml_data)


def read_replace_and_combine(template_name, positive_prompt, negative_prompt, file_name):
    p = folder_paths.folder_names_and_paths["custom_nodes"][0][0]
    file_path = os.path.join(p, f"ComfyUi-iTools\styles\{file_name}")

    _yaml_data = load_yaml_data(file_path)

    try:
        # Ensure the data is a list of templates
        if not isinstance(_yaml_data, list):
            raise ValueError("Invalid data. Expected a list of templates.")

        # Iterate over each template in the YAML data
        for template in _yaml_data:
            # Skip if the template does not have 'name' or 'prompt' fields
            if 'name' not in template or 'prompt' not in template:
                continue

            # If the template name matches, process it
            if template['name'] == template_name:
                # Replace {prompt} in the positive prompt if present
                if template['prompt'] and "{prompt}" in template['prompt']:
                    positive_prompt = template['prompt'].replace("{prompt}", positive_prompt)
                else:
                    positive_prompt = f"{positive_prompt}, {template['prompt']}"

                # Handle negative prompts
                yaml_negative_prompt = template.get('negative_prompt', "")
                if yaml_negative_prompt and negative_prompt:
                    negative_prompt = f"{yaml_negative_prompt}, {negative_prompt}"
                elif yaml_negative_prompt:
                    negative_prompt = yaml_negative_prompt  # Only YAML negative prompt
                # If both are empty, negative_prompt remains empty

                return clean_text(positive_prompt), clean_text(negative_prompt)

        # If no matching template is found, raise an error
        raise ValueError(f"No template found with name '{template_name}'.")

    except ValueError as ve:
        raise ve  # Propagate specific errors for better debugging
    except Exception as e:
        raise RuntimeError(f"An unexpected error occurred: {str(e)}")


@PromptServer.instance.routes.post('/itools/style_change')
async def respond_to_js_message(request):
    global file_name
    global file_path
    global yaml_data
    global templates

    post = await request.post()
    file_name = post.get('message')
    # print("Post received", file_name)

    file_path = os.path.join(p, f"ComfyUi-iTools\styles\{file_name}")
    yaml_data = load_yaml_data(file_path)
    templates = read_styles(yaml_data)

    data = {"new_templates": templates}
    return web.json_response(data=data)



if __name__ == '__main__':
    # # Get the current file parent directory
    # p = Path(__file__).resolve().parent.parent
    # # Join with the relative path to 'styles/example.yaml'
    # file_path = p / 'styles' / 'example.yaml'
    #
    # # Read yaml from file
    # y_data = load_yaml_data(file_path)
    # # Retrieve styles from JSON data
    # styles = read_replace_and_combine(y_data, "2D Game Art", "test_positive", "test_negative")
    # print(styles)
    ...
