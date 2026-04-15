import os

repo_dir = "/root/.cache/huggingface/modules/"
for root, dirs, files in os.walk(repo_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            try:
                with open(path, "r", encoding="utf-8") as file:
                    content = file.read()
                
                content = content.replace(".half()", ".float()")
                content = content.replace("torch.bfloat16", "torch.float32")
                
                if "cuda" in content or "CUDA" in content:
                    content = content.replace(".cuda()", ".to('cpu')")
                    content = content.replace("device=\"cuda\"", "device=\"cpu\"")
                    content = content.replace("torch.autocast(\"cuda\"", "torch.autocast(\"cpu\"")
                    content = content.replace("torch.cuda.amp.autocast", "torch.amp.autocast(\"cpu\")")
                    with open(path, "w", encoding="utf-8") as file:
                        file.write(content)
                    print(f"Patched {path}")
            except Exception as e:
                pass
