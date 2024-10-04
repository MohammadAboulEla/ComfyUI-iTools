from PIL import Image
from PIL.Image import Resampling
import numpy as np
import torch



def tensor_to_images(tensor_list):
    pil_images = []

    for tensor in tensor_list:
        # Assuming the tensor shape is [B, H, W, C]
        # We will iterate over the batch dimension
        batch_size = tensor.shape[0]

        for i in range(batch_size):
            # Select the i-th image from the batch
            img_tensor = tensor[i]  # Shape: [H, W, C]

            # Convert tensor to NumPy array
            np_image = img_tensor.cpu().numpy()

            # Handle grayscale images (single channel)
            if np_image.shape[2] == 1:  # If the last dimension is 1 (C=1)
                np_image = np_image.squeeze(2)  # Shape: [H, W]

            # Scale the values from 0-1 to 0-255 if necessary
            np_image = (np_image * 255).astype(np.uint8)

            # Convert NumPy array to PIL image
            pil_image = Image.fromarray(np_image)
            pil_images.append(pil_image)

    return pil_images


def image_to_tensor(image):
    np_img = np.asarray(image, dtype=np.float32) / 255.0  # Normalize to [0, 1]
    tensor_image = torch.from_numpy(np_img)  # Shape: (H, W, C)
    tensor_image = tensor_image.unsqueeze(0)  # Shape: (1, H, W, C)
    return tensor_image


def windows_fill_grid(image_path, rows, cols):
    # Open the input image
    img = Image.open(image_path)

    # Get the dimensions of the original image
    img_width, img_height = img.size

    # Create a new image with the total size of the grid
    new_width = cols * img_width
    new_height = rows * img_height
    grid_image = Image.new('RGB', (new_width, new_height))

    # Paste the original image into the grid
    for row in range(rows):
        for col in range(cols):
            grid_image.paste(img, (col * img_width, row * img_height))

    return grid_image


