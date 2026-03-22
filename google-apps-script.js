// ═══════════════════════════════════════════════════════════
// Collierville Operations Hub — Google Apps Script
// ═══════════════════════════════════════════════════════════
//
// SETUP INSTRUCTIONS:
// 1. Create a new Google Sheet named "Collierville Operations Log"
// 2. Go to Extensions → Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click the Run button (▶) and select "setupSheets" to create tabs & headers
// 5. Authorize when prompted
// 6. Click Deploy → New Deployment
// 7. Select Type: Web app
// 8. Set "Execute as": Me
// 9. Set "Who has access": Anyone
// 10. Click Deploy and authorize when prompted
// 11. Copy the Web App URL
// 12. Open index.html and replace YOUR_GOOGLE_APPS_SCRIPT_URL_HERE with the URL
//
// ═══════════════════════════════════════════════════════════

// Run this function ONCE to create all tabs with headers
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var checklistTabs = ['Opening', 'Closing', 'Weekly'];
  var prepTab = 'Prep';

  // Create checklist tabs
  for (var i = 0; i < checklistTabs.length; i++) {
    var name = checklistTabs[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Date', 'Task', 'Completed', 'Completed By']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 120);
      sheet.setColumnWidth(2, 400);
      sheet.setColumnWidth(3, 100);
      sheet.setColumnWidth(4, 130);
    }
  }

  // Create prep tab
  var prepSheet = ss.getSheetByName(prepTab);
  if (!prepSheet) {
    prepSheet = ss.insertSheet(prepTab);
  }
  if (prepSheet.getLastRow() === 0) {
    prepSheet.appendRow(['Date', 'Item', 'Par', 'On Hand', 'Prep Needed']);
    prepSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    prepSheet.setFrozenRows(1);
    prepSheet.setColumnWidth(1, 120);
    prepSheet.setColumnWidth(2, 180);
    prepSheet.setColumnWidth(3, 80);
    prepSheet.setColumnWidth(4, 80);
    prepSheet.setColumnWidth(5, 100);
  }

  // Remove default "Sheet1" if other tabs exist
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert('Setup complete! Tabs created with headers.');
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = data.sheet;
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Prep') {
      sheet.appendRow(['Date', 'Item', 'Par', 'On Hand', 'Prep Needed']);
    } else {
      sheet.appendRow(['Date', 'Task', 'Completed', 'Completed By']);
    }
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Remove existing rows for the same date to prevent duplicates
  removeDateRows(sheet, data.date);

  if (sheetName === 'Prep') {
    var prepData = data.prepData || [];
    for (var i = 0; i < prepData.length; i++) {
      var p = prepData[i];
      sheet.appendRow([
        data.date,
        p.item,
        p.par,
        p.onHand,
        p.prep
      ]);
    }
    sheet.appendRow(['---', '', '', '', '']);
  } else {
    var tasks = data.tasks || [];
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      sheet.appendRow([
        data.date,
        t.task,
        t.completed ? 'Yes' : 'No',
        t.completedBy || ''
      ]);
    }
    sheet.appendRow([
      data.date,
      'TOTAL: ' + data.completedTasks + '/' + data.totalTasks + ' completed',
      '',
      ''
    ]);
    sheet.appendRow(['---', '', '', '']);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', sheet: sheetName })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Removes all existing rows for a given date (and its separator row)
// so resubmitting overwrites instead of duplicating
function removeDateRows(sheet, date) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return; // only header row exists

  var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var rowsToDelete = [];

  for (var i = data.length - 1; i >= 0; i--) {
    var cellValue = String(data[i][0]).trim();
    if (cellValue === date || cellValue === '---') {
      // Check if this separator belongs to this date block
      if (cellValue === date) {
        rowsToDelete.push(i + 2); // +2 because row 1 is header, array is 0-indexed
      } else if (cellValue === '---') {
        // Only delete separator if it's adjacent to rows with this date
        // Check the row above (if it exists)
        if (i > 0) {
          var above = String(data[i - 1][0]).trim();
          if (above === date || above.indexOf('TOTAL:') !== -1) {
            rowsToDelete.push(i + 2);
          }
        }
        // Check the row below (if it exists)
        if (i < data.length - 1) {
          var below = String(data[i + 1][0]).trim();
          if (below === date) {
            rowsToDelete.push(i + 2);
          }
        }
      }
    }
  }

  // Also catch TOTAL rows for this date (column A has the date)
  var fullData = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];
  for (var i = fullData.length - 1; i >= 0; i--) {
    var col1 = String(fullData[i][0]).trim();
    var col2 = String(fullData[i][1]).trim();
    if (col1 === date && col2.indexOf('TOTAL:') !== -1) {
      if (rowsToDelete.indexOf(i + 2) === -1) {
        rowsToDelete.push(i + 2);
      }
    }
  }

  // Deduplicate and sort descending so row numbers stay valid as we delete
  rowsToDelete = rowsToDelete.filter(function(v, i, a) { return a.indexOf(v) === i; });
  rowsToDelete.sort(function(a, b) { return b - a; });

  for (var i = 0; i < rowsToDelete.length; i++) {
    sheet.deleteRow(rowsToDelete[i]);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    'Collierville Operations Hub endpoint is active.'
  );
}
