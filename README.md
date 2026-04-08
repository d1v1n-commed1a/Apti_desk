# Apti desk 실행 방법

`Apti_desk_배포용.html` 단일 파일로 실행하는 웹 도구입니다.  
답안 저장/불러오기 기능은 Google Apps Script 웹앱과 연결해서 사용합니다.

## 0. 업데이트

- `v0.100 -> v0.110` : 구글시트에 기록이 계속 누적되던 문제를 해결했습니다. 같은 `시험이름 + 회차` 조합으로 저장하면 기존 데이터를 덮어쓰도록 정리했습니다.
- `v0.110 -> v0.120` : 모의고사 모드를 추가하고, 과목 구성 및 문항 수를 시험별로 설정할 수 있도록 개선했습니다. 사전 정답표 등록, 채점 및 재채점, 오답 기록까지 한 흐름으로 관리할 수 있게 확장했습니다.

## 1. Google 스프레드시트 준비

개인 Google 스프레드시트에 기록용 시트를 하나 만듭니다.  
어떤 시트를 써도 되지만, Apps Script를 붙여넣은 뒤에는 저장 대상 시트를 활성화한 상태로 사용하는 편이 가장 단순합니다.

## 2. Apps Script 코드 추가

스프레드시트에서 `확장프로그램 > Apps Script`로 들어간 뒤, 이 저장소의 [apps_script/Code.gs](/Users/bangdawon_skala/Library/Mobile%20Documents/com~apple~CloudDocs/HYU/26'-1_%E1%84%89%E1%85%A1%E1%86%BC%E1%84%87%E1%85%A1%E1%86%AB%E1%84%80%E1%85%B5%20%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8E%E1%85%A2%20%E1%84%8C%E1%85%B5%E1%84%8B%E1%85%AF%E1%86%AB/Apti_desk%20%E1%84%87%E1%85%A2%E1%84%91%E1%85%A9%E1%84%8B%E1%85%AD%E1%86%BC/apps_script/Code.gs) 내용을 그대로 붙여넣습니다.

현재 HTML은 아래 16개 컬럼 구조로 데이터를 저장합니다.

`시험이름`, `회차`, `생성일`, `총문항수`, `문항`, `과목순서`, `과목명`, `과목내문항번호`, `원본답`, `원본소요시간(초)`, `정답`, `원본채점결과`, `재도전답`, `재도전소요시간(초)`, `재도전채점결과`, `정답표시여부`

Apps Script 동작 방식은 다음과 같습니다.

1. `POST`로 받은 `testName`, `testRound`, `rows`를 저장합니다.
2. 같은 `시험이름 + 회차` 조합이 이미 있으면 기존 행을 지우고 새 데이터로 덮어씁니다.
3. `GET` 요청이 오면 헤더 포함 전체 시트 데이터를 JSON 배열로 반환합니다.

필요하면 아래 코드만 직접 복사해서 써도 됩니다.

```javascript
const HEADERS = [
  '시험이름',
  '회차',
  '생성일',
  '총문항수',
  '문항',
  '과목순서',
  '과목명',
  '과목내문항번호',
  '원본답',
  '원본소요시간(초)',
  '정답',
  '원본채점결과',
  '재도전답',
  '재도전소요시간(초)',
  '재도전채점결과',
  '정답표시여부',
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const rows = normalizeRows_(payload.rows);

    if (rows.length === 0) {
      return jsonResponse_({ success: false, message: 'rows is empty' });
    }

    const sheet = getSheet_();
    ensureHeader_(sheet);

    const testName = String(payload.testName || rows[0][0] || '').trim();
    const testRound = String(payload.testRound || rows[0][1] || '').trim();

    if (!testName || !testRound) {
      return jsonResponse_({ success: false, message: 'testName or testRound is empty' });
    }

    const lastRow = sheet.getLastRow();
    const existingRows = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues()
      : [];

    const preservedRows = existingRows.filter(function(row) {
      return !(String(row[0]).trim() === testName && String(row[1]).trim() === testRound);
    });

    sheet.clearContents();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    const nextRows = preservedRows.concat(rows);
    if (nextRows.length > 0) {
      sheet.getRange(2, 1, nextRows.length, HEADERS.length).setValues(nextRows);
    }

    return jsonResponse_({
      success: true,
      savedRows: rows.length,
      testName: testName,
      testRound: testRound,
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function doGet() {
  const sheet = getSheet_();
  ensureHeader_(sheet);
  const data = sheet.getDataRange().getValues();
  return jsonResponse_(data);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('postData.contents is empty');
  }

  const payload = JSON.parse(e.postData.contents);
  if (!payload || typeof payload !== 'object') {
    throw new Error('invalid JSON payload');
  }

  return payload;
}

function normalizeRows_(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter(function(row) {
      return Array.isArray(row);
    })
    .map(function(row) {
      const normalized = row.slice(0, HEADERS.length);
      while (normalized.length < HEADERS.length) {
        normalized.push('');
      }
      return normalized;
    });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getActiveSheet();
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const currentHeader = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsUpdate = HEADERS.some(function(header, index) {
    return currentHeader[index] !== header;
  });

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
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

주의: 복사한 URL은 반드시 `/exec`로 끝나는 배포 URL이어야 합니다.

## 4. HTML 파일에 URL 반영

[Apti_desk_배포용.html](/Users/bangdawon_skala/Library/Mobile%20Documents/com~apple~CloudDocs/HYU/26'-1_%E1%84%89%E1%85%A1%E1%86%BC%E1%84%87%E1%85%A1%E1%86%AB%E1%84%80%E1%85%B5%20%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8E%E1%85%A2%20%E1%84%8C%E1%85%B5%E1%84%8B%E1%85%AF%E1%86%AB/Apti_desk%20%E1%84%87%E1%85%A2%E1%84%91%E1%85%A9%E1%84%8B%E1%85%AD%E1%86%BC/Apti_desk_%EB%B0%B0%ED%8F%AC%EC%9A%A9.html) 상단의 아래 값을 본인 웹앱 URL로 바꿉니다.

```html
window.APTI_SHARE_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: '여기에_웹앱_URL/exec'
});
```

## 5. 실행 방법

이 프로젝트는 빌드 과정이 없습니다. [Apti_desk_배포용.html](/Users/bangdawon_skala/Library/Mobile%20Documents/com~apple~CloudDocs/HYU/26'-1_%E1%84%89%E1%85%A1%E1%86%BC%E1%84%87%E1%85%A1%E1%86%AB%E1%84%80%E1%85%B5%20%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8E%E1%85%A2%20%E1%84%8C%E1%85%B5%E1%84%8B%E1%85%AF%E1%86%AB/Apti_desk%20%E1%84%87%E1%85%A2%E1%84%91%E1%85%A9%E1%84%8B%E1%85%AD%E1%86%BC/Apti_desk_%EB%B0%B0%ED%8F%AC%EC%9A%A9.html)을 브라우저에서 열어 사용하면 됩니다.

다만 저장/불러오기 기능은 `file://`로 직접 열면 차단될 수 있으므로, 가능하면 로컬 서버로 실행하는 것이 안전합니다.

예시:

```bash
cd /path/to/Apti_desk
python3 -m http.server 8000
```

그 다음 브라우저에서 `http://localhost:8000/Apti_desk_배포용.html`로 접속합니다.

## 6. 사용 흐름

1. 상단에서 시험 이름과 회차를 선택하거나 새로 입력합니다.
2. OMR 답안, 정답, 재도전 결과까지 입력합니다.
3. `저장` 버튼으로 Google 스프레드시트에 기록합니다.
4. `불러오기` 버튼으로 저장된 시험 데이터를 다시 불러옵니다.

## 7. 문제 발생 시 확인할 것

- 저장/불러오기가 안 되면 Apps Script 웹앱 권한이 `모든 사용자`로 배포되었는지 확인합니다.
- `APPS_SCRIPT_URL`이 최신 배포 URL인지 확인합니다.
- URL이 `/exec`로 끝나는지 확인합니다.
- 브라우저에서 로컬 파일로 직접 열었다면 로컬 서버로 다시 실행합니다.
- 기존 시트에 예전 6열 구조 데이터만 있더라도, 새로 저장하면 최신 16열 구조로 다시 기록됩니다.
