"""
TextToLatex Service - Chuyen doi text toan hoc sang LaTeX.

2 che do:
  - LITE (mac dinh): Regex-based, 0 MB RAM, chay tren moi VPS
  - FULL: Mamba model ~3GB RAM (chi khi co du RAM)
"""
import os
import re
import gc

# Duong dan model (nam tai student-center/img2latex/)
MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "img2latex"
)

# Kiem tra xem model co ton tai khong
MODEL_AVAILABLE = os.path.exists(os.path.join(MODEL_DIR, "model.safetensors"))

# Singleton cache cho model (chi dung khi FULL mode)
_tokenizer = None
_model = None

# ============================================================
# CHE DO LITE: Regex-based (0 MB RAM, chay moi VPS)
# ============================================================

# Cac pattern toan hoc pho bien va cach chuyen sang LaTeX
MATH_REPLACEMENTS = [
    # Luy thua: x^2, x^3, x^10, a^n
    (r'([a-zA-Z0-9\)]+)\^(\d+)', r'$\1^{\2}$'),
    (r'([a-zA-Z0-9\)]+)\^\(([^)]+)\)', r'$\1^{\2}$'),

    # Chi so duoi: x_1, a_n
    (r'([a-zA-Z])_(\d+)', r'$\1_{\2}$'),
    (r'([a-zA-Z])_\(([^)]+)\)', r'$\1_{\2}$'),

    # Can bac hai: sqrt(x), sqrt(x+1)
    (r'sqrt\(([^)]+)\)', r'$\\sqrt{\1}$'),

    # Phan so: 1/2, (a+b)/(c+d)
    (r'\(([^)]+)\)/\(([^)]+)\)', r'$\\frac{\1}{\2}$'),
    (r'(\d+)/(\d+)', r'$\\frac{\1}{\2}$'),

    # Gioi han: lim x->0, lim(x->inf)
    (r'lim\s*\(?([a-z])\s*->\s*([^\s\)]+)\)?', r'$\\lim_{\1 \\to \2}$'),

    # Tich phan: integral, int
    (r'(?:integral|int)\s*\(([^)]+)\)', r'$\\int \1$'),

    # Tong: sum
    (r'sum\s*\(([^)]+)\)', r'$\\sum \1$'),

    # Vo cuc: infinity, inf
    (r'\binfinity\b|\binf\b', r'$\\infty$'),

    # Pi, theta, alpha, beta, gamma, delta, epsilon
    (r'\bpi\b', r'$\\pi$'),
    (r'\btheta\b', r'$\\theta$'),
    (r'\balpha\b', r'$\\alpha$'),
    (r'\bbeta\b', r'$\\beta$'),
    (r'\bgamma\b', r'$\\gamma$'),
    (r'\bdelta\b', r'$\\delta$'),
    (r'\bepsilon\b', r'$\\epsilon$'),
    (r'\blambda\b', r'$\\lambda$'),
    (r'\bsigma\b', r'$\\sigma$'),
    (r'\bomega\b', r'$\\omega$'),

    # Ham luong giac
    (r'\bsin\b', r'$\\sin$'),
    (r'\bcos\b', r'$\\cos$'),
    (r'\btan\b', r'$\\tan$'),
    (r'\blog\b', r'$\\log$'),
    (r'\bln\b', r'$\\ln$'),

    # Dau khong bang, lon hon bang, nho hon bang
    (r'!=', r'$\\neq$'),
    (r'>=', r'$\\geq$'),
    (r'<=', r'$\\leq$'),
    (r'\+\-', r'$\\pm$'),

    # Thuoc, khong thuoc, tap hop
    (r'\bin\b\s*\{', r'$\\in$ {'),
    (r'\bsubset\b', r'$\\subset$'),
    (r'\bunion\b', r'$\\cup$'),
    (r'\bintersect\b', r'$\\cap$'),

    # Mu am: x^(-1), x^(-2)
    (r'([a-zA-Z])\^\(-(\d+)\)', r'$\1^{-\2}$'),
]


