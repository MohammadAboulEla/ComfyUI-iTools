import os
from PIL import Image, ImageDraw, ImageFont, ImageColor

def add_text_bar(image, info, font_size=32, background_color="#000000AA", position="overlay"):
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
    draw = ImageDraw.Draw(Image.new('RGBA', (1, 1)))  # Dummy image for text sizing
    lines = draw_text(draw, info, font, max_width)

    txt_height = sum([draw.textbbox((0, 0), line, font=font)[3] for line in lines]) + 5  # 5 for padding
    try:
        background_color = ImageColor.getrgb(background_color)
    except ValueError:
        print(f"[iTools] Unknown color specifier: {background_color}, using default.")
        background_color = ImageColor.getrgb("#000000AA")

    txt = Image.new('RGBA', (max_width, txt_height), color=background_color)
    draw = ImageDraw.Draw(txt)

    y = 0
    for line in lines:
        draw.text((0, y), line, font=font, fill=(255, 255, 255, 255))
        y += draw.textbbox((0, 0), line, font=font)[3]

    if position == "overlay":
        composite = Image.new('RGBA', image.size)
        composite.paste(image, (0, 0))
        composite.paste(txt, (0, image.height - txt_height), mask=txt)
    elif position == "underlay":
        new_height = image.height + txt_height
        composite = Image.new('RGBA', (image.width, new_height))
        composite.paste(image, (0, 0))
        composite.paste(txt, (0, image.height), mask=txt)
    else:
        raise ValueError("Invalid position value. Use 'overlay' or 'underlay'.")

    return composite
