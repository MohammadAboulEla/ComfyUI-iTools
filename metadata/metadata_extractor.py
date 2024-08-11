import os

from PIL import Image, ExifTags
import json


def get_image_metadata(image_path) -> (dict, str):
    try:
        with Image.open(image_path) as img:
            if img.format == 'PNG':
                # For PNG images, get PNG info
                return img.info, img.format
            elif img.format == 'WEBP':
                # For WebP images, get WebP info (if any)
                return img.info, img.format
            else:
                return {}, img.format
    except Exception as e:
        print(e)
        return {}, img.format


def fix_workflow(img_info: dict, _type: str):
    if _type == "PNG":
        d = str(img_info["workflow"])
        print(d)
        d = json.loads(d)
        return d
    elif _type == "WEBP":
        try:
            img_info = str(img_info)
            part1 = img_info.split(r'Workflow:')[1]
            part2 = part1.split(r"\x")[0]
            part2 = json.loads(part2.replace('\\', '\\\\'))
            return part2
        except Exception as e:
            print("fix_workflow", e)
            return {}
    else:
        return {}


def process_nodes(data_dict):
    supported_types = ["CLIPTextEncodeSDXL", "CLIPTextEncode",
                       "easy positive", "ShowText|pysssss",
                       "Eff. Loader SDXL", "SDXLPromptStyler"]
    number_nodes = 0
    widgets_values = {}

    try:
        nodes = data_dict.get("nodes", [])

        for node in nodes:
            node_type = node.get("type")
            if node_type in supported_types:
                widgets = node.get("widgets_values", [])

                if node_type == "easy positive" and widgets and len(widgets) > 0:
                    if widgets[0] not in ["", None]:
                        number_nodes += 1
                        widgets_values["easy positive"] = widgets[0]

                if node_type == "CLIPTextEncode" and widgets and len(widgets) > 0:
                    if widgets[0] not in ["", None]:
                        number_nodes += 1
                        widgets_values["CLIPTextEncode"] = widgets[0]

                if node_type == "CLIPTextEncodeSDXL" and widgets and len(widgets) > 6:
                    if widgets[6] not in ["", None]:
                        number_nodes += 1
                        widgets_values["CLIPTextEncodeSDXL"] = widgets[6]

                if node_type == "ShowText|pysssss" and widgets and len(widgets) > 0:
                    if widgets[0] not in ["", None]:
                        number_nodes += 1
                        widgets_values["ShowText|pysssss"] = widgets[0]

                if node_type == "SDXLPromptStyler" and widgets and len(widgets) > 1:
                    if widgets[0] not in ["", None]:
                        number_nodes += 1
                        widgets_values["SDXLPromptStyler positive"] = widgets[0]
                    if widgets[1] not in ["", None]:
                        number_nodes += 1
                        widgets_values["SDXLPromptStyler negative"] = widgets[1]

                if node_type == "Eff. Loader SDXL" and widgets and len(widgets) > 7:
                    if widgets[7] not in ["", None]:
                        number_nodes += 1
                        widgets_values["Eff. Loader SDXL"] = widgets[7]

        return widgets_values, number_nodes

    except json.JSONDecodeError as e:
        return "JSON decoding failed " + str(e), number_nodes

def get_prompt(img, print_workflow=False):
    workflow, img_type = get_image_metadata(img)
    # print("workflow", workflow)
    clean_workflow = fix_workflow(workflow, img_type)
    if print_workflow:
        print("clean_workflow", clean_workflow)
    r, n = process_nodes(clean_workflow)
    lines = []
    for k, v in r.items():
        lines.append(f"{k}: {v}\n")
    old_info = f"{n} STRINGS in this workflow:\n" + ''.join(lines)
    info = '\n'.join(lines)
    return info


if __name__ == '__main__':
    im_default = r"D:\LIBRARY\AI_images\output\ComfyUI_temp_pforh_00001_.png"
    im1 = r"D:\LIBRARY\AI_images\output\ComfyUI_05-29-24_0006.webp"
    im2 = r"D:\LIBRARY\AI_images\output\ComfyUI_08-09-24_0050.webp"
    im3 = r"D:\LIBRARY\AI_images\output\ComfyUI_05-07-24_0142.webp"
    im4 = r"D:\LIBRARY\AI_images\output\ComfyUI_08-09-24_0033.webp"
    print(get_prompt(im4,print_workflow=True))
    pass
