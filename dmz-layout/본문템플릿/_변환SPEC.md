# 변환 SPEC — clean MD → 자료별 renderedBodyHtml (백도 공유)

> 이 인스턴스는 아리공(볼트 담당). 볼트 .md 수정 가능.
> 통일부 DMZ 자료 본문을 design_sample 디자인대로 renderedBodyHtml(흰 박스 inner HTML)로 변환한다.

## 입력

`Assets/incoming/통일부/본문 데이터 HTML/clean/260521_통일부_{주제}.md`
- base64 이미지 제거한 클린 텍스트 버전 (15~28KB)
- 자료 구분 패턴:
  ```
  {스토리} / {타이틀} / {타입번호. 타입명}      ← 자료 헤더 (한 줄)
  **볼드 제목**                                  ← 본문 제목
  본문 문단들... [A][B][C] 빈칸 마커 포함
  ```
  다음 자료 헤더가 나오기 전까지가 한 자료의 본문.

## 타입 → 템플릿 매핑

CSV `수영공 비고` = MD 헤더의 `{타입번호. 타입명}`. 아래 템플릿 파일(`_dev/dmz-layout/본문템플릿/`)을 **반드시 Read해서 그 HTML 구조·인라인 스타일을 그대로 따른다.**

| 타입명 (헤더) | 템플릿 파일 |
|------|------|
| 1. 손글씨 (손글씨_폰트다른부분있음 포함) | `01-손글씨.html` |
| 2. 신문 | `02-신문.html` |
| 3. 사진 | `03-사진.html` |
| 4. 메시지_대화 | `04-메시지_대화.html` |
| 4. 메시지_독백 | `04-메시지_독백.html` |
| 4. 메시지_타임라인 | `04-메시지_타임라인.html` |
| 4. 메시지 (하위타입 없음) | 내용 보고 독백/대화 중 판단, 독백 기본 |
| 5. 지식인 | `05-지식인.html` |
| 6. 학술논문 | `06-학술논문.html` |
| 7. 신문_표 | `07-신문_표.html` |
| 8. 신문_연표 | `08-신문_연표.html` |
| 8. 트위터 | `08-트위터.html` |
| 9. 백과사전 (8. 백과사전 오타 포함) | `09-백과사전.html` |
| 10. 블로그 | `10-블로그.html` |
| 11. 시험지문 | `11-시험지문.html` |

## 변환 규칙 (SPEC)

1. **산출물 범위**: 흰 박스(`detail-body-wrap`) **inner HTML만**. 흰 박스 wrapper·핑크 헤더(태그·메타데이터)는 동현공 chrome이므로 **포함하지 않는다.** 템플릿 파일의 `<!-- renderedBodyHtml START -->` ~ `END` 사이가 정확히 산출 범위.
2. **스타일**: 전부 인라인(`dangerouslySetInnerHTML` 자족). 클래스는 폰트 클래스(`handwriting`/`typewriter`)와 빈칸(`dmz-blank`)만 사용.
3. **빈칸**: MD 본문의 `[A]` `[B]` `[C]` 마커를 그대로 cyan span으로:
   `<span class="dmz-blank" data-blank="A" style="display:inline-block; padding:0 0.5em; background:#3FE0DC; border-radius:4px; color:#1a2b4a;">[A]</span>`
   정답 텍스트는 넣지 않는다(게임 코드가 채움). 마커만 보존.
4. **색 토큰**: 핑크 #FF6EC7 / cyan #3FE0DC / 네이비 #1a2b4a / 그레이 #6E6E6E
5. **폰트 클래스**: 손글씨=`handwriting`, 타자기류=`typewriter`, 기본=Paperlogy(클래스 없음). 템플릿 따름.
6. **본문 충실**: MD 본문 텍스트를 누락 없이 옮긴다. 제목·문단·서명·날짜 등 구조 유지. MD의 `**볼드**`는 템플릿 결에 맞게 볼드 처리.
7. **사진 타입**: 사진 URL = `https://res.nolgong.com/dmz-archive/` + CSV 사진 컬럼 파일명. 단 백도는 사진 파일명을 모르므로, 사진 타입은 `03-사진.html` 구조를 따르되 `<img src>` 자리에 `{{PHOTO_URL}}` placeholder를 넣는다 (메인이 CSV 사진 컬럼으로 치환). 2장짜리는 placeholder 2개.

## 출력

`Assets/incoming/통일부/본문 데이터 HTML/clean/out_{주제영문}.html` 파일 하나에 모든 자료를 아래 구분자로 이어 붙인다:

```
<!--ITEM|{스토리}|{타이틀}|{타입명}-->
{renderedBodyHtml — 흰 박스 inner HTML}
<!--/ITEM-->
```

- 스토리·타이틀은 MD 헤더 그대로 (CSV 매칭 키). 파이프 `|`는 구분자이므로 값 안에 쓰지 말 것.
- 자료 순서는 MD 등장 순서.
- 파일 상단에 `<!-- {주제} 자료 N건 -->` 한 줄.

## 검증 (백도 자체)

- 모든 자료가 ITEM 블록으로 출력됐는지 (개수 = MD 헤더 개수)
- 빈칸 마커가 cyan span으로 빠짐없이 변환됐는지
- 한글 NFC·제어문자(`\x08` 등) 없는지
- 완료 후: 처리한 자료 개수 + 타입별 분포 + 출력 파일 경로 한 줄 보고