def _lite_convert(text: str) -> str:
    """Chuyen doi math patterns trong text sang LaTeX bang regex (0 RAM)."""
    result = text
    for pattern, replacement in MATH_REPLACEMENTS:
        result = re.sub(pattern, replacement, result)

    # Merge cac $...$ lien tiep: $x^{2}$ $+$ -> $x^{2} +$
    result = re.sub(r'\$\s*\$', ' ', result)

    return result


def _has_math_content(text: str) -> bool:
    """Kiem tra text co chua bieu thuc toan khong."""
    math_indicators = [
        r'[a-z]\^\d',           # x^2
        r'\d/\d',               # 1/2
        r'sqrt\(',              # sqrt(
        r'\blim\b',             # lim
        r'\bint\b',             # int
        r'\bsin\b|\bcos\b',     # sin, cos
        r'\blog\b|\bln\b',      # log, ln
        r'!=|>=|<=',            # !=, >=, <=
        r'\bpi\b|\btheta\b',    # pi, theta
        r'_\d',                 # x_1
    ]
    combined = '|'.join(math_indicators)
    return bool(re.search(combined, text, re.IGNORECASE))


# ============================================================
# CHE DO FULL: Mamba model (can 4-8GB RAM)
# ============================================================

EOS_TOKEN = "<" + "|endoftext|" + ">"
ASSISTANT_TAG = "<" + "|assistant|" + ">\n"


def _load_model():
    """Load Mamba model (chi goi khi FULL mode)."""
    global _tokenizer, _model

    if _model is not None:
        return _tokenizer, _model

    if not MODEL_AVAILABLE:
        raise FileNotFoundError("Model khong kha dung")

    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM

    print(f"[TextToLatex] Dang nap Mamba model tu {MODEL_DIR}...")

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    _tokenizer.eos_token = EOS_TOKEN
    _tokenizer.pad_token = _tokenizer.eos_token

    try:
        zephyr_tok = AutoTokenizer.from_pretrained("HuggingFaceH4/zephyr-7b-beta")
        _tokenizer.chat_template = zephyr_tok.chat_template
    except Exception:
        pass

    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR, torch_dtype=torch.float32,
        low_cpu_mem_usage=True, residual_in_fp32=False
    )
    _model = torch.quantization.quantize_dynamic(
        _model, {torch.nn.Linear}, dtype=torch.qint8
    )
    _model = _model.eval()
    print("[TextToLatex] Model san sang (CPU + INT8)!")
    return _tokenizer, _model


def _full_convert(text: str) -> str:
    """Chuyen doi bang Mamba model (can GPU/RAM lon)."""
    import torch
    tokenizer, model = _load_model()
    messages = [{"role": "user", "content": text}]
    input_ids = tokenizer.apply_chat_template(
        messages, return_tensors="pt", add_generation_prompt=True
    )
    with torch.no_grad():
        out = model.generate(
            input_ids=input_ids, max_length=2000,
            temperature=0.9, top_p=0.7,
            eos_token_id=tokenizer.eos_token_id
        )
    decoded = tokenizer.batch_decode(out)[0]
    output = decoded.split(ASSISTANT_TAG)[-1]
    return output.split(EOS_TOKEN)[0].strip()


# ============================================================
# PUBLIC API
# ============================================================

def convert_text_to_latex(text: str) -> str:
    """Chuyen text toan sang LaTeX. Tu dong chon che do phu hop."""
    return _lite_convert(text)


def enhance_math_with_latex(text: str) -> str:
    """Tang cuong quiz text: chuyen bieu thuc toan thanh LaTeX."""
    if not _has_math_content(text):
        return text
    return _lite_convert(text)


def enhance_math_with_model(text: str) -> str:
    """Tang cuong quiz text bang Mamba model (chi khi co du RAM)."""
    if not MODEL_AVAILABLE:
        return _lite_convert(text)
    try:
        return _full_convert(text)
    except Exception as e:
        print(f"[TextToLatex] Fallback sang regex: {e}")
        return _lite_convert(text)


def release_model():
    """Giai phong RAM khi khong can model nua."""
    global _tokenizer, _model
    if _model is not None:
        del _model
        _model = None
    if _tokenizer is not None:
        del _tokenizer
        _tokenizer = None
    gc.collect()
    print("[TextToLatex] Da giai phong RAM.")
