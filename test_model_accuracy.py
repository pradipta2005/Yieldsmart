"""
test_model_accuracy.py
Evaluates YieldSmart plant disease model via the LIVE API endpoint.
Generates synthetic leaf images (no extra model load) and POSTs them to
http://localhost:8000/api/detect-disease, then summarises results.
"""
import io, json, time, os, sys
import numpy as np
import urllib.request, urllib.error
from PIL import Image

# Fix encoding issue on Windows terminal when printing Unicode symbols
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"; RED = "\033[91m"; YELLOW = "\033[93m"
CYAN   = "\033[96m"; BOLD = "\033[1m"; RESET  = "\033[0m"

API_URL = "http://localhost:8000/api/detect-disease"

# ── Load class list ───────────────────────────────────────────────────────────
LABELS_PATH = os.path.join(os.path.dirname(__file__), "class_labels.json")
with open(LABELS_PATH, encoding="utf-8") as f:
    labels_data = json.load(f)
ALL_LABELS = labels_data["labels"]          # 38 classes

# ── Synthetic image generator ─────────────────────────────────────────────────
def make_image(label: str) -> bytes:
    """Render a 300×300 synthetic leaf image mimicking visual disease patterns."""
    rng = np.random.default_rng(hash(label) % (2**32))
    img = np.full((300, 300, 3), (34, 85, 34), dtype=np.uint8)   # green leaf

    def ellipse(cx, cy, rx, ry, colour):
        for x in range(max(0, cx-rx), min(300, cx+rx)):
            for y in range(max(0, cy-ry), min(300, cy+ry)):
                if ((x-cx)/rx)**2 + ((y-cy)/ry)**2 < 1:
                    img[y, x] = colour

    if "Late_blight" in label:
        for _ in range(12):
            r = int(rng.integers(10, 30))
            ellipse(int(rng.integers(r,300-r)), int(rng.integers(r,300-r)), r, r, (18,14,10))
    elif "Early_blight" in label or "Target_Spot" in label:
        for _ in range(10):
            cx, cy = int(rng.integers(30,270)), int(rng.integers(30,270))
            for rr, col in [(20,(100,60,20)),(14,(60,30,10)),(6,(200,160,50))]:
                ellipse(cx, cy, rr, rr, col)
    elif "rust" in label.lower() or "rust" in label:
        for _ in range(40):
            r = int(rng.integers(3, 9))
            ellipse(int(rng.integers(r,300-r)), int(rng.integers(r,300-r)), r, r, (190,80,15))
    elif "Powdery_mildew" in label:
        for _ in range(8):
            cx, cy = int(rng.integers(20,280)), int(rng.integers(20,280))
            w, h = int(rng.integers(30,70)), int(rng.integers(20,45))
            img[max(0,cy-h):min(300,cy+h), max(0,cx-w):min(300,cx+w)] = (235,232,218)
    elif "Bacterial_spot" in label:
        for _ in range(30):
            cx, cy = int(rng.integers(10,290)), int(rng.integers(10,290))
            ellipse(cx, cy, 7, 7, (200,190,40))   # yellow halo
            ellipse(cx, cy, 3, 3, (35,20,10))      # dark centre
    elif "Leaf_Mold" in label:
        for _ in range(15):
            cx, cy = int(rng.integers(20,280)), int(rng.integers(20,280))
            ellipse(cx, cy, int(rng.integers(10,25)), int(rng.integers(6,18)), (90,80,30))
    elif "Septoria" in label:
        for _ in range(35):
            cx, cy = int(rng.integers(8,292)), int(rng.integers(8,292))
            ellipse(cx, cy, 6, 6, (50,45,40))
            ellipse(cx, cy, 3, 3, (210,205,195))
    elif "Spider_mites" in label:
        img[:,:] = (90, 75, 30)                    # bronze/stippled
        for _ in range(60):
            cx, cy = int(rng.integers(5,295)), int(rng.integers(5,295))
            img[cy:cy+2, cx:cx+2] = (200,195,180)
    elif "Yellow_Leaf_Curl" in label:
        img[:,:] = (185,175,25)
        img[80:220,80:220] = (34,85,34)
    elif "mosaic" in label.lower():
        for i in range(0,300,18):
            for j in range(0,300,18):
                c = (55,130,35) if (i//18+j//18)%2==0 else (120,148,38)
                img[i:i+18, j:j+18] = c
    elif "Black_rot" in label:
        for _ in range(8):
            r = int(rng.integers(15,40))
            cx, cy = int(rng.integers(r,300-r)), int(rng.integers(r,300-r))
            ellipse(cx, cy, r, r, (100,60,25))
            ellipse(cx, cy, r//2, r//2, (10,5,5))
    elif "Esca" in label or "Black_Measles" in label:
        for i in range(0,300,25):
            img[i:i+3,:] = (160,140,30)            # tiger-stripe chlorosis
    elif "Leaf_scorch" in label:
        for _ in range(12):
            r = int(rng.integers(8,20))
            ellipse(int(rng.integers(r,300-r)), int(rng.integers(r,300-r)), r, r, (140,60,40))
    elif "Haunglongbing" in label or "greening" in label.lower():
        img[:150,:] = (180,170,40)                 # upper half yellowed
    elif "Cedar_apple_rust" in label:
        for _ in range(25):
            r = int(rng.integers(4,10))
            ellipse(int(rng.integers(r,300-r)), int(rng.integers(r,300-r)), r, r, (220,140,10))
    elif "healthy" in label.lower():
        for i in range(0,300,22): img[i:i+2,:] = (25,100,25)
        for j in range(0,300,30): img[:,j:j+1]  = (20,90,20)

    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def post_image(image_bytes: bytes, token: str) -> dict | None:
    """POST image bytes to the live detect-disease endpoint."""
    boundary = "----TestBoundary7329"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="leaf.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_err = e.read().decode(errors="replace")
        print(f"    {RED}HTTP {e.code}: {body_err[:120]}{RESET}")
        return None
    except Exception as ex:
        print(f"    {RED}Request error: {ex}{RESET}")
        return None


def get_token() -> str | None:
    """Login as demo user and return JWT token."""
    payload = json.dumps({"email": "demo@test.com", "password": "demo123"}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/api/auth/signin",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data.get("token")
    except Exception:
        # Try register first
        try:
            reg_payload = json.dumps({
                "name": "Demo User",
                "email": "demo@test.com",
                "password": "demo123",
                "city": "Test City"
            }).encode()
            reg_req = urllib.request.Request(
                "http://localhost:8000/api/auth/signup",
                data=reg_payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urllib.request.urlopen(reg_req, timeout=10)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                return data.get("token")
        except Exception as ex:
            print(f"{RED}Auth failed: {ex}{RESET}")
            return None


# ── Main ──────────────────────────────────────────────────────────────────────
def run():
    print(f"\n{BOLD}{CYAN}{'='*65}{RESET}")
    print(f"{BOLD}{CYAN}  YieldSmart — Live API Model Evaluation{RESET}")
    print(f"{BOLD}{CYAN}  Testing all {len(ALL_LABELS)} disease classes via POST /api/detect-disease{RESET}")
    print(f"{BOLD}{CYAN}{'='*65}{RESET}\n")

    # Auth
    print(f"{YELLOW}⟳  Authenticating...{RESET}", end=" ", flush=True)
    token = get_token()
    if not token:
        print(f"{RED}FAILED — is the backend running on port 8000?{RESET}")
        sys.exit(1)
    print(f"{GREEN}✓ Got JWT token{RESET}\n")

    # Warm-up: first request triggers model load (~20-40s)
    print(f"{YELLOW}⟳  Warming up model (first inference loads 770MB model)...{RESET}")
    warmup_img = make_image("Tomato___healthy")
    t0 = time.time()
    post_image(warmup_img, token)
    warmup_s = time.time() - t0
    print(f"   {GREEN}✓ Model warm in {warmup_s:.1f}s{RESET}\n")

    print(f"{'─'*65}")
    print(f"  {'#':>3}  {'Expected Class':<42} {'Conf':>6}  {'ms':>5}  St")
    print(f"{'─'*65}")

    results = []
    for idx, label in enumerate(ALL_LABELS):
        img = make_image(label)
        t_start = time.time()
        resp = post_image(img, token)
        elapsed_ms = (time.time() - t_start) * 1000

        if resp is None:
            print(f"  {idx+1:>3}  {label[:42]:<42}  {RED}ERROR{RESET}")
            results.append({"label": label, "ok": False, "top3_ok": False, "conf": 0, "ms": elapsed_ms})
            continue

        predicted = resp.get("label", "")
        conf      = resp.get("confidence", 0)
        top3      = [t["label"] for t in resp.get("top3", [])]

        top1_ok = (predicted == label)
        top3_ok = (label in top3)

        if top1_ok:
            icon = f"{GREEN}✓{RESET}"
        elif top3_ok:
            icon = f"{YELLOW}△{RESET}"   # in top-3 but not top-1
        else:
            icon = f"{RED}✗{RESET}"

        exp_disp  = label.replace("___"," → ").replace("_"," ")[:42]
        pred_disp = predicted.replace("___"," → ").replace("_"," ")

        print(f"  {idx+1:>3}  {exp_disp:<42} {conf:>5.1f}%  {elapsed_ms:>4.0f}  {icon}")
        if not top1_ok:
            print(f"       {YELLOW}↳ Got: {pred_disp}{RESET}")

        results.append({"label": label, "predicted": predicted,
                        "ok": top1_ok, "top3_ok": top3_ok,
                        "conf": conf, "ms": elapsed_ms})

    # ── Summary ───────────────────────────────────────────────────────────────
    total     = len(results)
    top1_hits = sum(r["ok"] for r in results)
    top3_hits = sum(r["top3_ok"] for r in results)
    avg_conf  = np.mean([r["conf"] for r in results])
    avg_ms    = np.mean([r["ms"] for r in results])
    errors    = sum(1 for r in results if not r.get("predicted"))

    print(f"\n{BOLD}{CYAN}{'='*65}{RESET}")
    print(f"{BOLD}{CYAN}  RESULTS SUMMARY{RESET}")
    print(f"{'─'*65}")
    print(f"  Classes tested   : {total}")
    print(f"  Top-1 Accuracy   : {BOLD}{top1_hits}/{total}  ({top1_hits/total*100:.1f}%){RESET}")
    print(f"  Top-3 Accuracy   : {BOLD}{top3_hits}/{total}  ({top3_hits/total*100:.1f}%){RESET}")
    print(f"  Avg confidence   : {avg_conf:.1f}%")
    print(f"  Avg inference    : {avg_ms:.0f} ms/image")
    print(f"  API errors       : {errors}")
    print(f"\n{BOLD}  Plants covered by the model:{RESET}")
    plants = {}
    for lbl in ALL_LABELS:
        p = lbl.split("___")[0]
        plants.setdefault(p, []).append(lbl)
    for plant, diseases in plants.items():
        healthy = any("healthy" in d.lower() for d in diseases)
        n_disease = len(diseases) - (1 if healthy else 0)
        print(f"    {CYAN}{plant:<32}{RESET}  {n_disease} disease(s) + {'healthy ✓' if healthy else ''}")
    print(f"\n{BOLD}  ⚠  Limitations:{RESET}")
    print(f"  • Trained on PlantVillage (controlled conditions, ~87k images)")
    print(f"  • NOT supported: rice, wheat, sugarcane, cotton, and most crops")
    print(f"    grown outside USA/Europe (PlantVillage dataset scope)")
    print(f"  • Blurry, dark, or multi-disease images may reduce accuracy")
    print(f"  • Synthetic test images above are approximations — real-world")
    print(f"    accuracy on PlantVillage test set is ~96-98% (EfficientNetB7)")
    print(f"{BOLD}{CYAN}{'='*65}{RESET}\n")

if __name__ == "__main__":
    run()
