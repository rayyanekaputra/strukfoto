import numpy as np
from PIL import Image, ImageEnhance

def get_bayer_matrix(size=8):
    """Generates an N x N Bayer matrix for ordered dithering."""
    if size == 2:
        return np.array([[0, 2], [3, 1]]) / 4.0

    smaller = get_bayer_matrix(size // 2) * (size ** 2)
    return np.block([
        [smaller + 0, smaller + 2],
        [smaller + 3, smaller + 1]
    ]) / (size ** 2)

def thermal_receipt_filter(image_path, output_path, bayer_size=8, contrast_boost=1.6):
    # 1. Load image and convert to grayscale
    img = Image.open(image_path).convert('L')

    # 2. Boost contrast so midtones push into crisp binary dots
    img = ImageEnhance.Contrast(img).enhance(contrast_boost)
    img_arr = np.array(img) / 255.0
    h, w = img_arr.shape

    # 3. Create tiled Bayer Matrix matching image dimensions
    bayer = get_bayer_matrix(bayer_size)
    tiles_y = int(np.ceil(h / bayer_size))
    tiles_x = int(np.ceil(w / bayer_size))
    bayer_grid = np.tile(bayer, (tiles_y, tiles_x))[:h, :w]

    # 4. Compare pixels against Bayer threshold (Creates dot-matrix pattern)
    binary_mask = img_arr > bayer_grid

    # 5. Color Remap: Thermal Off-White Paper & Warm Charcoal Ink
    paper_rgb = np.array([242, 239, 233], dtype=np.uint8)  # Thermal paper cream
    ink_rgb   = np.array([32, 32, 30], dtype=np.uint8)      # Faded black ink

    output_arr = np.zeros((h, w, 3), dtype=np.uint8)
    output_arr[binary_mask] = paper_rgb
    output_arr[~binary_mask] = ink_rgb

    # 6. Add simulated thermal printhead glitch (faded horizontal pin dropouts)
    dropout_rows = np.random.choice(h, size=max(1, h // 150), replace=False)
    output_arr[dropout_rows, :] = paper_rgb

    Image.fromarray(output_arr).save(output_path)

# Quick Run:
thermal_receipt_filter("input.jpg", "receipt_output.png")
