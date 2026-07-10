from PIL import Image

img = Image.open('/Users/macbook/Desktop/coding/projects/MINDA/student-center/frontend/public/graduate/2.png')
width, height = img.size
print(f"Image size: {width}x{height}")
