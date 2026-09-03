import numpy as np
from PIL import Image, ImageEnhance

# Preset Thermal Color Palettes (Paper RGB, Ink RGB)
PALETTES = {
    "classic_cream": ([242, 239, 233], [32, 32, 30]),    # Standard thermal paper
    "aged_yellow":   ([235, 222, 190], [50, 42, 35]),    # Old, UV-faded receipt
    "blue_thermal":  ([240, 244, 248], [25, 40, 90]),    # Distinct blue-ink paper
    "stark_bw":      ([255, 255, 255], [0, 0, 0]),       # Pure high-contrast 1-bit
}

def get_bayer_matrix(size):
    if size == 2:
        return np.array([[0, 2], [3, 1]]) / 4.0
    smaller = get_bayer_matrix(size // 2) * (size ** 2)
    return np.block([
        [smaller + 0, smaller + 2],
        [smaller + 3, smaller + 1]
    ]) / (size ** 2)

def generate_thermal_receipt(
    input_path,
    output_path,
    print_width=400,          # Thermal paper pixel width (300-600 looks authentic)
    contrast=1.7,             # 1.0 to 2.5 (Higher pushes light grays out)
    brightness=1.0,           # Adjust before dithering
    dither_type="bayer8",     # Options: 'bayer4', 'bayer8', 'floyd_steinberg'
    palette="classic_cream",  # Key from PALETTES dictionary
    dead_pin_density=0.01,    # Percentage of dead printhead lines (0.0 to 0.05)
    serrated_edges=True       # Tear paper edge at top and bottom
):
    # 1. Load and Scale Resolution (Low DPI is key for authentic dot scale)
    img = Image.open(input_path).convert('L')
    aspect_ratio = img.height / img.width
    print_height = int(print_width * aspect_ratio)
    img = img.resize((print_width, print_height), Image.Resampling.LANCZOS)

    # 2. Adjust Contrast & Brightness
    img = ImageEnhance.Brightness(img).enhance(brightness)
    img = ImageEnhance.Contrast(img).enhance(contrast)

    # 3. Apply Dithering
    if dither_type == "floyd_steinberg":
        # Floyd-Steinberg Error Diffusion
        binary_img = img.convert('1', dither=Image.DITHER.FLOYDSTEINBERG)
        binary_mask = np.array(binary_img, dtype=bool)
    else:
        # Bayer Ordered Dithering Matrix (4x4 or 8x8)
        bayer_size = 4 if dither_type == "bayer4" else 8
        bayer = get_bayer_matrix(bayer_size)

        tiles_y = int(np.ceil(print_height / bayer_size))
        tiles_x = int(np.ceil(print_width / bayer_size))
        bayer_grid = np.tile(bayer, (tiles_y, tiles_x))[:print_height, :print_width]

        img_arr = np.array(img) / 255.0
        binary_mask = img_arr > bayer_grid

    # 4. Color Palette Mapping
    paper_color, ink_color = PALETTES.get(palette, PALETTES["classic_cream"])
    output_arr = np.zeros((print_height, print_width, 3), dtype=np.uint8)
    output_arr[binary_mask] = paper_color
    output_arr[~binary_mask] = ink_color

    # 5. Dead Thermal Pin Dropouts (Horizontal faded lines)
    if dead_pin_density > 0:
        num_dropouts = int(print_height * dead_pin_density)
        if num_dropouts > 0:
            dropout_rows = np.random.choice(print_height, size=num_dropouts, replace=False)
            output_arr[dropout_rows, :] = paper_color

    # 6. Serrated Top & Bottom Paper Tear
    if serrated_edges:
        x = np.arange(print_width)
        tooth_size = 12  # Frequency of teeth
        tooth_depth = 6  # Height of teeth in pixels

        # Sine wave tooth pattern
        teeth = (np.abs(np.sin(x / tooth_size * np.pi)) * tooth_depth).astype(int)

        # Mask out top and bottom transparent/dark background
        bg_color = np.array([20, 20, 20], dtype=np.uint8)  # Background canvas
        for col in range(print_width):
            output_arr[:teeth[col], col] = bg_color
            output_arr[print_height - tooth_depth + teeth[col]:, col] = bg_color

    Image.fromarray(output_arr).save(output_path)

# Example Usage:
generate_thermal_receipt(
    input_path="input.jpg",
    output_path="receipt_custom.png",
    print_width=450,
    contrast=1.8,
    dither_type="bayer8",
    palette="classic_cream",
    dead_pin_density=0.015,
    serrated_edges=True
)
