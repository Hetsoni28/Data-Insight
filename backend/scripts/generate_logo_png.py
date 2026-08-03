import os
from PIL import Image, ImageDraw, ImageFont

def generate_logo_png():
    os.makedirs(os.path.join(os.path.dirname(__file__), "..", "app", "static"), exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__), "..", "app", "static", "logo.png")
    frontend_out_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.png")

    # High resolution 4x rendering (512x512) for retina crispness
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Subtle soft rounded container badge
    badge_margin = 32
    badge_radius = 88
    # Gradient-like background / rich emerald badge
    draw.rounded_rectangle(
        [badge_margin, badge_margin, size - badge_margin, size - badge_margin],
        radius=badge_radius,
        fill=(240, 253, 244, 255), # #F0FDF4 emerald-50
        outline=(167, 243, 208, 255), # #A7F3D0 emerald-200
        width=12
    )

    # Coordinates scaled to 512
    # Icon inner bounding box
    # "D" curve
    d_x0, d_y0 = 120, 140
    d_w, d_h = 170, 232
    
    # Left stem of D
    draw.line([(d_x0, d_y0), (d_x0, d_y0 + d_h)], fill=(16, 185, 129, 255), width=36)
    # Top bar
    draw.line([(d_x0, d_y0), (d_x0 + 70, d_y0)], fill=(16, 185, 129, 255), width=36)
    # Bottom bar
    draw.line([(d_x0, d_y0 + d_h), (d_x0 + 70, d_y0 + d_h)], fill=(5, 150, 105, 255), width=36)
    # Arc
    draw.arc([d_x0 - 20, d_y0, d_x0 + d_w, d_y0 + d_h], start=270, end=90, fill=(16, 185, 129, 255), width=36)

    # Right vertical bar "I"
    i_x = 380
    draw.line([(i_x, d_y0), (i_x, d_y0 + d_h)], fill=(5, 150, 105, 255), width=36)

    # Trend line: (170, 290) -> (230, 230) -> (280, 270) -> (380, 150)
    pts = [(170, 295), (230, 235), (280, 275), (380, 155)]
    draw.line(pts, fill=(52, 211, 153, 255), width=24, joint="curve")

    # Trend nodes
    draw.ellipse([365, 140, 395, 170], fill=(255, 255, 255, 255), outline=(5, 150, 105, 255), width=6)
    draw.ellipse([157, 282, 183, 308], fill=(255, 255, 255, 255), outline=(16, 185, 129, 255), width=5)

    img.save(out_path, "PNG", optimize=True)
    img.save(frontend_out_path, "PNG", optimize=True)
    print(f"Generated logo at {out_path} and {frontend_out_path}")

if __name__ == "__main__":
    generate_logo_png()
