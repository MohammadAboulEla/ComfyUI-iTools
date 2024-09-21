import os
from PIL import Image, ImageDraw, ImageFont, ImageColor
import torch
import numpy as np


def tensor_to_img(image):
    # Move tensor to CPU and detach if necessary, then convert to NumPy in one step
    np_img = image.squeeze().mul(255).clamp(0, 255).byte().cpu().numpy()

    # Create a PIL image from the NumPy array
    return Image.fromarray(np_img)


def img_to_tensor(image):
    np_img = np.asarray(image, dtype=np.float32) / 255.0
    return torch.from_numpy(np_img).unsqueeze(0)


def add_overlay_bar(image, info, font_size=32, background_color="#000000AA"):
    font_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "Inconsolata.otf")
    font = ImageFont.truetype(font_path, font_size)

    def draw_text(draw, text, font, max_width):
        lines = []
        words = text.split()
        line = []

        for word in words:
            line_width, _ = draw.textbbox((0, 0), ' '.join(line + [word]), font=font)[2:]
            if line and line_width > max_width:
                lines.append(' '.join(line))
                line = [word]
            else:
                line.append(word)

        if line:
            lines.append(' '.join(line))

        return lines

    max_width = image.width
    draw = ImageDraw.Draw(Image.new('RGBA', (1, 1)))  # Create a dummy image to get text size
    lines = draw_text(draw, info, font, max_width)

    txt_height = sum([draw.textbbox((0, 0), line, font=font)[3] for line in lines]) + 5  # 5 for padding
    try:
        background_color = ImageColor.getrgb(background_color)
    except ValueError:
        print(f"[iTools] Unknown color specifier: {background_color} will use default one")
        background_color = ImageColor.getrgb("#000000AA")

    txt = Image.new('RGBA', (max_width, txt_height), color=background_color)
    draw = ImageDraw.Draw(txt)

    y = 0
    for line in lines:
        draw.text((0, y), line, font=font, fill=(255, 255, 255, 255))
        y += draw.textbbox((0, 0), line, font=font)[3]

    composite = Image.new('RGBA', image.size)
    composite.paste(image, (0, 0))
    composite.paste(txt, (0, image.height - txt_height), mask=txt)

    return composite


def add_underlay_bar(image, info, font_size=32, background_color="#000000AA"):
    font_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "Inconsolata.otf")
    font = ImageFont.truetype(font_path, font_size)

    def draw_text(draw, text, font, max_width):
        lines = []
        words = text.split()
        line = []

        for word in words:
            line_width, _ = draw.textbbox((0, 0), ' '.join(line + [word]), font=font)[2:]
            if line and line_width > max_width:
                lines.append(' '.join(line))
                line = [word]
            else:
                line.append(word)

        if line:
            lines.append(' '.join(line))

        return lines

    max_width = image.width
    draw = ImageDraw.Draw(Image.new('RGBA', (1, 1)))  # Create a dummy image to get text size
    lines = draw_text(draw, info, font, max_width)

    txt_height = sum([draw.textbbox((0, 0), line, font=font)[3] for line in lines]) + 5  # 5 for padding
    try:
        background_color = ImageColor.getrgb(background_color)
    except ValueError:
        print(f"[iTools] Unknown color specifier: {background_color} will use default one")
        background_color = ImageColor.getrgb("#000000AA")

    txt = Image.new('RGBA', (max_width, txt_height), color=background_color)
    draw = ImageDraw.Draw(txt)

    y = 0
    for line in lines:
        draw.text((0, y), line, font=font, fill=(255, 255, 255, 255))
        y += draw.textbbox((0, 0), line, font=font)[3]

    # Create a new image with increased height to fit the image and the text below
    new_height = image.height + txt_height
    composite = Image.new('RGBA', (image.width, new_height))

    # Paste the original image at the top
    composite.paste(image, (0, 0))

    # Paste the text below the image
    composite.paste(txt, (0, image.height), mask=txt)

    return composite


if __name__ == '__main__':
    ...
