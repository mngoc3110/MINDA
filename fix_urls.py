import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The corrupted pattern looks like: ${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}` }
    # We want to replace it with: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
    
    # Let's use a regex that matches the repeating structure
    pattern = r'\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| `\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \'\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \'http://localhost:8000\'}\'\}`}'
    
    new_content = re.sub(pattern, "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}", content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {filepath}")
        return True
    return False

def main():
    root_dir = "/Users/minhngoc/HCMUE/MINDA/student-center/frontend/src"
    total_fixed = 0
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                if fix_file(os.path.join(root, file)):
                    total_fixed += 1
    print(f"Total files fixed: {total_fixed}")

if __name__ == "__main__":
    main()
