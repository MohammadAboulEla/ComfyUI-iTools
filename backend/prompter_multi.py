from server import PromptServer
from aiohttp import web
from .shared import load_yaml_data, read_styles, clean_text, project_dir
import os
import random

file_name_basic = "basic.yaml"
file_path_basic = os.path.join(project_dir, "styles", file_name_basic)
yaml_data_basic = load_yaml_data(file_path_basic)
templates_basic = read_styles(yaml_data_basic)

file_name_extra1 = "camera.yaml"
file_path_extra1 = os.path.join(project_dir, "styles", file_name_extra1)
yaml_data_extra1 = load_yaml_data(file_path_extra1)
templates_extra1 = read_styles(yaml_data_extra1)

file_name_extra2 = "artist.yaml"
file_path_extra2 = os.path.join(project_dir, "styles", file_name_extra2)
yaml_data_extra2 = load_yaml_data(file_path_extra2)
templates_extra2 = read_styles(yaml_data_extra2)

file_name_extra3 = "mood.yaml"
file_path_extra3 = os.path.join(project_dir, "styles", file_name_extra3)
yaml_data_extra3 = load_yaml_data(file_path_extra3)
templates_extra3 = read_styles(yaml_data_extra3)


def get_template_value_from_yaml_file(file_name, template_name):
    positive_prompt = ""
    negative_prompt = ""
    file_path = os.path.join(project_dir, "styles", file_name)
    file_path2 = os.path.join(project_dir, "styles","more examples", file_name)
    _yaml_data = load_yaml_data(file_path) or load_yaml_data(file_path2)


    if template_name == "random":
        # Pick a random template
        available_templates = [t['name'] for t in _yaml_data if 'name' in t and 'prompt' in t and t['name'] != "random" and t['name'] != "none"]
        if not available_templates:
            raise ValueError("No valid templates found in the YAML file.")
        template_name = random.choice(available_templates)

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
                if template['prompt']:
                    positive_prompt = template['prompt']

                # Handle negative prompts
                yaml_negative_prompt = template.get('negative_prompt', "")
                if yaml_negative_prompt:
                    negative_prompt = yaml_negative_prompt
                return positive_prompt, negative_prompt, template_name

        # If no matching template is found, raise an error
        raise ValueError(f"No template found with name '{template_name}'.")

    except ValueError as ve:
        raise ve  # Propagate specific errors for better debugging
    except Exception as e:
        raise RuntimeError(f"An unexpected error occurred: {str(e)}")


def combine_multi(text_positive, text_negative,
                  base_file, base_style,
                  second_file, second_style,
                  third_file, third_style,
                  fourth_file, fourth_style, ):
    base_p, base_n, base_t = get_template_value_from_yaml_file(base_file, base_style)
    if "{prompt}" in base_p:
        base_p = base_p.replace("{prompt}", f"{text_positive}")
    else:
        base_p = f"{text_positive}. {base_p}"

    if base_p == "":
        base_p = text_positive
    if base_n == "":
        base_n = text_negative

    s2_p, s2_n, s2_t = get_template_value_from_yaml_file(second_file, second_style, )
    s2_p = s2_p.replace("of {prompt}", "").replace("{prompt}", "")
    s3_p, s3_n, s3_t = get_template_value_from_yaml_file(third_file, third_style, )
    s3_p = s3_p.replace("of {prompt}", "").replace("{prompt}", "")
    s4_p, s4_n, s4_t = get_template_value_from_yaml_file(fourth_file, fourth_style, )
    s4_p = s4_p.replace("of {prompt}", "").replace("{prompt}", "")

    total_p = f"{base_p},{s2_p},{s3_p},{s4_p}"
    total_n = f"{text_negative},{base_n},{s2_n},{s3_n},{s4_n}"

    def get_template_format(f, t, i):
        i = str(i)  # may use later for other formats
        if t != "none":
            return f"({f[:-5]}:{t})".replace(" | ", "|").replace(" > ", ">")
        else:
            return ""

    t1 = get_template_format(base_file, base_t, 1)
    t2 = get_template_format(second_file, s2_t, 2)
    t3 = get_template_format(third_file, s3_t, 3)
    t4 = get_template_format(fourth_file, s4_t, 4)
    _templates = f"{t1}{t2}{t3}{t4}"  # [:-1]
    
    return clean_text(total_p), clean_text(total_n), _templates


@PromptServer.instance.routes.post('/itools/request_templates_for_file')
async def respond_to_request_templates_for_file(request):
    post = await request.post()
    file_name = post.get("file_name")
    file_path = os.path.join(project_dir, "styles", file_name)
    file_path2 = os.path.join(project_dir, "styles","more examples", file_name)
    yaml_data = load_yaml_data(file_path) or load_yaml_data(file_path2)
    templates = read_styles(yaml_data)
    data = {"templates": templates}
    return web.json_response(data=data)


if __name__ == '__main__':
    ...
