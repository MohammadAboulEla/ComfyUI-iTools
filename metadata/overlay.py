
import os
from PIL import Image, ImageDraw, ImageFont, ImageColor


def add_overlay_bar(image, info, font_size=32, background_color="#000000AA"):
    font_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "Inconsolata.otf")
    font = ImageFont.truetype(font_path, font_size)
    txt_height = font.getmask("Q").getbbox()[3] + font.getmetrics()[1] + 5
    try:
        background_color = ImageColor.getrgb(background_color)
    except ValueError:
        print(f"[iTools] Unknown color specifier: {background_color} will use default one")
        background_color = ImageColor.getrgb("#000000AA")

    txt = Image.new('RGBA', (image.width, txt_height), color=background_color)
    draw = ImageDraw.Draw(txt)
    draw.text((0, 0), f"{info}", font=font, fill=(255, 255, 255, 255))

    composite = Image.new('RGBA', image.size)
    composite.paste(image, (0, 0))
    composite.paste(txt, (0, image.height - txt_height), mask=txt)

    return composite


if __name__ == '__main__':
    ...
