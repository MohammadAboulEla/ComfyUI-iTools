import numpy as np
import torch
from PIL import Image
from sxa import yt
# suggested by chatGPT
def pil_to_tensor(_img):
    """
    Convert PIL Image to a torch Tensor of shape [B,H,W,C].
    A batch of B images, height H, width W, with C channels (generally C=3 for RGB).
    """

    # Convert PIL Image to NumPy array
    np_img = np.asarray(_img)

    # Ensure the image has 3 color channels
    if np_img.ndim == 2:
        np_img = np_img[:, :, np.newaxis]
    elif np_img.shape[2] == 4:
        np_img = np_img[:, :, :3]

    # Convert NumPy array to torch Tensor
    tensor_img = torch.from_numpy(np_img).permute(2, 0, 1)

    # Add batch dimension
    tensor_img = tensor_img.unsqueeze(0)

    return tensor_img

# suggested by chatGPT
def tensor_to_pil(_img):
    """
    Convert a torch Tensor of shape [B,H,W,C] to a PIL Image.
    A batch of B images, height H, width W, with C channels (generally C=3 for RGB).
    """

    # Move tensor to CPU and detach if necessary
    np_img = _img.squeeze(0).mul(255).clamp(0, 255).byte().cpu().numpy()

    # Convert NumPy array to PIL Image
    pil_img = Image.fromarray(np_img)

    return pil_img

def print_3d_tensor(_tensor):
    # Ensure the tensor is a 3D tensor for visualization
    if _tensor.dim() != 3:
        print("Input tensor must be 3D.")
        return

    # Iterate through the first dimension
    for i in range(_tensor.size(0)):
        print(f"Layer {i}:")
        # Convert to NumPy for better printing and format it
        array = _tensor[i].numpy()
        for row in array:
            print(' | '.join(map(str, row)))  # Print each row
        print()  # Add a new line for separation


# Function to print the 4D tensor
def print_4d_tensor(_tensor):
    # Get the size of each dimension
    d1, d2, d3, d4 = _tensor.size()

    for i in range(d1):  # Iterate over the first dimension
        print(f"Layer {i}:")
        for j in range(d2):  # Iterate over the second dimension
            print(f"  Slice {j}:")
            # Print the slice (3rd and 4th dimensions)
            print(_tensor[i, j].numpy())  # Convert to numpy for better visualization
        print()  # Blank line for separation


if __name__ == '__main__':
    # Example usage
    rows = 2  # Set your number of rows
    cols = 3  # Set your number of columns
    d2_tensor = torch.randint(1, 2, (3, 2))
    d3_tensor = torch.randint(0, 2, (3, rows, cols))
    d4_tensor = torch.randint(0, 2, (2, 3, rows, cols))
    # Original tensor
    t = torch.tensor([[1, 2],
                      [3, 4],
                      [5, 6]])

    t2 = torch.tensor([[12, 21],
                      [33, 4],
                      [45, 16]])
    # New row of zeros
    zero = torch.zeros((3, 2), dtype=torch.int8)
    res = t2 - t
    print(res)






    # print(d2_tensor)
    # print(d2_tensor.unsqueeze(1))
    # print(d2_tensor.unsqueeze(0).ndim == 3)

    # Print the tensor as a table
    # print_4d_tensor(d4_tensor)
