# Apti desk 실행 방법

`Apti_desk.html` 단일 파일로 실행하는 웹 도구입니다.  
답안 저장/불러오기 기능은 Google Apps Script 웹앱과 연결해서 사용합니다.

## 0. 업데이트

v0.100 -> v0.110 : 구글시트에 기록이 누적되는 문제를 해결했습니다. 

## 1. Google 스프레드시트 준비

개인 Google 스프레드시트에 기록용 시트를 하나 만듭니다.

## 2. Apps Script 코드 추가

스프레드시트에서 `확장프로그램 > Apps Script`로 들어간 뒤 아래 코드를 붙여넣습니다.

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const payload = JSON.parse(e.postData.contents);
  const rows = Array.isArray(payload) ? payload : payload.rows || [];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['시험이름', '회차', '생성일', '문항', '답', '소요시간(초)']);
  }

  if (rows.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'rows is empty' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const testName = rows[0][0];
  const testRound = rows[0][1];
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const existingRows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const rowIndexesToDelete = [];

    existingRows.forEach((row, index) => {
      if (row[0] === testName && row[1] === testRound) {
        rowIndexesToDelete.push(index + 2);
      }
    });

    for (let i = rowIndexesToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowIndexesToDelete[i]);
    }
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. 웹앱으로 배포

Apps Script에서 아래 순서로 배포합니다.

1. `배포 > 새 배포`
2. 유형: `웹 앱`
3. 실행 권한: `나`
4. 액세스 권한: `모든 사용자`
5. 배포 후 웹앱 URL 복사

주의:
복사한 URL은 반드시 `/exec`로 끝나는 배포 URL이어야 합니다.

## 4. HTML 파일에 URL 반영

`Apti_desk.html` 상단의 아래 값을 본인 웹앱 URL로 바꿉니다.

```html
window.APTI_SHARE_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: '여기에_웹앱_URL/exec'
});
```

## 5. 실행 방법

이 프로젝트는 빌드 과정이 없습니다. `Apti_desk.html`을 브라우저에서 열어 사용하면 됩니다.

다만 저장/불러오기 기능은 `file://`로 직접 열면 차단될 수 있으므로, 가능하면 로컬 서버로 실행하는 것이 안전합니다.

예시:

```bash
cd /path/to/Apti_desk
python3 -m http.server 8000
```

그 다음 브라우저에서 `http://localhost:8000/Apti_desk.html`로 접속합니다.

## 6. 사용 흐름

1. 상단에서 시험 이름과 회차를 선택하거나 새로 입력합니다.
2. OMR 답안을 입력합니다.
3. `저장` 버튼으로 Google 스프레드시트에 기록합니다.
4. `불러오기` 버튼으로 저장된 시험 데이터를 다시 불러옵니다.

## 7. 문제 발생 시 확인할 것

- 저장/불러오기가 안 되면 Apps Script 웹앱 권한이 `모든 사용자`로 배포되었는지 확인합니다.
- `APPS_SCRIPT_URL`이 최신 배포 URL인지 확인합니다.
- URL이 `/exec`로 끝나는지 확인합니다.
- 브라우저에서 로컬 파일로 직접 열었다면 로컬 서버로 다시 실행합니다.
