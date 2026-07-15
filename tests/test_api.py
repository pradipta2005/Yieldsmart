"""
test_api.py - YieldSmart Model Evaluation via Live API
Uses only: requests, PIL, json, numpy (no tensorflow)
"""
import io, json, os, sys, time
import requests
import numpy as np
from PIL import Image

GREEN  = "\033[92m"; RED = "\033[91m"; YELLOW = "\033[93m"
CYAN   = "\033[96m"; BOLD = "\033[1m"; RESET  = "\033[0m"

BASE   = "http://localhost:8000"
LABELS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "class_labels.json")

with open(LABELS, encoding="utf-8") as f:
    data = json.load(f)
ALL_LABELS = data["labels"]   # 38 classes

# ── Synthetic leaf image generator ────────────────────────────────────────────
def make_image(label: str) -> bytes:
    rng = np.random.default_rng(abs(hash(label)) % (2**31))
    canvas = np.full((256, 256, 3), (34, 85, 34), dtype=np.uint8)

    def circle(cx, cy, r, col):
        x0,y0 = max(0,cx-r), max(0,cy-r)
        x1,y1 = min(256,cx+r), min(256,cy+r)
        xs, ys = np.meshgrid(np.arange(x0,x1), np.arange(y0,y1))
        mask = (xs-cx)**2+(ys-cy)**2 < r**2
        canvas[y0:y1,x0:x1][mask] = col

    def rand_pt(margin=20):
        return int(rng.integers(margin, 256-margin)), int(rng.integers(margin, 256-margin))

    if "Late_blight" in label or "Late_Blight" in label:
        for _ in range(10): circle(*rand_pt(25), int(rng.integers(12,28)), (18,14,10))
    elif "Early_blight" in label:
        for _ in range(8):
            cx,cy = rand_pt(30)
            for rr,col in [(22,(100,65,20)),(14,(55,28,10)),(6,(210,165,55))]: circle(cx,cy,rr,col)
    elif "rust" in label.lower():
        for _ in range(35): circle(*rand_pt(10), int(rng.integers(3,9)), (190,80,15))
    elif "Powdery_mildew" in label:
        for _ in range(7):
            cx,cy = rand_pt(30)
            w,h = int(rng.integers(25,65)), int(rng.integers(15,40))
            canvas[max(0,cy-h):min(256,cy+h), max(0,cx-w):min(256,cx+w)] = (232,228,215)
    elif "Bacterial_spot" in label:
        for _ in range(28):
            cx,cy = rand_pt(12)
            circle(cx,cy,8,(195,185,40)); circle(cx,cy,3,(35,20,10))
    elif "Leaf_Mold" in label:
        for _ in range(14): circle(*rand_pt(20), int(rng.integers(10,24)), (88,78,28))
    elif "Septoria" in label:
        for _ in range(32):
            cx,cy = rand_pt(8)
            circle(cx,cy,6,(48,42,38)); circle(cx,cy,3,(208,202,192))
    elif "Spider_mites" in label:
        canvas[:,:] = (88,72,28)
        for _ in range(55):
            cx,cy = rand_pt(5)
            canvas[cy:cy+2,cx:cx+2] = (195,190,175)
    elif "Yellow_Leaf_Curl" in label:
        canvas[:,:] = (180,170,22); canvas[75:180,75:180] = (34,85,34)
    elif "mosaic" in label.lower():
        for i in range(0,256,16):
            for j in range(0,256,16):
                canvas[i:i+16,j:j+16] = (52,125,32) if (i//16+j//16)%2==0 else (118,142,36)
    elif "Black_rot" in label:
        for _ in range(7):
            cx,cy = rand_pt(35)
            circle(cx,cy,int(rng.integers(18,38)),(98,58,22))
            circle(cx,cy,int(rng.integers(6,14)),(10,5,5))
    elif "Esca" in label:
        for i in range(0,256,22): canvas[i:i+3,:] = (155,138,28)
    elif "Leaf_scorch" in label:
        for _ in range(12): circle(*rand_pt(18), int(rng.integers(8,20)), (138,58,38))
    elif "Haunglongbing" in label:
        canvas[:128,:] = (175,165,38)
    elif "Cedar_apple_rust" in label:
        for _ in range(22): circle(*rand_pt(10), int(rng.integers(4,11)), (218,138,8))
    elif "healthy" in label.lower():
        for i in range(0,256,20): canvas[i:i+2,:] = (24,98,24)
        for j in range(0,256,28): canvas[:,j:j+1] = (20,88,20)

    buf = io.BytesIO()
    Image.fromarray(canvas).save(buf, format="JPEG", quality=85)
    return buf.getvalue()

# ── Auth ──────────────────────────────────────────────────────────────────────
def get_token() -> str:
    # Try signin first
    r = requests.post(f"{BASE}/api/auth/signin",
                      json={"email":"testbot@yieldsmart.ai","password":"TestPass123"},
                      timeout=10)
    if r.status_code == 200:
        return r.json()["token"]
    # Register then signin
    r = requests.post(f"{BASE}/api/auth/signup",
                      json={"name":"Test Bot","email":"testbot@yieldsmart.ai",
                            "password":"TestPass123","city":"Delhi"},
                      timeout=10)
    if r.status_code == 200:
        return r.json()["token"]
    # No auth - just proceed without token (endpoint allows it)
    return ""

# ── Send one image ─────────────────────────────────────────────────────────────
def send(img_bytes: bytes, token: str) -> tuple[dict|None, float]:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    t0 = time.perf_counter()
    try:
        r = requests.post(
            f"{BASE}/api/detect-disease",
            files={"file": ("leaf.jpg", img_bytes, "image/jpeg")},
            headers=headers,
            timeout=120,
        )
        elapsed = (time.perf_counter() - t0) * 1000
        if r.status_code == 200:
            return r.json(), elapsed
        print(f"    {RED}HTTP {r.status_code}: {r.text[:100]}{RESET}")
        return None, elapsed
    except Exception as e:
        elapsed = (time.perf_counter() - t0) * 1000
        print(f"    {RED}Error: {e}{RESET}")
        return None, elapsed

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f"\n{BOLD}{CYAN}{'='*65}")
    print(f"  YieldSmart — Plant Disease Model Evaluation")
    print(f"  Testing all {len(ALL_LABELS)} classes via Live API")
    print(f"{'='*65}{RESET}\n")

    # Auth
    print(f"{YELLOW}⟳  Authenticating...{RESET}", end=" ", flush=True)
    token = get_token()
    print(f"{GREEN}✓{RESET}\n")

    # Warm-up (first call loads the keras model)
    print(f"{YELLOW}⟳  Sending warm-up image (loads 770MB Keras model)...{RESET}", flush=True)
    wu_img = make_image("Tomato___healthy")
    resp, wu_ms = send(wu_img, token)
    if resp is None:
        print(f"{RED}✗ Warm-up failed — is backend running? Try again.{RESET}\n")
        sys.exit(1)
    print(f"   {GREEN}✓ Model loaded  ({wu_ms/1000:.1f}s){RESET}\n")

    print(f"{'─'*65}")
    print(f"  {'#':>3}  {'Expected Class':<40} {'Conf':>6}  {'ms':>5}  {'Result'}")
    print(f"{'─'*65}")

    results = []
    for idx, label in enumerate(ALL_LABELS):
        img = make_image(label)
        resp, ms = send(img, token)

        if resp is None:
            print(f"  {idx+1:>3}  {label[:40]:<40}  {'---':>6}  {ms:>4.0f}  {RED}ERROR{RESET}")
            results.append(dict(label=label, ok=False, top3_ok=False, conf=0, ms=ms))
            continue

        predicted = resp.get("label","")
        conf      = resp.get("confidence", 0)
        top3_lbls = [t["label"] for t in resp.get("top3", [])]
        top1_ok   = predicted == label
        top3_ok   = label in top3_lbls

        icon = f"{GREEN}✓  correct{RESET}"    if top1_ok else \
               (f"{YELLOW}△  in top-3{RESET}" if top3_ok else \
                f"{RED}✗  wrong{RESET}")

        disp = label.replace("___"," → ").replace("_"," ")
        print(f"  {idx+1:>3}  {disp[:40]:<40} {conf:>5.1f}%  {ms:>4.0f}  {icon}")
        if not top1_ok:
            got = predicted.replace("___"," → ").replace("_"," ")
            print(f"       {YELLOW}↳ Got: {got}{RESET}")

        results.append(dict(label=label, predicted=predicted,
                            ok=top1_ok, top3_ok=top3_ok, conf=conf, ms=ms))

    # ── Summary ──────────────────────────────────────────────────────────────
    N     = len(results)
    top1  = sum(r["ok"] for r in results)
    top3  = sum(r["top3_ok"] for r in results)
    aconf = np.mean([r["conf"] for r in results])
    ams   = np.mean([r["ms"]   for r in results])

    print(f"\n{BOLD}{CYAN}{'='*65}")
    print(f"  RESULTS")
    print(f"{'─'*65}{RESET}")
    print(f"  Top-1 Accuracy  : {BOLD}{top1}/{N}  ({top1/N*100:.1f}%){RESET}")
    print(f"  Top-3 Accuracy  : {BOLD}{top3}/{N}  ({top3/N*100:.1f}%){RESET}")
    print(f"  Avg confidence  : {aconf:.1f}%")
    print(f"  Avg latency     : {ams:.0f} ms / image")

    print(f"\n{BOLD}  Coverage by Plant:{RESET}")
    plants: dict[str, list] = {}
    for lbl in ALL_LABELS:
        p = lbl.split("___")[0]
        plants.setdefault(p, []).append(lbl)
    for plant, classes in plants.items():
        n_dis = sum(1 for c in classes if "healthy" not in c.lower())
        has_h = any("healthy" in c.lower() for c in classes)
        print(f"    {CYAN}{plant:<32}{RESET} {n_dis} disease(s){'  + healthy' if has_h else ''}")

    print(f"\n{BOLD}  ⚠  Known Limitations:{RESET}")
    print(f"  • Trained exclusively on PlantVillage dataset (~87k lab images)")
    print(f"  • Supports only 14 plant species (see coverage above)")
    print(f"  • NOT supported: rice, wheat, sugarcane, cotton, banana etc.")
    print(f"  • May underperform on field photos (blur, shadow, mixed diseases)")
    print(f"  • Published EfficientNetB7 accuracy on PlantVillage: ~96-98%")
    print(f"{BOLD}{CYAN}{'='*65}{RESET}\n")

if __name__ == "__main__":
    main()
