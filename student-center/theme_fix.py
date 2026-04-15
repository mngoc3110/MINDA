import os

path = "/Users/minhngoc/HCMUE/MINDA/student-center/frontend/src/app/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

replaces = {
    "bg-[#F7F3EE]": "bg-bg-main",
    "to-[#F7F3EE]": "to-bg-main",
    "from-[#F7F3EE]": "from-bg-main",
    "text-[#1A1410]": "text-t-primary",
    "hover:text-[#1A1410]": "hover:text-t-primary",
    "text-[#5C4F42]": "text-t-secondary",
    "border-[#E2D9CE]": "border-border-card",
    "hover:bg-[#EEE9E1]": "hover:bg-bg-hover",
    "bg-white": "bg-bg-card",
    "bg-[#1A1410]": "bg-indigo-600",
    "hover:bg-[#2D2620]": "hover:bg-indigo-500",
    # Specific fix for Vertical Timeline inline styles
    "background: '#FFFFFF'": "background: 'var(--bg-card)'",
    "color: '#1A1410'": "color: 'var(--t-primary)'",
    "border: '1px solid #E2D9CE'": "border: '1px solid var(--border-card)'"
}

for k, v in replaces.items():
    text = text.replace(k, v)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Đã chỉnh sửa giao diện Landing Page!")
