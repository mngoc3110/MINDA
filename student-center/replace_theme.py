import os, glob

replacements = {
    'bg-[#050505]': 'bg-bg-main',
    'bg-[#18191A]': 'bg-bg-main',
    'bg-[#242526]': 'bg-bg-card',
    'bg-[#3A3B3C]': 'bg-bg-hover',
    'bg-[#3E4042]': 'bg-bg-hover',
    'bg-[#4E4F50]': 'bg-bg-hover',
    'border-[#3E4042]': 'border-border-card',
    'border-[#242526]': 'border-bg-card',
    'border-[#4E4F50]': 'border-border-card',
    'text-[#E4E6EB]': 'text-text-primary',
    'text-[#B0B3B8]': 'text-text-secondary',
}

files = glob.glob('frontend/src/**/*.tsx', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
        
print("DONE")
