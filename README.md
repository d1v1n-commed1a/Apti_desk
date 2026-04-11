# Apti desk

단일 HTML 기반의 인적성 학습 도구입니다. Git 기준 배포 파일은 `Apti_desk_v0.130.html` 하나만 관리합니다.

## 주요 기능

- OMR 답안 입력
- 시험명/회차별 저장 및 불러오기
- Google Sheets 백업
- 과목별 문항 구성 커스텀
- 사전 정답표 등록
- 채점 후 재채점 모드 전환
- 오답 및 미응답 문항 노란색 재입력
- 과목별/총계 채점 결과 요약
- 문항별 소요시간 누적 기록
- 일반 타이머 / 모의고사 타이머

## 최근 변경

- 회차별로 과목명과 문항 수를 커스텀해서 저장/복원할 수 있도록 확장했습니다.
- `SK그룹 SKCT` 선택 시 기본 과목 구성을 `언어이해/자료해석/창의수리/언어추리/수열추리` 각 20문항으로 자동 채웁니다.
- 정답표 입력을 드롭다운이 아니라 OMR형 버튼 선택 UI로 바꿨습니다.
- 채점 후 버튼이 `채점하기 -> 재채점`으로 바뀌고 `채점 취소`가 함께 동작합니다.
- 틀린 문항과 미응답 문항을 노란색으로 다시 풀 수 있도록 재채점 흐름을 정리했습니다.
- 재채점 후에도 틀린 문항은 정답 버튼과 문항 번호를 빨간 계열로 표시합니다.
- 문항 소요시간을 문항별 누적 방식으로 수정했고, 타이머 pause/resume 구간은 제외되도록 고쳤습니다.

## 파일 구성

- `Apti_desk_v0.130.html`: 배포/공유 기준 단일 실행 파일
- `apps_script/Code.gs`: Google Sheets 연동용 Apps Script
- `apti_desk_icon.svg`
- `apti_desk_icon.png`

## Google Sheets 저장 구조

현재 HTML은 아래 16개 컬럼 구조로 저장합니다.

`시험명`, `회차`, `생성일`, `총문항수`, `문항`, `과목순서`, `과목명`, `과목내문항번호`, `원본답`, `원본소요시간(초)`, `정답`, `원본채점결과`, `재도전답`, `재도전소요시간(초)`, `재도전채점결과`, `정답표시여부`

같은 `시험명 + 회차` 조합으로 저장하면 기존 데이터를 덮어씁니다.

## Apps Script 연결

Google 스프레드시트에서 `확장프로그램 > Apps Script`로 들어가 웹앱을 만들고, HTML 상단의 `window.APTI_SHARE_CONFIG.APPS_SCRIPT_URL` 값을 본인 `/exec` URL로 바꾸면 됩니다.

### 1. 스프레드시트 준비

1. 새 Google 스프레드시트를 하나 만듭니다.
2. 기록용 시트를 하나 선택해 둡니다.
3. 이후 Apps Script는 "현재 활성 시트"에 저장하므로, 별도 수정이 없다면 이 시트가 저장 대상이 됩니다.

### 2. Apps Script 코드 넣기

1. 스프레드시트에서 `확장프로그램 > Apps Script`로 이동합니다.
2. 기본으로 생성된 코드를 지우고 저장소의 `apps_script/Code.gs` 내용을 그대로 붙여넣습니다.
3. 저장합니다.

현재 저장소에 포함된 Apps Script는 아래 역할을 합니다.

1. `POST`로 받은 `testName`, `testRound`, `rows` 저장
2. 같은 `시험명 + 회차` 기존 행 삭제 후 새 행으로 교체
3. `GET` 요청 시 전체 데이터 JSON 반환

핵심 헤더는 다음과 같습니다.

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
```

앱이 보내는 `rows`가 이 구조에 맞게 정리되어 들어오며, Apps Script는 행 길이를 자동 보정한 뒤 저장합니다.

### 3. 웹앱 배포

1. Apps Script 화면에서 `배포 > 새 배포`
2. 유형: `웹 앱`
3. 실행 권한: `나`
4. 액세스 권한: `모든 사용자`
5. 배포 후 생성된 웹앱 URL 복사

주의:

- URL은 반드시 `/exec` 로 끝나는 배포 URL이어야 합니다.
- `/dev` URL을 넣으면 브라우저에서 저장/불러오기가 불안정할 수 있습니다.
- 권한을 바꿨으면 반드시 재배포 후 새 URL로 다시 교체해야 합니다.

### 4. HTML에 URL 반영

`Apti_desk_v0.130.html` 상단에서 아래 값을 본인 웹앱 URL로 바꿉니다.

```html
window.APTI_SHARE_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: '여기에_본인_웹앱_URL/exec'
});
```

### 5. Apps Script 전체 코드

필요하면 아래 코드를 직접 복사해도 됩니다. 저장소의 `apps_script/Code.gs`와 동일한 내용입니다.

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

## 실행 방법

빌드 과정은 없습니다. 브라우저에서 `Apti_desk_v0.130.html`을 열면 됩니다.

저장/불러오기까지 안정적으로 쓰려면 로컬 서버 실행을 권장합니다.

```bash
cd /path/to/Apti_desk
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/Apti_desk_v0.130.html`로 접속합니다.

## 사용 흐름

1. 시험 이름과 회차를 선택합니다.
2. 필요하면 과목 구성을 설정합니다.
3. OMR에 1차 답을 입력합니다.
4. `정답표`에서 정답을 등록합니다.
5. `채점하기`로 1차 채점을 진행합니다.
6. 틀린 문항 또는 미응답 문항을 노란색으로 다시 풉니다.
7. `재채점`으로 결과를 다시 확인합니다.
8. `저장`으로 Google Sheets에 백업합니다.

## 주의 사항

- Git에는 `Apti_desk_v0.130.html`만 배포 파일로 올리고, `Apti_desk_배포용.html`과 `Apti_desk.html`은 제외합니다.
- 저장/불러오기가 실패하면 Apps Script 웹앱 권한이 `모든 사용자`인지 확인해야 합니다.
- 웹앱 URL은 반드시 `/exec`로 끝나는 배포 URL이어야 합니다.
- `file://`로 직접 열면 브라우저 정책 때문에 저장/불러오기가 차단될 수 있습니다.
