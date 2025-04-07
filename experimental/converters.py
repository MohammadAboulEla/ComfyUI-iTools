import csv
import yaml
import json
import csv
import yaml
from collections import OrderedDict
from collections import defaultdict
import os

def json_to_yaml(json_file, yaml_file):
    result = []

    # Read the JSON file
    with open(json_file, 'r', encoding='utf-8') as jsonfile:
        data = json.load(jsonfile)

        for entry in data:
            # Construct the YAML format dictionary
            yaml_entry = {
                'name': entry['name'],
                'prompt': entry['prompt'],
                'negative_prompt': entry['negative_prompt']
            }
            result.append(yaml_entry)

    # Write the YAML file with an empty line after each entry
    with open(yaml_file, 'w', encoding='utf-8') as yamlfile:
        for entry in result:
            yaml.dump([entry], yamlfile, allow_unicode=True, default_flow_style=False)
            yamlfile.write('\n')  # Add an empty line after each entry


def csv_special_to_yaml(csv_file, yaml_file):
    result = []

    # Read the CSV file
    with open(csv_file, newline='', encoding='utf-8') as csvfile:
        # Using DictReader with a custom delimiter if necessary
        reader = csv.reader(csvfile)

        for row in reader:
            # Ignore lines starting with '|||'
            if row[0].startswith('|||'):
                continue

            # Ensure the row has enough columns
            if len(row) < 3:
                continue

            # Extract name (everything before the first comma)
            name = row[0].split(',')[0].strip()  # Get name before the first comma

            # Extract prompt and negative_prompt
            prompt = row[1].strip() if len(row) > 1 else ""
            negative_prompt = row[2].strip() if len(row) > 2 else ""

            # Skip if the name is empty
            if not name:
                print("Empty name found, skipping row:", row)
                continue

            # Construct the YAML format dictionary
            entry = {
                'name': name,
                'prompt': prompt,
                'negative_prompt': negative_prompt
            }
            result.append(entry)

    # Write the YAML file with an empty line after each entry
    with open(yaml_file, 'w', encoding='utf-8') as yamlfile:
        for entry in result:
            yaml.dump([entry], yamlfile, allow_unicode=True, default_flow_style=False)
            yamlfile.write('\n')  # Add an empty line after each entry


def csv_special_to_yaml_tagged(csv_file, yaml_file):
    result = []

    # Read the CSV file
    with open(csv_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)

        for row in reader:
            # Ignore lines starting with '|||'
            if row[0].startswith('|||'):
                continue

            # Ensure the row has enough columns
            if len(row) < 3:
                continue

            # Extract name (everything before the first comma)
            name = row[0].split(',')[0].strip()  # Get name before the first comma

            # Extract prompt and negative_prompt
            prompt = row[1].strip() if len(row) > 1 else ""
            negative_prompt = row[2].strip() if len(row) > 2 else ""

            # Insert " {prompt} " after the first comma in prompt
            if prompt:
                first_comma_index = prompt.find(',')
                if first_comma_index != -1:
                    prompt = prompt[:first_comma_index + 1] + " {prompt} " + prompt[first_comma_index + 1:]

            # Skip if the name is empty
            if not name:
                print("Empty name found, skipping row:", row)
                continue

            # Construct the YAML format dictionary
            entry = {
                'name': name,
                'prompt': prompt,
                'negative_prompt': negative_prompt
            }
            result.append(entry)

    # Write the YAML file with an empty line after each entry
    with open(yaml_file, 'w', encoding='utf-8') as yamlfile:
        for entry in result:
            yaml.dump([entry], yamlfile, allow_unicode=True, default_flow_style=False)
            yamlfile.write('\n')  # Add an empty line after each entry


