import sys
from pathlib import Path

import pytest
from PIL import Image

# Ensure the repository root is on the import path so `scripts` can be resolved
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.split_quadrants import split_image

def create_test_image():
    """Create a 20x20 image with four colored quadrants."""
    img = Image.new("RGB", (20, 20))
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
    i = 0
    for row in range(2):
        for col in range(2):
            block = Image.new("RGB", (10, 10), colors[i])
            img.paste(block, (col * 10, row * 10))
            i += 1
    return img

def test_split_image_returns_four_quadrants():
    img = create_test_image()
    quads = split_image(img, margin=0.1)
    assert len(quads) == 4
    assert {idx for _, idx in quads} == {0, 1, 2, 3}
    for cropped, _ in quads:
        assert cropped.size == (8, 8)

def test_split_image_invalid_margin_raises():
    img = create_test_image()
    with pytest.raises(ValueError):
        split_image(img, margin=0.3)
