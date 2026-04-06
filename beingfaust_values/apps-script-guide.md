# Google Apps Script 세팅 가이드

> 5분이면 끝. 피터공 구글 계정으로 진행.

---

## 1단계: Google Sheets 생성

1. [Google Sheets](https://sheets.google.com) 접속
2. **새 스프레드시트** 생성
3. 시트 이름을 `responses`로 변경 (하단 탭 더블클릭)
4. A1 행에 헤더 입력:

```
timestamp | room | name | rank1 | rank2 | rank3 | rank4 | rank5 | rank6
```

(각 셀에 하나씩. A1=timestamp, B1=room, C1=name, D1=rank1, ... I1=rank6)

5. **스프레드시트 ID 복사** — URL에서 `https://docs.google.com/spreadsheets/d/{이 부분}/edit` 복사

---

## 2단계: Apps Script 생성

1. 스프레드시트에서 **확장 프로그램 → Apps Script** 클릭
2. 기본 코드를 전부 지우고 아래 코드 붙여넣기:

```javascript
const SHEET_ID = '여기에_스프레드시트_ID_붙여넣기';
const SHEET_NAME = 'responses';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    sheet.appendRow([
      new Date().toISOString(),
      data.room || '',
      data.name || '',
      data.values[0] || '',
      data.values[1] || '',
      data.values[2] || '',
      data.values[3] || '',
      data.values[4] || '',
      data.values[5] || ''
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const room = e.parameter.room || '';
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const rows = data.slice(1)
      .filter(row => !room || row[1] === room)
      .map(row => ({
        timestamp: row[0],
        room: row[1],
        name: row[2],
        values: [row[3], row[4], row[5], row[6], row[7], row[8]]
      }));
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', count: rows.length, data: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. `SHEET_ID` 부분을 1단계에서 복사한 스프레드시트 ID로 교체
4. **Ctrl+S** (저장)

---

## 3단계: 배포

1. **배포 → 새 배포** 클릭
2. 유형 선택: **웹 앱**
3. 설정:
   - 설명: `BF Values API`
   - 실행 주체: **나** (본인 계정)
   - 액세스 권한: **모든 사용자** (로그인 불필요)
4. **배포** 클릭
5. 권한 승인 (구글 계정 권한 허용)
6. **웹 앱 URL 복사** — `https://script.google.com/macros/s/...../exec` 형태

배포ID: AKfycbwIMyfFbHv6cAlY8LF1-JraX1Zw9iOT5g12jfegE3iJOUd0lp0KfsQX-o6259ouAoHOdA
웹앱: https://script.google.com/macros/s/AKfycbwIMyfFbHv6cAlY8LF1-JraX1Zw9iOT5g12jfegE3iJOUd0lp0KfsQX-o6259ouAoHOdA/exec 

---

## 4단계: 아리공에게 URL 전달

복사한 URL을 아리공에게 알려주면 index.html과 dashboard.html에 연결합니다.

---

## 테스트

배포 후 브라우저에서 직접 테스트:

```
# 데이터 조회 (GET)
https://script.google.com/macros/s/YOUR_ID/exec

# 특정 방 조회
https://script.google.com/macros/s/YOUR_ID/exec?room=TEST
```