def windows_fill_grid_with_images(image_paths, rows, cols, grid_size=(1024, 1024), gap=0.05, bg_color='#ffffff'):
    # Calculate the grid dimensions and create a new grid
    grid_image = Image.new('RGB', grid_size, bg_color)
    img_width = grid_image.width // cols
    img_height = grid_image.height // rows
    size = (img_width, img_height)

    # Pre-calculate the extended amount for centering later
    extend_amount = round(img_width * gap) - round(gap * 200)

    # Loop through the specified number of rows and columns
    for row in range(rows):
        for col in range(cols):
            index = row * cols + col
            if index < len(image_paths):
                # Open and resize the image
                img = Image.open(image_paths[index])
                img.thumbnail(size, Resampling.LANCZOS)
                img = img.resize((int(img.width * (1 - gap)), int(img.height * (1 - gap))))

                # Calculate the position to paste the image centered in the grid
                position = (col * img_width + (img_width - img.width) // 2,
                            row * img_height + (img_height - img.height) // 2)

                # Paste the resized image into the grid
                grid_image.paste(img, position)

    # Create an extended image with additional padding
    extended_image = Image.new('RGB', (grid_image.width + 2 * extend_amount, grid_image.height + 2 * extend_amount),
                               bg_color)
    extended_image.paste(grid_image, (extend_amount, extend_amount))
    extended_image.resize(grid_size, Resampling.LANCZOS)

    return extended_image.resize(grid_size, Resampling.LANCZOS)


def fill_grid_with_images(images, rows, cols, grid_size=(1024, 1024), gap=0.05, bg_color='#ffffff'):
    print("Len Images", len(images))
    print(type(images[0]))
    rows = rows[0]
    cols = cols[0]
    grid_size = (grid_size[0][0], grid_size[1][0])
    gap = gap[0] / 100.0
    bg_color = bg_color[0]

    # Calculate the grid dimensions and create a new grid
    grid_image = Image.new('RGB', grid_size, bg_color)
    img_width = grid_image.width // cols
    img_height = grid_image.height // rows
    size = (img_width, img_height)

    # Pre-calculate the extended amount for centering later
    extend_amount = round(img_width * gap) - round(gap * 200)

    # Loop through the specified number of rows and columns
    for row in range(rows):
        for col in range(cols):
            index = row * cols + col
            if index < len(images):
                # Resize the image
                img = images[index]
                img.thumbnail(size, Resampling.LANCZOS)

                # Further resize for gap if necessary
                img = img.resize((int(img.width * (1 - gap)), int(img.height * (1 - gap))), Resampling.LANCZOS)

                # Calculate the position to paste the image centered in the grid
                position = (col * img_width + (img_width - img.width) // 2,
                            row * img_height + (img_height - img.height) // 2)

                # Paste the resized image into the grid
                grid_image.paste(img, position)

    # Create an extended image with additional padding
    extended_image = Image.new('RGB', (grid_image.width + 2 * extend_amount, grid_image.height + 2 * extend_amount),
                               bg_color)
    extended_image.paste(grid_image, (extend_amount, extend_amount))
    extended_image = extended_image.resize(grid_size, Resampling.LANCZOS)

    return extended_image


def fill_grid_with_images_new(images, rows, cols, grid_size=(1024, 1024), gap=0.05, bg_color='#ffffff'):
    # print("Len Images", len(images))
    # print(type(images[0]))
    rows = rows[0]
    cols = cols[0]
    grid_size = (grid_size[0][0], grid_size[1][0])
    gap = gap[0] / 100.0
    bg_color = bg_color[0]

    # Calculate the grid dimensions and create a new grid
    grid_image = Image.new('RGB', grid_size, bg_color)
    img_width = grid_image.width // cols
    img_height = grid_image.height // rows
    size = (img_width, img_height)

    # Pre-calculate the extended amount for centering later
    extend_amount = round(img_width * gap) - round(gap * 200)

    # Check if there is only one image
    if len(images) == 1:
        img = images[0]
        img.thumbnail(size, Resampling.LANCZOS)

        # Further resize for gap if necessary
        img = img.resize((int(img.width * (1 - gap)), int(img.height * (1 - gap))), Resampling.LANCZOS)

        # Loop through the specified number of rows and columns to paste the single image
        for row in range(rows):
            for col in range(cols):
                # Calculate the position to paste the image centered in the grid
                position = (col * img_width + (img_width - img.width) // 2,
                            row * img_height + (img_height - img.height) // 2)

                # Paste the resized image into the grid
                grid_image.paste(img, position)

    else:
        # Loop through the specified number of rows and columns for multiple images
        for row in range(rows):
            for col in range(cols):
                index = row * cols + col
                if index < len(images):
                    # Resize the image
                    img = images[index]
                    img.thumbnail(size, Resampling.LANCZOS)

                    # Further resize for gap if necessary
                    img = img.resize((int(img.width * (1 - gap)), int(img.height * (1 - gap))), Resampling.LANCZOS)

                    # Calculate the position to paste the image centered in the grid
                    position = (col * img_width + (img_width - img.width) // 2,
                                row * img_height + (img_height - img.height) // 2)

                    # Paste the resized image into the grid
                    grid_image.paste(img, position)

    # Create an extended image with additional padding
    extended_image = Image.new('RGB', (grid_image.width + 2 * extend_amount, grid_image.height + 2 * extend_amount),
                               bg_color)
    extended_image.paste(grid_image, (extend_amount, extend_amount))
    extended_image = extended_image.resize(grid_size, Resampling.LANCZOS)

    return extended_image


if __name__ == '__main__':
    # Example usage:
    # result_image = fill_grid('../examples/tile_test.jpg', 3, 3)
    # result_image.save('../excluded/output_image.jpg')
    # img_list = ['../examples/iTools_a.webp',
    #             'C:/Users/Makadi/Desktop/input/Q8.png',
    #             'C:/Users/Makadi/Desktop/input/b1.png',
    #             '../examples/tile_test.jpg'] * 3
    # img_list = [
    #             'C:/Users/Makadi/Desktop/input/b1.png',
    #             ] * 5
    # result_image = fill_grid_with_images(img_list, 3, 3, gap=0.05)
    # result_image.save('../excluded/output_image.jpg')
    ...
