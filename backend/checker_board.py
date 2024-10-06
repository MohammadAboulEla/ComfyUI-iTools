from PIL import Image, ImageDraw
import torch
from enum import Enum


class ChessPattern(Enum):
    RANDOM = "random"
    CHECKERBOARD = "checkerboard"
    HORIZONTAL_STRIPES = "horizontal stripes"
    VERTICAL_STRIPES = "vertical stripes"

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
        self.tensor = self.tensor_prepare()
        self.pil_img = self.generate_image_from_tensor_colored() if colored else self.generate_image_from_tensor()

    def tensor_prepare(self):
        if not self.colored:  # black and white
            match self.pattern:
                case ChessPattern.RANDOM:
                    return torch.randint(0, 2, (1, self.rows, self.cols))
                case ChessPattern.CHECKERBOARD:
                    return torch.tensor([[(i + j) % 2 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(
                        0)
                case ChessPattern.HORIZONTAL_STRIPES:
                    return torch.tensor([[i % 2 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(0)
                case ChessPattern.VERTICAL_STRIPES:
                    return torch.tensor([[j % 2 for j in range(self.cols)] for i in range(self.rows)]).unsqueeze(0)
        else:  # colored
            if self.pattern == ChessPattern.RANDOM:
                return torch.randint(0, 256, (3, self.rows, self.cols))  # Random RGB colors
            elif self.pattern == ChessPattern.CHECKERBOARD:
                base_tensor = torch.zeros((3, self.rows, self.cols), dtype=torch.uint8)
                for i in range(self.rows):
                    for j in range(self.cols):
                        if (i + j) % 2 == 0:
                            base_tensor[:, i, j] = torch.randint(0, 256, (3,))  # Assign random color
                return base_tensor

            elif self.pattern == ChessPattern.HORIZONTAL_STRIPES:
                base_tensor = torch.zeros((3, self.rows, self.cols), dtype=torch.uint8)
                for i in range(self.rows):
                    for j in range(self.cols):
                        base_tensor[:, i, :] = torch.randint(0, 256, (3, 1))  # Random color for the entire row
                return base_tensor

            elif self.pattern == ChessPattern.VERTICAL_STRIPES:
                base_tensor = torch.zeros((3, self.rows, self.cols), dtype=torch.uint8)
                for j in range(self.cols):
                    for j in range(self.cols):
                        base_tensor[:, :, j] = torch.randint(0, 256, (3, 1))  # Random color for the entire column
                return base_tensor

    def generate_image_from_tensor_colored(self):
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
