import os
from rembg import remove
from PIL import Image

assets_dir = r"E:\AI\anime-assistant\assets"
os.makedirs(assets_dir, exist_ok=True)

images = {
    "idle": r"C:\Users\Gauri Shankar\.gemini\antigravity\brain\ad4c5602-8727-4eb5-abb1-5a2f86c67315\kavya_idle_1776144670072.png",
    "happy": r"C:\Users\Gauri Shankar\.gemini\antigravity\brain\ad4c5602-8727-4eb5-abb1-5a2f86c67315\kavya_happy_1776144686415.png",
    "angry": r"C:\Users\Gauri Shankar\.gemini\antigravity\brain\ad4c5602-8727-4eb5-abb1-5a2f86c67315\kavya_angry_1776144702766.png",
    "blush": r"C:\Users\Gauri Shankar\.gemini\antigravity\brain\ad4c5602-8727-4eb5-abb1-5a2f86c67315\kavya_blush_1776144716718.png",
    "sad": r"C:\Users\Gauri Shankar\.gemini\antigravity\brain\ad4c5602-8727-4eb5-abb1-5a2f86c67315\kavya_sad_1776144733087.png"
}

for name, src_path in images.items():
    out_path = os.path.join(assets_dir, f"kavya_{name}.png")
    print(f"Processing {name}...")
    with open(src_path, "rb") as f:
        inp = f.read()
    result = remove(inp)
    with open(out_path, "wb") as f:
        f.write(result)
    print(f"  Saved -> {out_path}")

print("\nAll sprites processed successfully!")
