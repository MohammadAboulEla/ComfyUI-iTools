import os
from PIL import Image  # type: ignore
from aiohttp import web  # type: ignore
from server import PromptServer  # type: ignore

from .shared import project_dir, install_package, styles
from .prompter import load_yaml_data, read_styles, read_replace_and_combine

# PAINT NODE SERVICES
@PromptServer.instance.routes.post("/itools/request_save_paint")
async def respond_to_request_save_paint(request):
    post = await request.post()

    # Get the uploaded files
    foreground_file = post.get("foreground")
    background_file = post.get("background")

    if not foreground_file or not background_file:
        return web.json_response(
            {"status": "error", "message": "Missing foreground or background file"},
            status=400,
        )

    # Define the directory where the images will be saved
    save_directory = os.path.join(project_dir, "backend")

    # Save the foreground file
    foreground_path = os.path.join(save_directory, foreground_file.filename)
    with open(foreground_path, "wb") as f:
        f.write(foreground_file.file.read())

    # Save the background file
    background_path = os.path.join(save_directory, background_file.filename)
    with open(background_path, "wb") as f:
        f.write(background_file.file.read())

    return web.json_response(
        {
            "status": "success",
            "foreground": foreground_path,
            "background": background_path,
        }
    )


@PromptServer.instance.routes.post("/itools/request_the_paint_file")
async def respond_to_request_the_paint_file(request):
    post = await request.post()

    filename_prefix = post.get("filename_prefix")
    if not filename_prefix:
        return web.json_response(
            {"status": "error", "message": "Filename prefix is required"}, status=400
        )

    # Define the directory where the images are saved
    save_directory = os.path.join(project_dir, "backend")

    # Define file paths
    foreground_path = os.path.join(save_directory, f"{filename_prefix}_foreground.png")
    background_path = os.path.join(save_directory, f"{filename_prefix}_background.png")

    # Check if both files exist
    if not os.path.exists(foreground_path) or not os.path.exists(background_path):
        return web.json_response(
            {"status": "error", "message": "File not found"}, status=404
        )

    # Read the files
    with open(foreground_path, "rb") as fg_file:
        foreground_data = fg_file.read()

    with open(background_path, "rb") as bg_file:
        background_data = bg_file.read()

    return web.json_response(
        {
            "status": "success",
            "data": {
                "foreground": foreground_data.hex(),
                "background": background_data.hex(),
            },
        }
    )


@PromptServer.instance.routes.post("/itools/request_load_img")
async def respond_to_request_load_img(request):
    post = await request.post()

    filename_prefix = post.get("filename_prefix")
    if not filename_prefix:
        return web.json_response(
            {"status": "error", "message": "Filename prefix is required"}, status=400
        )

    # Define the directory where the images are saved
    save_directory = os.path.join(project_dir, "backend")

    # Define file paths
    img_path = os.path.join(save_directory, f"{filename_prefix}.png")

    # Check if both files exist
    if not os.path.exists(img_path):
        return web.json_response(
            {"status": "error", "message": "File not found"}, status=404
        )

    # Read the files
    with open(img_path, "rb") as fg_file:
        img_data = fg_file.read()

    return web.json_response(
        {
            "status": "success",
            "data": {
                "img": img_data.hex(),
            },
        }
    )


def removeBackground(input_path, output_path):
    # Try importing rembg
    try:
        from rembg import remove  # type: ignore
    except ImportError:
        install_package("rembg[gpu]")
        from rembg import remove  # type: ignore # Retry the import after installation

    input_img = Image.open(input_path)
    output_img = remove(input_img)
    output_img.save(output_path)


@PromptServer.instance.routes.post("/itools/request_mask_img")
async def respond_to_request_mask_img(request):
    # Parse the multipart form data
    reader = await request.multipart()

    # Read the uploaded file
    field = await reader.next()  # Get the first field (should be "image")
    if field.name != "image":
        return web.json_response(
            {"status": "error", "message": "Invalid field name"}, status=400
        )

    # Define the save directory and ensure it exists
    save_directory = os.path.join(project_dir, "backend")

    # Define the temporary file path
    temp_file_path = os.path.join(save_directory, "uploaded_image.png")

    # Open the file in binary write mode and write the entire content
    with open(temp_file_path, "wb") as f:
        f.write(await field.read())

    # Process the saved file
    img_out = os.path.join(save_directory, "iToolsMaskedImg.png")
    removeBackground(temp_file_path, img_out)

    # Clean up the temporary file if needed
    if os.path.exists(temp_file_path):
        try:
            os.remove(temp_file_path)
        except Exception as e:
            pass

    return web.json_response(
        {
            "status": "success",
        }
    )

#SMART STYLER NODE SERVICES
@PromptServer.instance.routes.get("/itools/get_styler_data")
async def get_styler_data(request):
    return web.json_response({"styles": styles})


@PromptServer.instance.routes.post("/itools/get_style_templates")
async def get_style_templates(request):
    post = await request.post()
    file_name = post.get("file_name")

    file_path = os.path.join(project_dir, "styles", file_name)
    file_path2 = os.path.join(project_dir, "styles", "more examples", file_name)
    yaml_data = load_yaml_data(file_path) or load_yaml_data(file_path2)
    templates = read_styles(yaml_data)

    return web.json_response({"templates": templates})


@PromptServer.instance.routes.post("/itools/merge_style")
async def merge_style(request):
    post = await request.post()
    prompt = post.get("prompt", "")
    negative = post.get("negative", "")
    style_file = post.get("style_file")
    template_name = post.get("template_name")

    pos, neg, used = read_replace_and_combine(
        template_name, prompt, negative, style_file
    )
    return web.json_response({"prompt": pos, "negative": neg})