def csv_to_yaml(csv_file, yaml_file):
    result = []

    # Read the CSV file
    with open(csv_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Construct the YAML format dictionary
            entry = {
                'name': row['name'],
                'negative_prompt': row['negative_prompt'],
                'prompt': row['prompt']
            }
            result.append(entry)

    # Write the YAML file with an empty line after each entry
    with open(yaml_file, 'w', encoding='utf-8') as yamlfile:
        for entry in result:
            yaml.dump([entry], yamlfile, allow_unicode=True, default_flow_style=False)
            yamlfile.write('\n')  # Add an empty line after each entry


def split_yaml_by_category(input_yaml_file, output_dir):
    # Read the original YAML file
    with open(input_yaml_file, 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)  # Load YAML data

    # Group entries by category
    categories = defaultdict(list)

    for entry in data:
        # Extract the category from the name
        name = entry['name']
        category = name.split('|')[0].strip()  # Get the part before '|'
        categories[category].append(entry)

    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Write each category to a separate YAML file
    for category, entries in categories.items():
        category_file_name = f"{category.replace(' ', '_')}.yaml"  # Create a file name
        category_file_path = os.path.join(output_dir, category_file_name)

        with open(category_file_path, 'w', encoding='utf-8') as category_file:
            for entry in entries:
                # Dump the entry into YAML format
                yaml_entry = yaml.dump([entry], allow_unicode=True, default_flow_style=False).strip()
                category_file.write(yaml_entry + '\n\n')  # Add an empty line after each entry


def clear_negative_prompts(input_yaml_file, output_yaml_file):
    # Read the YAML file
    with open(input_yaml_file, 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)

    # Loop through each entry and set 'negative_prompt' to an empty string
    for entry in data:
        if 'negative_prompt' in entry:
            entry['negative_prompt'] = ''

    # Write the modified YAML data back to a new file, ensuring an empty line between entries
    with open(output_yaml_file, 'w', encoding='utf-8') as file:
        for entry in data:
            yaml_entry = yaml.dump([entry], allow_unicode=True, default_flow_style=False).strip()
            file.write(yaml_entry + '\n\n')  # Add an empty line after each entry


def combine_yaml_from_directory(input_dir, output_file):
    combined_data = []

    # Get all .yaml files in the input directory
    yaml_files = [os.path.join(input_dir, file) for file in os.listdir(input_dir) if file.endswith('.yaml')]

    for file in yaml_files:
        with open(file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            combined_data.extend(data)

    # Write combined data into the output file with explicit newlines between entities
    with open(output_file, 'w', encoding='utf-8') as f:
        for entry in combined_data:
            yaml.dump([entry], f, sort_keys=False, allow_unicode=True, default_flow_style=False)
            f.write("\n")  # Ensure a newline after each entity

# adding file names
def combine_yaml_files(input_folder, output_file):
    combined_data = []

    # Iterate through all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".yaml") or filename.endswith(".yml"):
            file_path = os.path.join(input_folder, filename)
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    yaml_data = yaml.safe_load(file)

                    # Ensure yaml_data is a list of entities
                    if isinstance(yaml_data, list):
                        # Modify the 'name' field by prefixing the filename
                        for entity in yaml_data:
                            if 'name' in entity:
                                entity['name'] = f"{os.path.splitext(filename)[0]} | {entity['name']}"

                        # Add the modified entities to the combined data
                        combined_data.extend(yaml_data)

                except yaml.YAMLError as exc:
                    print(f"Error parsing {filename}: {exc}")

    # Write combined data to the output file with formatting
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for entity in combined_data:
            yaml.dump([entity], outfile, default_flow_style=False, sort_keys=False)
            outfile.write('\n')  # Ensure an empty line between entities


def reorder_yaml_by_name(input_file, output_file):
    # Load the YAML file
    with open(input_file, 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)

    # Sort the list by the 'name' key
    sorted_data = sorted(data, key=lambda x: x['name'].lower())

    # Write the sorted YAML back to the file with empty lines between entities
    with open(output_file, 'w', encoding='utf-8') as file:
        for index, item in enumerate(sorted_data):
            yaml.dump([item], file, allow_unicode=True, sort_keys=False)
            if index < len(sorted_data) - 1:
                file.write('\n')  # Add an empty line between entities

# ignore >>>>>>
def convert_csv_to_yaml_s(input_csv_file, output_yaml_file):
    yaml_data = []

    # Read the CSV file
    with open(input_csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Ignore lines that start with >>>>>>
            if row['name'].startswith('>>>>>>'):
                continue

            # Prepare the entry for YAML format, removing 'Style: ' from the name
            entry = {
                'name': row['name'].replace('Style: ', ''),  # Remove 'Style: ' prefix
                'prompt': row['prompt'].replace('{prompt}', '{prompt}'),
                'negative_prompt': ''  # Set negative_prompt to an empty string
            }
            yaml_data.append(entry)

    # Write the YAML data to a new file with empty lines between entries
    with open(output_yaml_file, 'w', encoding='utf-8') as file:
        for entry in yaml_data:
            yaml_entry = yaml.dump([entry], allow_unicode=True, default_flow_style=False).strip()
            file.write(yaml_entry + '\n\n')  # Add an empty line after each entry

# ignore >>>>>> and -
def convert_csv_to_yaml_s2(input_csv_file, output_yaml_file):
    yaml_data = []

    # Read the CSV file
    with open(input_csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Ignore lines that start with >>>>>> or names that contain '-'
            if row['name'].startswith('>>>>>>') or '-' in row['name']:
                continue

            # Prepare the entry for YAML format, removing 'Style: ' from the name
            entry = {
                'name': row['name'].replace('Style: ', ''),  # Remove 'Style: ' prefix
                'prompt': row['prompt'].replace('{prompt}', '{prompt}'),
                'negative_prompt': ''  # Set negative_prompt to an empty string
            }
            yaml_data.append(entry)

    # Write the YAML data to a new file with empty lines between entries
    with open(output_yaml_file, 'w', encoding='utf-8') as file:
        for entry in yaml_data:
            yaml_entry = yaml.dump([entry], allow_unicode=True, default_flow_style=False).strip()
            file.write(yaml_entry + '\n\n')  # Add an empty line after each entry


def remove_duplicates_from_yaml(input_yaml_file, output_yaml_file):
    unique_data = {}

    # Read the YAML file
    with open(input_yaml_file, 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)

        # Loop through each entry and keep only unique names
        for entry in data:
            name = entry['name']
            if name not in unique_data:
                unique_data[name] = entry

    # Write the unique entries back to a new YAML file
    with open(output_yaml_file, 'w', encoding='utf-8') as file:
        for entry in unique_data.values():
            yaml_entry = yaml.dump([entry], allow_unicode=True, default_flow_style=False).strip()
            file.write(yaml_entry + '\n\n')  # Add an empty line after each entry


if __name__ == '__main__':
    # csv_file = r"D:\programing\SD\ComfyUI\ComfyUI_3dsMax\Styles\tyDiffusion_default_prompt_styles.csv"
    # csv_to_yaml(csv_file, 'output.yaml')
    # json_file = r"E:\StableDiffusion\ComfyUI\ComfyUI_normal_11\ComfyUI\custom_nodes\ComfyUi_PromptStylers\sdxl_styles_mood.json"
    # json_to_yaml(json_file, 'with_mood.yaml')
    # csv_s_file = r"E:\StableDiffusion\ComfyUI\ComfyUI_normal_11\ComfyUI\styles.csv"
    # csv_special_to_yaml_tagged(csv_s_file,"pixaroma.yaml")
    # yaml_file = r"E:\StableDiffusion\ComfyUI\ComfyUI_normal_11\ComfyUI\custom_nodes\ComfyUi-iTools\execlud\pixaroma.yaml"
    # clear_negative_prompts(yaml_file,"flux.yaml")
    # dir = r"E:\StableDiffusion\ComfyUI\ComfyUI_normal_11\ComfyUI\custom_nodes\ComfyUi-iTools\styles\more examples"
    # combine_yaml_files(dir,"all.yaml")
    # old_file = r"E:\StableDiffusion\ComfyUI\ComfyUI_normal_11\ComfyUI\custom_nodes\ComfyUi-iTools\styles\f.yaml"
    # reorder_yaml_by_name(old_file,"new_f.yaml")
    # csv_f = r"C:\Users\Makadi\Desktop\styles.csv"
    # convert_csv_to_yaml_s2(csv_f,"SDXL-A1111.yaml")
    old_file = r"E:\StableDiffusion\ComfyUI\ComfyUI_normal_11\ComfyUI\custom_nodes\ComfyUi-iTools\styles\f.yaml"
    remove_duplicates_from_yaml(old_file,"new_f2.yaml")