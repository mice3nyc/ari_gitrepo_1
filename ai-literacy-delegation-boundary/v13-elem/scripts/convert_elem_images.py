#!/usr/bin/env python3
# 초등(elem) 새 컷 이미지 → 게임 webp 변환 (26장/시나리오, 중등 기준)
# 매핑(6/23, 피터공 확정): img01=c1(타이틀), img02=무시(상황, 슬롯 없음),
#   img03~05=c2_A/B/C, img06~14=c3_A1~C3, img15~23=c4_A1~C3, img24~26=c5_R1~R3,
#   img27~28=빈 장(무시). 쓰는 건 시나리오당 25장.
# 규격: 중앙 정사각 crop → 237x237 LANCZOS → webp q88. 프레임/보더는 CSS가 입힘.
# 시나리오: 1=독후감(s01) 2=동물발표(s02) 3=진로카드(s03) 4=캐릭터(s04) 5=역사검증(s05)
import os, sys
from PIL import Image

SRC = "/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/AI리터러시/scenario_elementary_images2"
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "images")
SIZE = 237
Q = 88

# 원본 img 번호(1-base) → 컷 접미사. 없는 번호(2,27,28)는 무시.
CUT = {1: "c1"}
for i, x in enumerate(["c2_A", "c2_B", "c2_C"]):            CUT[3 + i] = x
for i, x in enumerate(["c3_A1","c3_A2","c3_A3","c3_B1","c3_B2","c3_B3","c3_C1","c3_C2","c3_C3"]): CUT[6 + i] = x
for i, x in enumerate(["c4_A1","c4_A2","c4_A3","c4_B1","c4_B2","c4_B3","c4_C1","c4_C2","c4_C3"]): CUT[15 + i] = x
for i, x in enumerate(["c5_R1","c5_R2","c5_R3"]):           CUT[24 + i] = x

def center_square(im):
    w, h = im.size
    s = min(w, h)
    l = (w - s) // 2
    t = (h - s) // 2
    return im.crop((l, t, l + s, t + s))

def main():
    if not os.path.isdir(SRC):
        print("SRC 없음:", SRC); sys.exit(1)
    os.makedirs(DST, exist_ok=True)
    total = 0
    for s in range(1, 6):
        made = 0
        for num, suffix in sorted(CUT.items()):
            src = os.path.join(SRC, f"scenario_el_{s}_img__{num:02d}.png")
            if not os.path.exists(src):
                print(f"  [경고] 원본 없음: {os.path.basename(src)}"); continue
            out = os.path.join(DST, f"s0{s}_{suffix}.webp")
            im = Image.open(src).convert("RGB")
            im = center_square(im).resize((SIZE, SIZE), Image.LANCZOS)
            im.save(out, "WEBP", quality=Q, method=6)
            made += 1; total += 1
        print(f"s0{s}: {made}장 변환")
    print(f"== 총 {total}장 (목표 125) → {DST}")

if __name__ == "__main__":
    main()
