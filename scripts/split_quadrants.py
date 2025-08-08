"""
Utility to split 2×2 composite label images into individual quadrants with a small margin.

The supplied input images should each contain four designs arranged in a 2×2 grid. This
script crops each quadrant and saves them as separate images in the specified output
directory. It also writes a JSON index and a CSV seed file describing each design.

The margin is applied as a percentage of the quadrant size to ensure the entire jar
remains visible in the cropped result. Use a small margin (e.g. 0.05) to include a
bit of background around each jar. The margin cannot exceed 0.25.
"""

import argparse
import json
import os
import uuid
from typing import List, Tuple

from PIL import Image


def split_image(img: Image.Image, margin: float = 0.05) -> List[Tuple[Image.Image, int]]:
    """Split a 2×2 composite image into four cropped quadrants.

    Args:
        img: The PIL image to split.
        margin: Fraction of each quadrant to use as padding on all sides.

    Returns:
        A list of tuples (cropped_image, quadrant_index) where quadrant_index is
        0 for top-left, 1 for top-right, 2 for bottom-left, 3 for bottom-right.
    """
    if margin < 0 or margin > 0.25:
        raise ValueError("margin must be between 0 and 0.25")
    w, h = img.size
    half_w, half_h = w // 2, h // 2
    margin_x, margin_y = int(half_w * margin), int(half_h * margin)
    quads = []
    for row in range(2):
        for col in range(2):
            idx = row * 2 + col
            left = col * half_w
            upper = row * half_h
            right = left + half_w
            lower = upper + half_h
            # Apply margin inside the quadrant bounds; this ensures a small border
            crop_left = max(left + margin_x, 0)
            crop_upper = max(upper + margin_y, 0)
            crop_right = min(right - margin_x, w)
            crop_lower = min(lower - margin_y, h)
            cropped = img.crop((crop_left, crop_upper, crop_right, crop_lower))
            quads.append((cropped, idx))
    return quads


def process_directory(input_dir: str, output_dir: str, margin: float) -> Tuple[List[dict], List[dict]]:
    """Process all images in a directory and split them into quadrants.

    Args:
        input_dir: Directory containing input images (supported formats: PNG, JPG, JPEG).
        output_dir: Where the cropped quadrants will be saved.
        margin: The margin fraction to apply when cropping each quadrant.

    Returns:
        A tuple of (design_rows, design_set_rows). Each design row is a dict
        with keys matching the Supabase `designs` table fields.
    """
    os.makedirs(output_dir, exist_ok=True)
    design_rows = []
    design_set_rows = []
    for fname in sorted(os.listdir(input_dir)):
        if not fname.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        path = os.path.join(input_dir, fname)
        with Image.open(path) as img:
            quads = split_image(img, margin=margin)
        # Use a UUID for the set to group quadrants belonging to this source image
        set_id = str(uuid.uuid4())
        design_set_rows.append({
            "id": set_id,
            "source_image_url": fname,
            "note": None,
        })
        base = os.path.splitext(fname)[0]
        for cropped, idx in quads:
            design_id = str(uuid.uuid4())
            out_name = f"{base}_q{idx}.jpg"
            out_path = os.path.join(output_dir, out_name)
            # Ensure images are saved in RGB mode; JPEG cannot store alpha channel
            if cropped.mode != "RGB":
                rgb = cropped.convert("RGB")
            else:
                rgb = cropped
            rgb.save(out_path)
            design_rows.append({
                "id": design_id,
                "set_id": set_id,
                "quadrant_index": idx,
                "image_url": f"/designs/{out_name}",
            })
    return design_rows, design_set_rows


def write_outputs(design_rows: List[dict], design_set_rows: List[dict], output_dir: str) -> None:
    """Write the index JSON and CSV seed files for Supabase.

    Args:
        design_rows: List of design dicts.
        design_set_rows: List of design set dicts.
        output_dir: Directory where JSON and CSV will be written (should be the same
            directory where cropped images reside).
    """
    index_path = os.path.join(output_dir, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(design_rows, f, indent=2)
    # CSV for seeding Supabase via the table editor
    csv_path = os.path.join(output_dir, "designs_seed.csv")
    with open(csv_path, "w", encoding="utf-8") as f:
        # header
        f.write("id,set_id,quadrant_index,image_url,source_image\n")
        for row in design_rows:
            f.write(f"{row['id']},{row['set_id']},{row['quadrant_index']},{row['image_url']},{row['image_url']}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Split 2×2 composite images into quadrants and generate metadata.")
    parser.add_argument("--input_dir", required=True, help="Directory of input 2×2 composite images")
    parser.add_argument("--output_dir", required=True, help="Directory to write cropped quadrants and metadata")
    parser.add_argument("--margin", type=float, default=0.05, help="Margin fraction inside each quadrant (default 0.05)")
    args = parser.parse_args()
    design_rows, design_set_rows = process_directory(args.input_dir, args.output_dir, args.margin)
    write_outputs(design_rows, design_set_rows, args.output_dir)


if __name__ == "__main__":
    main()
