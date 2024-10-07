from PIL import Image, ImageDraw
import torch
from enum import Enum


class ChessPattern(Enum):
    RANDOM = "random"
    RANDOM_UNIFORM = "random uniform"
    CHECKERBOARD = "checkerboard"
    STRIPES_HORIZONTAL = "horizontal stripes"
    STRIPES_VERTICAL = "vertical stripes"
    STRIPES_DIAGONAL = "diagonal stripes"
    BORDER = "border"
    BORDER_RANDOM = "border random"
    CROSS = "cross"
    GRADIENT_VERTICAL = "gradient vertical"
    GRADIENT_HORIZONTAL = "gradient horizontal"
    DIAMOND = "diamond"
    DIAMOND_FILL = "diamond fill"
    DOTTED_FRAME = "dotted frame"
    PORTAL = "portal"
    RING = "ring"

    @staticmethod
    def to_list():
        return list(map(lambda cp: cp.value, ChessPattern))

    @staticmethod
    def from_string(pattern_str: str):
        for pattern in ChessPattern:
            if pattern.value == pattern_str:
                return pattern
        raise ValueError(f"{pattern_str} is not a valid ChessPattern")

class ChessTensor:
    def __init__(self, pattern: ChessPattern, colored=False, width=512, height=512, rows=4, cols=4):
        self.pattern = pattern
        self.rows = rows
        self.cols = cols
        self.width = width
        self.height = height
        self.colored = colored

        if pattern not in [ChessPattern.GRADIENT_VERTICAL, ChessPattern.GRADIENT_HORIZONTAL, ChessPattern.RANDOM_UNIFORM, ChessPattern.PORTAL]:
            self.tensor = self.tensor_prepare()
            self.pil_img = self.generate_image_from_tensor_colored() if colored else self.generate_image_from_tensor()
        else:
            self.tensor = self.tensor_prepare(force_gradient=True)
            self.pil_img = self.generate_image_from_tensor_colored()


    def tensor_prepare(self, force_gradient=False):
        colored = self.colored
        if force_gradient:
            colored = True

        # BLACK AND WHITE
        if not colored:
            match self.pattern:
                case ChessPattern.RANDOM:
                    return torch.randint(0, 2, (1, self.rows, self.cols))

                case ChessPattern.CHECKERBOARD:
                    return torch.tensor([[(i + j) % 2 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(0)

                case ChessPattern.STRIPES_HORIZONTAL:
                    return torch.tensor([[i % 2 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(0)

                case ChessPattern.STRIPES_VERTICAL:
                    return torch.tensor([[j % 2 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(0)

                case ChessPattern.RING:
                    center_x, center_y = self.rows // 2, self.cols // 2
                    return torch.tensor(
                        [[(max(abs(i - center_x), abs(j - center_y)) % 2) for j in range(self.cols)] for i in
                         range(self.rows)]).unsqueeze(0)

                case ChessPattern.STRIPES_DIAGONAL:
                    return torch.tensor([[(i + j) % 3 == 0 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(0)

                case ChessPattern.BORDER | ChessPattern.BORDER_RANDOM:
                    base_tensor = torch.zeros((self.rows, self.cols))
                    base_tensor[0, :] = 1
                    base_tensor[-1, :] = 1
                    base_tensor[:, 0] = 1
                    base_tensor[:, -1] = 1
                    return base_tensor.unsqueeze(0)

                case ChessPattern.CROSS:
                    base_tensor = torch.zeros((self.rows, self.cols))
                    center_row = self.rows // 2
                    center_col = self.cols // 2
                    base_tensor[center_row, :] = 1
                    base_tensor[:, center_col] = 1
                    return base_tensor.unsqueeze(0)

                case ChessPattern.DIAMOND:
                    base_tensor = torch.zeros((self.rows, self.cols))
                    for i in range(self.rows):
                        for j in range(self.cols):
                            if abs(i - self.rows // 2) + abs(j - self.cols // 2) < min(self.rows, self.cols) // 2:
                                base_tensor[i, j] = (i + j) % 2
                    return base_tensor.unsqueeze(0)

                case ChessPattern.DIAMOND_FILL:
                    base_tensor = torch.zeros((self.rows, self.cols))
                    for i in range(self.rows):
                        for j in range(self.cols):
                            if abs(i - self.rows // 2) + abs(j - self.cols // 2) < min(self.rows, self.cols) // 2:
                                base_tensor[i, j] = 1  # Set the value to 1 inside the diamond shape
                    return base_tensor.unsqueeze(0)

                case ChessPattern.DOTTED_FRAME:
                    base_tensor = torch.zeros((self.rows, self.cols))
                    row, col, direction = 0, 0, 0
                    for step in range(self.rows * self.cols):
                        base_tensor[row, col] = step % 2
                        if direction == 0:  # moving right
                            if col + 1 < self.cols and base_tensor[row, col + 1] == 0:
                                col += 1
                            else:
                                direction = 1
                                row += 1
                        elif direction == 1:  # moving down
                            if row + 1 < self.rows and base_tensor[row + 1, col] == 0:
                                row += 1
                            else:
                                direction = 2
                                col -= 1
                        elif direction == 2:  # moving left
                            if col - 1 >= 0 and base_tensor[row, col - 1] == 0:
                                col -= 1
                            else:
                                direction = 3
                                row -= 1
                        elif direction == 3:  # moving up
                            if row - 1 >= 0 and base_tensor[row - 1, col] == 0:
                                row -= 1
                            else:
                                direction = 0
                                col += 1
                    return base_tensor.unsqueeze(0)

                case ChessPattern.GRADIENT_VERTICAL:
                    base_tensor = torch.linspace(0, 1, self.rows).unsqueeze(1).expand(self.rows, self.cols)
                    return base_tensor.unsqueeze(0)

                case ChessPattern.GRADIENT_HORIZONTAL:
                    base_tensor = torch.linspace(0, 1, self.cols).unsqueeze(0).expand(self.rows, self.cols)
                    return base_tensor.unsqueeze(0)

        # COLORED patterns
        else:
            base_tensor = torch.zeros((3, self.rows, self.cols), dtype=torch.uint8)
            match self.pattern:
                case ChessPattern.RANDOM:
                    return torch.randint(0, 256, (3, self.rows, self.cols))   # Random RGB colors

                case ChessPattern.RANDOM_UNIFORM:
                    if self.colored:
                        random_grayscale = torch.randint(0, 256, (self.rows, self.cols))
                        random_color = torch.tensor([
                            torch.rand(1).item(),
                            torch.rand(1).item(),
                            torch.rand(1).item()])
                        result = random_grayscale.unsqueeze(0).repeat(3, 1, 1) * random_color.view(3, 1, 1)
                        return result.clamp(0, 255).byte()  # Clamp values to [0, 255] and convert to byte
                    else:
                        random_colors = torch.randint(0, 256, (self.rows, self.cols))  # Random grayscale values
                        return random_colors.unsqueeze(0).repeat(3, 1, 1)  # Repeat across 3 channels

                case ChessPattern.CHECKERBOARD:
                    for i in range(self.rows):
                        for j in range(self.cols):
                            if (i + j) % 2 == 0:
                                base_tensor[:, i, j] = torch.randint(0, 256, (3,))  # Assign random color
                    return base_tensor

                case ChessPattern.STRIPES_HORIZONTAL:
                    for i in range(self.rows):
                        base_tensor[:, i, :] = torch.randint(0, 256, (3, 1))  # Random color for the entire row
                    return base_tensor

                case ChessPattern.STRIPES_VERTICAL:
                    for j in range(self.cols):
                        base_tensor[:, :, j] = torch.randint(0, 256, (3, 1))  # Random color for the entire column
                    return base_tensor

                case ChessPattern.STRIPES_DIAGONAL:
                    base_tensor = torch.zeros((3, self.rows, self.cols), dtype=torch.uint8)
                    color_map = {}  # Dictionary to store colors for each stripe index
                    for i in range(self.rows):
                        for j in range(self.cols):
                            if (i + j) % 3 == 0:  # Condition for diagonal stripes
                                stripe_index = i + j  # Use a unique index for each diagonal stripe
                                if stripe_index not in color_map:
                                    color_map[stripe_index] = torch.randint(0, 256, (
                                    3,))  # Assign a random color for this stripe
                                base_tensor[:, i, j] = color_map[stripe_index]  # Use the assigned color
                    return base_tensor

                case ChessPattern.BORDER_RANDOM:
                    border_color_top = torch.randint(0, 256, (3,))
                    border_color_bottom = torch.randint(0, 256, (3,))
                    border_color_left = torch.randint(0, 256, (3,))
                    border_color_right = torch.randint(0, 256, (3,))
                    base_tensor[:, 0, :] = border_color_top.view(3, 1)  # Expand to match dimension
                    base_tensor[:, -1, :] = border_color_bottom.view(3, 1)  # Expand to match dimension
                    base_tensor[:, :, 0] = border_color_left.view(3, 1)  # Expand to match dimension
                    base_tensor[:, :, -1] = border_color_right.view(3, 1)  # Expand to match dimension
                    return base_tensor

                case ChessPattern.BORDER:
                    border_color = torch.randint(0, 256, (3,))
                    base_tensor[:, 0, :] = border_color.view(3, 1)  # Expand to match dimension
                    base_tensor[:, -1, :] = border_color.view(3, 1)  # Expand to match dimension
                    base_tensor[:, :, 0] = border_color.view(3, 1)  # Expand to match dimension
                    base_tensor[:, :, -1] = border_color.view(3, 1)  # Expand to match dimension
                    return base_tensor

                case ChessPattern.CROSS:
                    center_row = self.rows // 2
                    center_col = self.cols // 2
                    cross_color_row = torch.randint(0, 256, (3,))
                    cross_color_col = torch.randint(0, 256, (3,))
                    base_tensor[:, center_row, :] = cross_color_row.view(3, 1)  # Expand to match dimension
                    base_tensor[:, :, center_col] = cross_color_col.view(3, 1)  # Expand to match dimension
                    return base_tensor

                case ChessPattern.DIAMOND:
                    for i in range(self.rows):
                        for j in range(self.cols):
                            if abs(i - self.rows // 2) + abs(j - self.cols // 2) < min(self.rows, self.cols) // 2:
                                base_tensor[:, i, j] = torch.randint(0, 256, (3,))
                    return base_tensor

                case ChessPattern.DIAMOND_FILL:
                    random_color = torch.randint(0, 256, (3,))  # Generate a random color
                    for i in range(self.rows):
                        for j in range(self.cols):
                            if abs(i - self.rows // 2) + abs(j - self.cols // 2) < min(self.rows, self.cols) // 2:
                                base_tensor[:, i, j] = random_color  # Fill with the same random color
                    return base_tensor

                case ChessPattern.PORTAL:
                    if force_gradient and not self.colored:
                        row, col, direction = 0, 0, 0
                        grayscale_value = 255  # Start with white (maximum intensity)

                        for step in range(self.rows * self.cols):
                            base_tensor[:, row, col] = grayscale_value
                            if direction == 0:  # moving right
                                if col + 1 < self.cols and torch.all(base_tensor[:, row, col + 1] == 0):
                                    col += 1
                                else:
                                    direction = 1
                                    row += 1
                                    # Decrease grayscale value for next step
                                    grayscale_value = max(grayscale_value - 15, 0)  # Adjust the decrement as needed
                            elif direction == 1:  # moving down
                                if row + 1 < self.rows and torch.all(base_tensor[:, row + 1, col] == 0):
                                    row += 1
                                else:
                                    direction = 2
                                    col -= 1
                                    grayscale_value = max(grayscale_value - 15, 0)
                            elif direction == 2:  # moving left
                                if col - 1 >= 0 and torch.all(base_tensor[:, row, col - 1] == 0):
                                    col -= 1
                                else:
                                    direction = 3
                                    row -= 1
                                    grayscale_value = max(grayscale_value - 15, 0)
                            elif direction == 3:  # moving up
                                if row - 1 >= 0 and torch.all(base_tensor[:, row - 1, col] == 0):
                                    row -= 1
                                else:
                                    direction = 0
                                    col += 1
                                    grayscale_value = max(grayscale_value - 15, 0)

                        return base_tensor
                    else:
                        row, col, direction = 0, 0, 0
                        random_color = torch.randint(0, 256, (3,))
                        for step in range(self.rows * self.cols):
                            base_tensor[:, row, col] = random_color
                            if direction == 0:  # moving right
                                if col + 1 < self.cols and torch.all(base_tensor[:, row, col + 1] == 0):
                                    col += 1
                                else:
                                    direction = 1
                                    row += 1
                                    random_color = torch.randint(0, 256, (3,))  # New color for new direction
                            elif direction == 1:  # moving down
                                if row + 1 < self.rows and torch.all(base_tensor[:, row + 1, col] == 0):
                                    row += 1
                                else:
                                    direction = 2
                                    col -= 1
                                    random_color = torch.randint(0, 256, (3,))
                            elif direction == 2:  # moving left
                                if col - 1 >= 0 and torch.all(base_tensor[:, row, col - 1] == 0):
                                    col -= 1
                                else:
                                    direction = 3
                                    row -= 1
                                    random_color = torch.randint(0, 256, (3,))
                            elif direction == 3:  # moving up
                                if row - 1 >= 0 and torch.all(base_tensor[:, row - 1, col] == 0):
                                    row -= 1
                                else:
                                    direction = 0
                                    col += 1
                                    random_color = torch.randint(0, 256, (3,))
                        return base_tensor

                case ChessPattern.DOTTED_FRAME:
                    # Initialize a tensor for colors with shape (self.rows, self.cols, 3)
                    base_tensor = torch.zeros((self.rows, self.cols, 3), dtype=torch.uint8)
                    row, col, direction = 0, 0, 0

                    for step in range(self.rows * self.cols):
                        if step % 2 == 1:  # Only color the dots
                            base_tensor[row, col] = torch.randint(0, 256, (3,))  # Random RGB color for white
                        else:
                            base_tensor[row, col] = 0  # Keep it black

                        # Move in the specified direction
                        if direction == 0:  # moving right
                            if col + 1 < self.cols and torch.all(base_tensor[row, col + 1] == 0):
                                col += 1
                            else:
                                direction = 1
                                row += 1
                        elif direction == 1:  # moving down
                            if row + 1 < self.rows and torch.all(base_tensor[row + 1, col] == 0):
                                row += 1
                            else:
                                direction = 2
                                col -= 1
                        elif direction == 2:  # moving left
                            if col - 1 >= 0 and torch.all(base_tensor[row, col - 1] == 0):
                                col -= 1
                            else:
                                direction = 3
                                row -= 1
                        elif direction == 3:  # moving up
                            if row - 1 >= 0 and torch.all(base_tensor[row - 1, col] == 0):
                                row -= 1
                            else:
                                direction = 0
                                col += 1

                    return base_tensor.permute(2, 0, 1)  # Change to (C, H, W) format

                case ChessPattern.GRADIENT_VERTICAL:
                    random_color = torch.randint(0, 256, (3,))  # Generate a random color
                    for i in range(3):  # For each RGB channel
                        if force_gradient and not self.colored:
                            base_tensor[i, :, :] = torch.linspace(0, 255, self.rows).unsqueeze(1).expand(self.rows,self.cols) * 1.0
                        else:
                            base_tensor[i, :, :] = torch.linspace(0, 255, self.rows).unsqueeze(1).expand(self.rows,self.cols) * (random_color[i] / 255.0)
                    return base_tensor

                case ChessPattern.GRADIENT_HORIZONTAL:
                    random_color = torch.randint(0, 256, (3,))  # Generate a random color
                    for i in range(3):  # For each RGB channel
                        if force_gradient and not self.colored:
                            base_tensor[i, :, :] = torch.linspace(0, 255, self.cols).unsqueeze(0).expand(self.rows, self.cols) * 1.0
                        else:
                            base_tensor[i, :, :] = torch.linspace(0, 255, self.cols).unsqueeze(0).expand(self.rows, self.cols) * (random_color[i] / 255.0)
                    return base_tensor

                case ChessPattern.RING:
                    center_x, center_y = self.rows // 2, self.cols // 2
                    max_radius = max(center_x, center_y)

                    # Generate random colors for each ring
                    ring_colors = torch.randint(0, 256, (max_radius + 1, 3),
                                                dtype=torch.uint8)  # Random RGB colors for each ring

                    # Create an empty tensor to hold the RGB values
                    result = torch.zeros((self.rows, self.cols, 3), dtype=torch.uint8)

                    for i in range(self.rows):
                        for j in range(self.cols):
                            radius = max(abs(i - center_x), abs(j - center_y))
                            result[i, j] = ring_colors[radius]  # Assign the ring color based on the distance

                    return result.permute(2, 0, 1)  # Permute to match (C, H, W) format

    def generate_image_from_tensor_colored(self, white_gradient=False):
        colored_tensor = self.tensor
        width = self.width
        height = self.height
        # Convert the tensor to a numpy array and reshape it
        grid = colored_tensor.squeeze(0).numpy()  # Remove the channel dimension (if it exists)

        # Create a new image with a white background
        img = Image.new("RGB", (width, height), color="black")
        draw = ImageDraw.Draw(img)

        # Calculate the size of each square
        rows, cols = grid.shape[1], grid.shape[2]  # Get height and width from the tensor shape
        square_width = width // cols
        square_height = height // rows

        # Fill each square based on the tensor values
        for i in range(rows):
            for j in range(cols):
                top_left = (j * square_width, i * square_height)
                bottom_right = ((j + 1) * square_width, (i + 1) * square_height)
                color = tuple(grid[:, i, j])  # Get the RGB color for the square
                draw.rectangle((top_left, bottom_right), fill=color)

        return img

    def generate_image_from_tensor(self):
        masked_tensor = self.tensor
        width = self.width
        height = self.height
        # Convert the tensor to numpy array and reshape it
        grid = masked_tensor.squeeze(0).numpy()

        # Create a new image with a white background
        img = Image.new("RGB", (width, height), color="black")
        draw = ImageDraw.Draw(img)

        # Calculate the size of each square
        rows, cols = grid.shape
        square_width = width // cols
        square_height = height // rows

        # Fill each square based on the tensor values
        for i in range(rows):
            for j in range(cols):
                top_left = (j * square_width, i * square_height)
                bottom_right = ((j + 1) * square_width, (i + 1) * square_height)
                color = "white" if grid[i, j] == 1 else "black"
                draw.rectangle((top_left, bottom_right), fill=color)

        return img


if __name__ == '__main__':
    _tensor = ChessTensor(pattern=ChessPattern.CHECKERBOARD, colored=False)
    _img = _tensor.pil_img
    _img.show()
