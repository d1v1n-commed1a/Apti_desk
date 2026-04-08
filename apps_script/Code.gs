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
