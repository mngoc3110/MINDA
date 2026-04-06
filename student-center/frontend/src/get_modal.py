import re

with open('/Users/minhngoc/HCMUE/MINDA/student-center/frontend/src/app/(dashboard)/profile/page.tsx', 'r') as f:
    text = f.read()

start = text.find('{isEditingProfile && (')
end = text.find('      {/* Add Info Modal */}', start)
print(text[start:end])
