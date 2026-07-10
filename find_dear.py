import pytesseract
from PIL import Image

img = Image.open('/Users/macbook/Desktop/coding/projects/MINDA/student-center/frontend/public/graduate/2.png')
data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

for i in range(len(data['text'])):
    if 'Dear' in data['text'][i]:
        x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
        print(f"Found 'Dear' at x={x}, y={y}, w={w}, h={h}")

