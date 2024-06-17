import os
from PIL import Image, ImageOps

def crop_and_pad_images(input_folder, output_folder, crop_size=(380, 380), prefix="non-map"):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    count = 1
    for filename in os.listdir(input_folder):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff')):
            file_path = os.path.join(input_folder, filename)
            with Image.open(file_path) as img:
                # Ensure the image is in RGB mode
                # img = img.convert('RGB')

                width, height = img.size

                # Calculate cropping box
                left = (width - crop_size[0]) / 2
                top = (height - crop_size[1]) / 2
                right = (width + crop_size[0]) / 2
                bottom = (height + crop_size[1]) / 2

                # Crop the image
                img_cropped = img.crop((left, top, right, bottom))

                img_padded = ImageOps.pad(img_cropped, crop_size, color=(255, 255, 255))

                output_path = os.path.join(output_folder, f"{prefix}_{count}.jpeg")
                img_padded.save(output_path, "JPEG")
                count += 1

input_folder = 'GoogleScrap/notmap_testdata'
output_folder = 'GoogleScrap/resized_notmap_testdata'

crop_and_pad_images(input_folder, output_folder)
