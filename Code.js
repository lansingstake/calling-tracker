/**
 * Calling and Ordination Tracker - Apps Script API Backend
 * ========================================================
 * UNIFIED VERSION: Reads/writes from a single "Records" tab
 * with a "Record Type" column (Calling, Ordination, Release).
 * 
 * Pulpit check-offs use "Pulpit Tracker" tab.
 * Config/PINs use "Settings" tab.
 * 
 * Deployed as a Web App: Execute as "Me", Access: "Anyone".
 */

function doGet(e) {
  return ContentService.createTextOutput("Calling Tracker API is active. Access via POST requests from the app.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return JSON_RESPONSE({ success: false, error: "No post data found" });
    }
    
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var pin = postData.pin;
    var username = postData.username;
    
    // Authenticate
    var auth = verifyPin(pin, username);
    if (!auth.authorized) {
      return JSON_RESPONSE({ success: false, error: auth.error || "Unauthorized: Invalid PIN" });
    }
    
    var result;
    if (action === "login") {
      var config = getConfig();
      result = { 
        success: true, 
        role: auth.role, 
        username: username || "Admin",
        highCouncilors: getHighCouncilors(),
        highCouncilorUnits: getHighCouncilorUnits(),
        stakePresidency: getStakePresidency(),
        admins: getAdmins(),
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
      };
      // Only return PINs to admin users
      if (auth.role === "admin") {
        result.adminPin = config.admin_pin;
        result.hcPin = config.hc_pin;
      }
    } else if (action === "getData") {
      result = getActiveData(auth.role, username);
    } else if (action === "updateRecord") {
      result = updateRecord(postData.type, postData.timestamp, postData.memberName, postData.updates, auth.role, username);
    } else if (action === "addRecord") {
      result = addRecord(postData.type, postData.record, auth.role);
    } else if (action === "searchHistory") {
      result = searchHistory(postData.query);
    } else if (action === "updateHighCouncilors") {
      if (auth.role !== "admin") return JSON_RESPONSE({ success: false, error: "Forbidden" });
      result = updateHighCouncilors(postData.names, postData.units);
    } else if (action === "updateStakePresidency") {
      if (auth.role !== "admin") return JSON_RESPONSE({ success: false, error: "Forbidden" });
      result = updateStakePresidency(postData.names);
    } else if (action === "updateAdmins") {
      if (auth.role !== "admin") return JSON_RESPONSE({ success: false, error: "Forbidden" });
      result = updateAdmins(postData.names);
    } else if (action === "updatePINs") {
      if (auth.role !== "admin") return JSON_RESPONSE({ success: false, error: "Forbidden" });
      result = updatePINs(postData.adminPin, postData.hcPin);
    } else {
      result = { success: false, error: "Unknown action: " + action };
    }
    
    return JSON_RESPONSE(result);
  } catch (err) {
    return JSON_RESPONSE({ success: false, error: err.toString() });
  }
}

function JSON_RESPONSE(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// CONFIGURATION — Reads from "Settings" tab
// ============================================================
// Settings tab format:
//   Row 1: Header (Setting, Value 1, Value 2, ... Value 12)
//   Row 2: Admin PIN | <pin>
//   Row 3: HC PIN | <pin>
//   Row 4: Stake Units | unit1 | unit2 | ...
//   Row 5: High Councilors | name1 | name2 | ...
//   Row 6: HC Unit Assignments | unit1 | unit2 | ...
//   Row 7: Stake Presidency | name1 | name2 | name3

/**
 * Read the Settings tab and return a structured config object.
 * Falls back to _Config tab for backward compatibility.
 */
function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  
  if (sheet) {
    return readSettingsTab(sheet);
  }
  
  // Fallback: try legacy _Config tab
  var legacySheet = ss.getSheetByName("_Config");
  if (legacySheet) {
    return readLegacyConfig(legacySheet);
  }
  
  // No config found — create default Settings tab
  sheet = ss.insertSheet("Settings");
  var defaults = [
    ["Setting", "Value 1", "Value 2", "Value 3", "Value 4", "Value 5", "Value 6", "Value 7", "Value 8", "Value 9", "Value 10", "Value 11", "Value 12"],
    ["Admin PIN", "567890", "", "", "", "", "", "", "", "", "", "", ""],
    ["HC PIN", "123456", "", "", "", "", "", "", "", "", "", "", ""],
    ["Stake Units", "Charlotte", "YSA", "Holt", "Jackson", "Lansing", "Owosso", "Portland", "St Johns", "Williamston", "", "", ""],
    ["High Councilors", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["HC Unit Assignments", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["Stake Presidency", "", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  sheet.getRange(1, 1, defaults.length, defaults[0].length).setValues(defaults);
  SpreadsheetApp.flush();
  return readSettingsTab(sheet);
}

function readSettingsTab(sheet) {
  var data = sheet.getDataRange().getValues();
  var config = {
    admin_pin: "567890",
    hc_pin: "123456",
    hc_list: "",
    hc_units: "",
    sp_list: "",
    stake_units: ""
  };
  
  // Build a lookup: row label -> row values (columns 2-13)
  for (var i = 1; i < data.length; i++) {
    var label = String(data[i][0] || "").trim();
    // Collect ALL values including blanks to preserve positional alignment
    var allValues = [];
    for (var c = 1; c < data[i].length; c++) {
      allValues.push(String(data[i][c] || "").trim());
    }
    // Trim trailing empty values
    while (allValues.length > 0 && allValues[allValues.length - 1] === "") {
      allValues.pop();
    }
    // Non-empty values only (for PIN rows where position doesn't matter)
    var nonEmpty = allValues.filter(function(v) { return v !== ""; });
    
    if (label === "Admin PIN") config.admin_pin = nonEmpty[0] || "567890";
    if (label === "HC PIN") config.hc_pin = nonEmpty[0] || "123456";
    if (label === "High Councilors") config.hc_list = allValues.join(",");
    if (label === "HC Unit Assignments") config.hc_units = allValues.join(",");
    if (label === "Stake Presidency" || label === "Presidency") config.sp_list = allValues.join(",");
    if (label === "Admins") config.admin_list = allValues.join(",");
    if (label === "Stake Units" || label === "Units") config.stake_units = nonEmpty.join(",");
  }
  
  return config;
}

function readLegacyConfig(sheet) {
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    config[data[i][0]] = String(data[i][1] || "");
  }
  if (!config.admin_pin) config.admin_pin = "567890";
  if (!config.hc_pin) config.hc_pin = "123456";
  if (!config.hc_list) config.hc_list = "";
  if (!config.hc_units) config.hc_units = "";
  if (!config.sp_list) config.sp_list = "";
  if (!config.admin_list) config.admin_list = "";
  return config;
}

function getHighCouncilors() {
  var config = getConfig();
  if (!config.hc_list) return [];
  return config.hc_list.split(",").map(function(name) { return name.trim(); });
}

function getHighCouncilorUnits() {
  var config = getConfig();
  var unitsStr = config.hc_units || "";
  if (!unitsStr) return [];
  var arr = unitsStr.split(",").map(function(u) { return u.trim(); });
  while (arr.length < 12) arr.push("");
  return arr;
}

function getStakePresidency() {
  var config = getConfig();
  if (!config.sp_list) return [];
  return config.sp_list.split(",").map(function(name) { return name.trim(); }).filter(Boolean);
}

function getAdmins() {
  var config = getConfig();
  if (!config.admin_list) return [];
  return config.admin_list.split(",").map(function(name) { return name.trim(); }).filter(Boolean);
}

// ============================================================
// AUTHENTICATION
// ============================================================

function verifyPin(pin, username) {
  var config = getConfig();
  var adminPin = String(config.admin_pin || "567890").trim();
  var hcPin = String(config.hc_pin || "123456").trim();
  var inputPin = String(pin).trim();

  if (inputPin === adminPin) {
    if (username) {
      if (username === "Admin") {
        return { authorized: true, role: "admin", username: "Admin" };
      }
      var spList = (config.sp_list || "Rawson,Earl,Pierce").split(",").map(function(name) { return name.trim().toLowerCase(); });
      var userLower = username.trim().toLowerCase();
      var spListOrig = (config.sp_list || "Rawson,Earl,Pierce").split(",").map(function(name) { return name.trim(); });
      for (var i = 0; i < spList.length; i++) {
        if (spList[i] === userLower) {
          return { authorized: true, role: "presidency", username: spListOrig[i] };
        }
      }

      var adminList = (config.admin_list || "").split(",").map(function(name) { return name.trim().toLowerCase(); });
      var adminListOrig = (config.admin_list || "").split(",").map(function(name) { return name.trim(); });
      for (var k = 0; k < adminList.length; k++) {
        if (adminList[k] === userLower && adminList[k] !== "") {
          return { authorized: true, role: "admin", username: adminListOrig[k] };
        }
      }

      return { authorized: false, error: "Unauthorized role for this PIN" };
    }
    return { authorized: true, role: "admin_sp_pending" };
  }

  if (inputPin === hcPin) {
    if (username) {
      var hcList = config.hc_list.split(",").map(function(name) { return name.trim().toLowerCase(); });
      var userLower = username.trim().toLowerCase();
      var hcListOrig = config.hc_list.split(",").map(function(name) { return name.trim(); });
      for (var j = 0; j < hcList.length; j++) {
        if (hcList[j] === userLower) {
          return { authorized: true, role: "hc", username: hcListOrig[j] };
        }
      }
      return { authorized: false, error: "Unauthorized name for this PIN" };
    }
    return { authorized: true, role: "hc_pending" };
  }

  return { authorized: false, error: "Invalid PIN" };
}

// ============================================================
// DATE FORMATTING
// ============================================================

function formatDate(date) {
  var y = date.getFullYear();
  var m = ("0" + (date.getMonth() + 1)).slice(-2);
  var d = ("0" + date.getDate()).slice(-2);
  var h = ("0" + date.getHours()).slice(-2);
  var min = ("0" + date.getMinutes()).slice(-2);
  var s = ("0" + date.getSeconds()).slice(-2);
  
  if (h === "00" && min === "00" && s === "00") {
    return y + "-" + m + "-" + d;
  }
  return y + "-" + m + "-" + d + " " + h + ":" + min + ":" + s;
}

// ============================================================
// UNIFIED RECORDS READER
// ============================================================

/**
 * Read all records from the unified "Records" sheet.
 * Returns an array of objects with column headers as keys.
 * Each record includes _rowNum for update targeting.
 * 
 * The Records sheet has a SINGLE header row (row 1).
 */
function getRecordsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Records");
  if (!sheet) return { sheet: null, headers: [], records: [] };
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return { sheet: sheet, headers: [], records: [] };
  
  // Row 1 (index 0) has the column headers (single header row in unified sheet)
  var headers = values[0];
  var records = [];
  
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var hasData = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== "" && row[c] !== null) {
        hasData = true;
        break;
      }
    }
    if (!hasData) continue;
    
    var record = {
      _rowNum: r + 1, // 1-indexed row number in the sheet
      _sheet: "Records"
    };
    for (var c = 0; c < headers.length; c++) {
      var header = headers[c];
      if (header) {
        var val = row[c];
        if (val instanceof Date) {
          record[header] = formatDate(val);
        } else {
          record[header] = val === null ? "" : val;
        }
      }
    }
    records.push(record);
  }
  
  return { sheet: sheet, headers: headers, records: records };
}

/**
 * Read records from the Pulpit Tracker sheet.
 * This sheet has a SINGLE header row (row 1).
 */
function getPulpitTrackerRecords() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Pulpit Tracker");
  if (!sheet) return { sheet: null, headers: [], records: [] };
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return { sheet: sheet, headers: [], records: [] };
  
  var headers = values[0]; // Row 1 headers
  var records = [];
  
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var hasData = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== "" && row[c] !== null) {
        hasData = true;
        break;
      }
    }
    if (!hasData) continue;
    
    var record = { _rowNum: r + 1, _sheet: "Pulpit Tracker" };
    for (var c = 0; c < headers.length; c++) {
      var header = headers[c];
      if (header) {
        var val = row[c];
        if (val instanceof Date) {
          record[header] = formatDate(val);
        } else if (val === true) {
          record[header] = "True";
        } else if (val === false) {
          record[header] = "False";
        } else {
          record[header] = val === null ? "" : String(val);
        }
      }
    }
    records.push(record);
  }
  
  return { sheet: sheet, headers: headers, records: records };
}

/**
 * Read records from the Actions tab.
 */
function getActionsRecords() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Actions");
  if (!sheet) return { sheet: null, headers: [], records: [] };
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return { sheet: sheet, headers: [], records: [] };
  
  var headers = values[0]; // Row 1 headers
  var records = [];
  
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var hasData = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== "" && row[c] !== null) {
        hasData = true;
        break;
      }
    }
    if (!hasData) continue;
    
    var record = { _rowNum: r + 1, _sheet: "Actions" };
    for (var c = 0; c < headers.length; c++) {
      var header = headers[c];
      if (header) {
        var val = row[c];
        if (val instanceof Date) {
          record[header] = formatDate(val);
        } else if (val === true) {
          record[header] = "True";
        } else if (val === false) {
          record[header] = "False";
        } else {
          record[header] = val === null ? "" : String(val);
        }
      }
    }
    records.push(record);
  }
  
  return { sheet: sheet, headers: headers, records: records };
}

// ============================================================
// GET ACTIVE DATA
// ============================================================

function getActiveData(role, username) {
  var data = getRecordsSheet();
  var pulpitData = getPulpitTrackerRecords();
  var actionsData = getActionsRecords();
  
  var finishedSteps = ["Complete", "Declined", "Cancelled", "Release Complete", "Release Completed"];
  
  function isActive(record) {
    var step = record["Current Step"];
    if (!step) return true;
    // Always include records with pending Stake Conference Sustaining
    if (String(record["Stake Conference Sustaining"] || "").trim() === "Pending") return true;
    return finishedSteps.indexOf(step) === -1;
  }
  
  function isSustainingActive(record) {
    return record["Status"] !== "Complete";
  }
  
  // Filter by Record Type
  var allRecords = data.records;
  var callings = allRecords.filter(function(r) { return r["Record Type"] === "Calling" && isActive(r); });
  var ordinations = allRecords.filter(function(r) { return r["Record Type"] === "Ordination" && isActive(r); });
  var releases = allRecords.filter(function(r) { return r["Record Type"] === "Release" && isActive(r); });
  var sustainings = pulpitData.records.filter(isSustainingActive);
  
  return {
    success: true,
    callings: callings,
    ordinations: ordinations,
    releases: releases,
    sustainings: sustainings,
    actions: actionsData.records
  };
}

// ============================================================
// ADD RECORD
// ============================================================

function addRecord(sheetType, record, role) {
  if (role !== "admin") {
    return { success: false, error: "Permission Denied: Only admins can create new records" };
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = sheetType === "Actions" ? "Actions" : "Records";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: sheetName + " sheet not found" };
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 1) return { success: false, error: "Headers row not found" };
  
  var headers = values[0]; // Row 1 headers

  // Auto-append missing Approval columns for Actions
  if (sheetType === "Actions") {
    var newHeaders = [];
    for (var key in record) {
      if (key.indexOf("Approval [") === 0 && headers.indexOf(key) === -1) {
        newHeaders.push(key);
        headers.push(key); // Update local array to match the sheet
      }
    }
    if (newHeaders.length > 0) {
      sheet.getRange(1, headers.length - newHeaders.length + 1, 1, newHeaders.length).setValues([newHeaders]);
    }
  }
  
  // Determine Record Type from the legacy sheet type parameter
  var recordType = "Calling";
  var defaultStep = "Call / Release";
  if (sheetType === "Ordinations") {
    recordType = "Ordination";
    defaultStep = "Stake Interview";
  } else if (sheetType === "Release Only") {
    recordType = "Release";
    defaultStep = "Release Pending";
  }
  
  var actualTimestamp = "";
  var newRow = [];
  for (var c = 0; c < headers.length; c++) {
    var header = headers[c];
    if (header === "Timestamp") {
      actualTimestamp = formatDate(new Date());
      newRow.push(actualTimestamp);
    } else if (sheetType !== "Actions" && header === "Record Type") {
      newRow.push(recordType);
    } else if (sheetType !== "Actions" && header === "Current Step") {
      newRow.push(record["Current Step"] || defaultStep);
    } else if (record.hasOwnProperty(header)) {
      newRow.push(record[header]);
    } else {
      newRow.push("");
    }
  }
  
  sheet.appendRow(newRow);
  SpreadsheetApp.flush();
  
  // Sync to Pulpit Tracker sheet if step is Sustain
  var currentStep = record["Current Step"] || defaultStep;
  if (currentStep === "Sustain" || currentStep === "Sustaining") {
    syncToPulpitTracker(sheetType, record, actualTimestamp);
  }
  
  return { success: true, message: "Record added successfully" };
}

// ============================================================
// UPDATE RECORD
// ============================================================

function updateRecord(sheetType, timestamp, memberName, updates, role, username) {
  // Handle Pulpit Tracker updates first — these have their own field set (unit columns)
  // and should not go through the Records permission check
  if (sheetType === "Sustainings") {
    return updatePulpitTrackerRecord(memberName, updates);
  }
  
  if (sheetType === "Actions") {
    if (role !== "admin") {
      for (var key in updates) {
        if (key !== "Notes" && key !== "Approval [" + username + "]") {
          return { success: false, error: "Permission Denied: You can only edit Notes and your own Approval." };
        }
      }
    }
    // Proceed to update Actions
  } else {
  
  // Validate permissions for High Council
  if (role === "hc") {
    var allowedFields = [
      "Member Name",
      "Current Step",
      "Calling Accepted?",
      "Notified of Release?",
      "Key Returned?",
      "Date Sustained",
      "Date Set Apart",
      "Ordained Date",
      "Set Apart By",
      "Ordained By",
      "Ready for Training?", "Ready for Training",
      "Key Provided?", "Key Provided",
      "Training Provided?", "Training Provided",
      "Ready for High Council Approval?",
      "Ready for Sustaining?",
      "Ready for Sustaining / Setting Apart?",
      "Ready for Certificate?",
      "Certificate Printed?", "Certificate Signed?", "Certificate Delivered?",
      "Entered By", "Date Entered",
      "Stake-Wide Unit Release Required?",
      "Assigned Trainer",
      "Release Complete?",
      "Notes",
      "High Council Approval Date",
      "Unit Leader Date Contacted",
      "Out of Unit Member Info",
      "Stake Presidency Date Approved"
    ];
    
    if (username) {
      allowedFields.push("Approval [" + username + "]");
    }
    
    for (var key in updates) {
      if (key.indexOf("_") === 0) continue; // Skip internal flags
      if (allowedFields.indexOf(key) === -1) {
        return { success: false, error: "Permission Denied: High Councilors cannot edit '" + key + "'" };
      }
    }
  } else if (role === "presidency") {
    var allowedFields = [
      "Member Name",
      "Calling", "Calling to be Released From",
      "Current Step",
      "Recommended By",
      "Assigned to Extend Calling / Release",
      "Assigned to Oversee Sustaining / Ordination",
      "Assigned to Extend Release",
      "Over the Pulpit Sustaining",
      "Stake Conference Sustaining",
      "Stake Conference Sustain Date",
      "Member to Release",
      "Removed from Google Drive and Calendar Invites?",
      "Removed from Google Drive and Calendar Invites (if applicable)?",
      "Added to Google Drive and Calendar Invites?",
      "Need to be Released?",
      "LCR Updated?",
      "Reason for Release", "Date Released",
      "Calling Accepted?",
      "Notified of Release?",
      "Key Returned?",
      "Date Sustained",
      "Date Set Apart",
      "Ordained Date",
      "Set Apart By", "Ordained By",
      "Ready for Training?", "Ready for Training",
      "Key Provided?", "Key Provided",
      "Training Provided?", "Training Provided",
      "Ready for High Council Approval?",
      "Ready for Sustaining?",
      "Ready for Sustaining / Setting Apart?",
      "Ready for Certificate?",
      "Certificate Printed?", "Certificate Signed?", "Certificate Delivered?",
      "Entered By", "Date Entered",
      "Stake-Wide Unit Release Required?",
      "Assigned Trainer",
      "Release Complete?",
      "Notes",
      "High Council Approval Date",
      "Unit Leader Date Contacted",
      "Out of Unit Member Info",
      "Stake Presidency Date Approved",
      "Bishop / Stake President Approved Date",
      "Interview Status", "Interview Date"
    ];
    
    if (username) {
      allowedFields.push("Approval [" + username + "]");
    }
    
    for (var key in updates) {
      if (key.indexOf("_") === 0) continue; // Skip internal flags
      if (allowedFields.indexOf(key) === -1) {
        return { success: false, error: "Permission Denied: Stake Presidency members cannot edit '" + key + "'" };
      }
    }
    }
  }
  
  // Update record in the unified "Records" sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = sheetType === "Actions" ? "Actions" : "Records";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: sheetName + " sheet not found" };
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return { success: false, error: "No data in sheet" };
  
  var headers = values[0]; // Row 1 headers
  var timestampColIdx = headers.indexOf("Timestamp");
  var memberNameColIdx = headers.indexOf("Member Name");
  
  if (timestampColIdx === -1) {
    return { success: false, error: "Required column 'Timestamp' not found" };
  }
  if (sheetType !== "Actions" && memberNameColIdx === -1) {
    return { success: false, error: "Required column 'Member Name' not found" };
  }
  
  var targetTimeStr = timestamp.trim();
  var foundRowIdx = -1;
  
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var rowTime = row[timestampColIdx];
    var rowTimeStr = (rowTime instanceof Date) ? formatDate(rowTime) : String(rowTime || "").trim();
    
    var timeMatch = (rowTimeStr === targetTimeStr || rowTimeStr.startsWith(targetTimeStr) || targetTimeStr.startsWith(rowTimeStr));
    
    if (sheetType === "Actions") {
      if (timeMatch) {
        foundRowIdx = r + 1; // 1-indexed
        break;
      }
    } else {
      var rowName = String(row[memberNameColIdx] || "").trim();
      if (rowName.toLowerCase() === (memberName || "").trim().toLowerCase() && timeMatch) {
        foundRowIdx = r + 1; // 1-indexed
        break;
      }
    }
  }
  
  if (foundRowIdx === -1) {
    return { success: false, error: "Record not found with matching criteria" };
  }
  
  var oldRow = values[foundRowIdx - 1]; // 0-indexed array vs 1-indexed row number
  
  var callingColIdx = -1;
  if (sheetType === "Callings Releasings") callingColIdx = headers.indexOf("Calling");
  else if (sheetType === "Ordinations") callingColIdx = headers.indexOf("Priesthood Office");
  else if (sheetType === "Release Only") callingColIdx = headers.indexOf("Calling to be Released From");
  var oldCalling = callingColIdx !== -1 ? String(oldRow[callingColIdx] || "").trim() : "";
  
  var unitColIdx = headers.indexOf("Unit");
  var oldUnit = unitColIdx !== -1 ? String(oldRow[unitColIdx] || "").trim() : "";
  
  var releaseNameColIdx = headers.indexOf("Member to Release");
  var oldReleaseName = releaseNameColIdx !== -1 ? String(oldRow[releaseNameColIdx] || "").trim() : "";
  
  // Auto-append missing Approval columns for Actions
  if (sheetType === "Actions") {
    var newHeaders = [];
    for (var key in updates) {
      if (key.indexOf("Approval [") === 0 && headers.indexOf(key) === -1) {
        newHeaders.push(key);
        headers.push(key);
      }
    }
    if (newHeaders.length > 0) {
      sheet.getRange(1, headers.length - newHeaders.length + 1, 1, newHeaders.length).setValues([newHeaders]);
    }
  }

  // Apply updates
  for (var key in updates) {
    if (key.indexOf("_") === 0) continue; // Skip internal flags
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(foundRowIdx, colIdx + 1).setValue(updates[key]);
    }
  }
  
  // Update Last Update column if it exists
  var lastUpdateIdx = headers.indexOf("Last Update");
  if (lastUpdateIdx !== -1) {
    sheet.getRange(foundRowIdx, lastUpdateIdx + 1).setValue(formatDate(new Date()));
  }
  
  SpreadsheetApp.flush();
  
  var oldRowTime = oldRow[timestampColIdx];
  var actualTimestamp = (oldRowTime instanceof Date) ? formatDate(oldRowTime) : String(oldRowTime || "").trim();
  
  // Create in Pulpit Tracker if changing to Sustain
  if (updates.hasOwnProperty("Current Step")) {
    var newStep = updates["Current Step"];
    if (newStep === "Sustain" || newStep === "Sustaining") {
      var fullRecord = {};
      for (var c = 0; c < headers.length; c++) {
        var hdr = headers[c];
        fullRecord[hdr] = updates.hasOwnProperty(hdr) ? updates[hdr] : oldRow[c];
      }
      syncToPulpitTracker(sheetType, fullRecord, actualTimestamp);
    }
  }
  
  // Sync Member Name, Calling, Unit, and Member to Release changes to Pulpit Tracker using Timestamp as Key
  var hasNameUpdate = updates.hasOwnProperty("Member Name") && updates["Member Name"] !== memberName;
  var hasReleaseNameUpdate = updates.hasOwnProperty("Member to Release") && updates["Member to Release"] !== oldReleaseName;
  var hasCallingUpdate = false;
  var newCalling = null;
  if (sheetType === "Callings Releasings" && updates.hasOwnProperty("Calling")) { hasCallingUpdate = true; newCalling = updates["Calling"]; }
  else if (sheetType === "Ordinations" && updates.hasOwnProperty("Priesthood Office")) { hasCallingUpdate = true; newCalling = updates["Priesthood Office"]; }
  else if (sheetType === "Release Only" && updates.hasOwnProperty("Calling to be Released From")) { hasCallingUpdate = true; newCalling = updates["Calling to be Released From"]; }
  var hasUnitUpdate = updates.hasOwnProperty("Unit") && updates["Unit"] !== oldUnit;
  
  if (hasNameUpdate || hasReleaseNameUpdate || hasCallingUpdate || hasUnitUpdate) {
    try {
      var pulpitSheet = ss.getSheetByName("Pulpit Tracker");
      if (pulpitSheet) {
        var pRange = pulpitSheet.getDataRange();
        var pValues = pRange.getValues();
        if (pValues.length > 1) {
          var pHeaders = pValues[0];
          var timestampColIdxPt = pHeaders.indexOf("TimeStamp from Records Tab");
          var individualCol = pHeaders.indexOf("Individual");
          var pCallingCol = pHeaders.indexOf("Calling");
          if (pCallingCol === -1) pCallingCol = pHeaders.indexOf("Calling / Office");
          var pUnitCol = pHeaders.indexOf("Unit");
          
          if (timestampColIdxPt !== -1 && individualCol !== -1 && pCallingCol !== -1) {
            var expectedPrimaryTs = actualTimestamp;
            var expectedReleaseTs = "R-" + actualTimestamp;
            
            var isAllUnits = false;
            if (sheetType === "Callings Releasings") {
              var pulpitSustIdx = headers.indexOf("Over the Pulpit Sustaining");
              if (pulpitSustIdx !== -1 && String(oldRow[pulpitSustIdx] || "") === "All Units") isAllUnits = true;
            } else if (sheetType === "Release Only") {
              var stakeWideIdx = headers.indexOf("Stake-Wide Unit Release Required?");
              if (stakeWideIdx !== -1 && String(oldRow[stakeWideIdx] || "") === "Yes") isAllUnits = true;
            }
            
            for (var pr = 1; pr < pValues.length; pr++) {
              var rawTs = pValues[pr][timestampColIdxPt];
              var rowTs = (rawTs instanceof Date) ? formatDate(rawTs) : String(rawTs || "").trim();
              if (!rowTs) continue;
              
              var isPrimaryMatch = (rowTs === expectedPrimaryTs);
              var isReleaseMatch = (rowTs === expectedReleaseTs);
              
              if (isPrimaryMatch || isReleaseMatch) {
                if (hasNameUpdate && isPrimaryMatch) pulpitSheet.getRange(pr + 1, individualCol + 1).setValue(updates["Member Name"]);
                if (hasReleaseNameUpdate && isReleaseMatch) pulpitSheet.getRange(pr + 1, individualCol + 1).setValue(updates["Member to Release"]);
                if (hasCallingUpdate) pulpitSheet.getRange(pr + 1, pCallingCol + 1).setValue(newCalling);
                
                if (hasUnitUpdate && pUnitCol !== -1) {
                  pulpitSheet.getRange(pr + 1, pUnitCol + 1).setValue(updates["Unit"]);
                  
                  // Handle checkbox columns if it wasn't an "All Units" sustaining
                  if (!isAllUnits) {
                    var oldUnitCheckCol = pHeaders.indexOf(oldUnit);
                    var newUnitCheckCol = pHeaders.indexOf(updates["Unit"]);
                    
                    if (oldUnitCheckCol !== -1) pulpitSheet.getRange(pr + 1, oldUnitCheckCol + 1).setValue("");
                    if (newUnitCheckCol !== -1) pulpitSheet.getRange(pr + 1, newUnitCheckCol + 1).setValue(false);
                  }
                }
              }
            }
            SpreadsheetApp.flush();
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync data to Pulpit Tracker: " + e.toString());
    }
  }
  
  return { success: true, message: "Record updated successfully" };
}

/**
 * Update a record in the Pulpit Tracker sheet
 */
function updatePulpitTrackerRecord(memberName, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Pulpit Tracker");
  if (!sheet) return { success: false, error: "Pulpit Tracker sheet not found" };
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return { success: false, error: "No data in Pulpit Tracker" };
  
  var headers = values[0]; // Row 1 headers
  var individualColIdx = headers.indexOf("Individual");
  var actionColIdx = headers.indexOf("Action");
  var callingColIdx = headers.indexOf("Calling");
  if (callingColIdx === -1) callingColIdx = headers.indexOf("Calling / Office");
  
  var foundRowIdx = -1;
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var rowIndividual = String(row[individualColIdx] || "").trim().toLowerCase();
    var rowAction = String(row[actionColIdx] || "").trim().toLowerCase();
    var rowCalling = String(row[callingColIdx] || "").trim().toLowerCase();
    
    if (rowIndividual === memberName.trim().toLowerCase() && 
        rowAction === (updates._action || "").trim().toLowerCase() && 
        rowCalling === (updates._calling || "").trim().toLowerCase()) {
      foundRowIdx = r + 1;
      break;
    }
  }
  
  if (foundRowIdx === -1) {
    return { success: false, error: "Sustaining row not found in Pulpit Tracker" };
  }
  
  // Get stake unit names from Settings to identify unit columns
  var config = getConfig();
  var unitNames = config.stakeUnits || [];
  
  // Apply field updates
  for (var key in updates) {
    if (key.indexOf("_") === 0) continue;
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      var val = updates[key];
      // Only convert to boolean for unit columns (checkbox columns)
      if (unitNames.indexOf(key) !== -1) {
        if (val === "Complete" || val === "True" || val === true) val = true;
        else val = false;
      }
      sheet.getRange(foundRowIdx, colIdx + 1).setValue(val);
    }
  }
  
  // Auto-calculate Percent and Status
  SpreadsheetApp.flush();
  var percentColIdx = headers.indexOf("Percent");
  var statusColIdx = headers.indexOf("Status");
  
  // Auto-calculate Percent and Status — but only if Status wasn't explicitly set
  var statusExplicitlySet = updates.hasOwnProperty("Status");
  
  if (!statusExplicitlySet && percentColIdx !== -1 && statusColIdx !== -1) {
    var percentVal = sheet.getRange(foundRowIdx, percentColIdx + 1).getValue();
    if (percentVal === 1 || percentVal === 1.0 || String(percentVal) === "100%") {
      sheet.getRange(foundRowIdx, statusColIdx + 1).setValue("Complete");
      updateMainSheetSustainDate(memberName, updates._action);
    } else {
      sheet.getRange(foundRowIdx, statusColIdx + 1).setValue("Pending");
    }
  }
  
  SpreadsheetApp.flush();
  return { success: true, message: "Sustaining updated" };
}

// ============================================================
// SEARCH HISTORY
// ============================================================

function searchHistory(query) {
  var data = getRecordsSheet();
  var allRecords = data.records;
  
  var q = (query || "").toLowerCase().trim();
  var results = [];
  
  function match(name) {
    if (q === "") return true;
    if (!name) return false;
    return name.toLowerCase().indexOf(q) !== -1;
  }
  
  allRecords.forEach(function(r) {
    var recordType = r["Record Type"] || "";
    
    if (recordType === "Calling") {
      if (match(r["Member Name"]) || match(r["Member to Release"])) {
        results.push({
          type: "Calling / Release",
          name: r["Member Name"],
          unit: r["Unit"],
          details: r["Calling"] + " (Unit: " + r["Unit"] + ")",
          releasing: r["Member to Release"] ? r["Member to Release"] + " (Released)" : "",
          step: r["Current Step"],
          date: r["Date Sustained"] || r["Timestamp"],
          timestamp: r["Timestamp"],
          record: r
        });
      }
    } else if (recordType === "Ordination") {
      if (match(r["Member Name"])) {
        results.push({
          type: "Ordination",
          name: r["Member Name"],
          unit: r["Unit"],
          details: r["Priesthood Office"] + " (Unit: " + r["Unit"] + ")",
          releasing: "",
          step: r["Current Step"],
          date: r["Date Sustained"] || r["Timestamp"],
          timestamp: r["Timestamp"],
          record: r
        });
      }
    } else if (recordType === "Release") {
      if (match(r["Member Name"])) {
        results.push({
          type: "Release",
          name: r["Member Name"],
          unit: r["Unit"],
          details: r["Calling to be Released From"] + " (Unit: " + r["Unit"] + ")",
          releasing: "",
          step: r["Current Step"],
          date: r["Date Released"] || r["Timestamp"],
          timestamp: r["Timestamp"],
          record: r
        });
      }
    }
  });
  
  results.sort(function(a, b) {
    return new Date(b.date.replace(/-/g, "/")) - new Date(a.date.replace(/-/g, "/"));
  });
  
  if (q === "") {
    results = results.slice(0, 50);
  }
  
  return { success: true, results: results };
}

// ============================================================
// PULPIT TRACKER (SUSTAININGS) HELPERS
// ============================================================

function syncToPulpitTracker(sheetType, record, recordTimestamp) {
  try {
    if (sheetType === "Callings Releasings") {
      var pulpitSustaining = record["Over the Pulpit Sustaining"] || "Home Unit Only";
      if (record["Calling"]) {
        addSustainingEntry(record["Member Name"], record["Unit"], "Sustain", record["Calling"], pulpitSustaining, recordTimestamp);
      }
      if (record["Member to Release"]) {
        addSustainingEntry(record["Member to Release"], record["Unit"], "Release & Thank", record["Calling"], pulpitSustaining, "R-" + recordTimestamp);
      }
    } else if (sheetType === "Ordinations") {
      if (record["Priesthood Office"]) {
        addSustainingEntry(record["Member Name"], record["Unit"], "Sustain", record["Priesthood Office"], "Home Unit Only", recordTimestamp);
      }
    } else if (sheetType === "Release Only") {
      var isStakeWide = record["Stake-Wide Unit Release Required?"] === "Yes" ? "All Units" : "Home Unit Only";
      if (record["Calling to be Released From"]) {
        addSustainingEntry(record["Member Name"], record["Unit"], "Release & Thank", record["Calling to be Released From"], isStakeWide, recordTimestamp);
      }
    }
  } catch (e) {
    console.error("Failed to sync to Pulpit Tracker: " + e.toString());
  }
}

function colLetter(index) {
  var letter = "";
  index++;
  while (index > 0) {
    var modulo = (index - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    index = Math.floor((index - modulo) / 26);
  }
  return letter;
}

function addSustainingEntry(individual, unit, action, calling, pulpitSustaining, recordTimestamp) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Pulpit Tracker");
  if (!sheet) return;
  
  var lastRow = sheet.getLastRow();
  var newRowIdx = lastRow + 1;
  var headersRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var headers = headersRange.getValues()[0];
  var timestampColIdx = headers.indexOf("TimeStamp from Records Tab");
  
  // Check if entry already exists
  if (timestampColIdx !== -1) {
    var data = sheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      var rawTs = data[r][timestampColIdx];
      var rowTs = (rawTs instanceof Date) ? formatDate(rawTs) : String(rawTs || "").trim();
      if (rowTs === String(recordTimestamp).trim()) {
        return; // Already exists!
      }
    }
  }
  
  var rowData = new Array(headers.length).fill("");
  
  var setCol = function(name, val) {
    var idx = headers.indexOf(name);
    if (idx !== -1) rowData[idx] = val;
  };
  
  setCol("Individual", individual);
  setCol("Unit", unit);
  setCol("Action", action);
  var callingCol = headers.indexOf("Calling");
  if (callingCol === -1) callingCol = headers.indexOf("Calling / Office");
  if (callingCol !== -1) rowData[callingCol] = calling;
  
  var indColIdx = headers.indexOf("Individual");
  var indColLetter = indColIdx !== -1 ? colLetter(indColIdx) : "A";
  
  var charlotteIdx = headers.indexOf("Charlotte");
  var willyIdx = headers.indexOf("Williamston");
  if (charlotteIdx !== -1 && willyIdx !== -1) {
    var cLetter = colLetter(charlotteIdx);
    var wLetter = colLetter(willyIdx);
    var percentFormula = '=IF(' + indColLetter + newRowIdx + '="","",COUNTIF(' + cLetter + newRowIdx + ':' + wLetter + newRowIdx + ',TRUE)/COUNTA(' + cLetter + newRowIdx + ':' + wLetter + newRowIdx + '))';
    setCol("Percent", percentFormula);
  }
  
  setCol("Status", "Pending");
  setCol("TimeStamp from Records Tab", recordTimestamp);
  
  var units = ["Charlotte", "YSA", "Holt", "Jackson", "Lansing", "Owosso", "Portland", "St Johns", "Williamston"];
  var isAllUnits = (pulpitSustaining === "All Units");
  for (var i = 0; i < units.length; i++) {
    var unitName = units[i];
    if (isAllUnits) {
      setCol(unitName, false);
    } else {
      if (unitName.toLowerCase() === unit.toLowerCase()) {
        setCol(unitName, false);
      }
    }
  }
  
  sheet.appendRow(rowData);
}

/**
 * When a sustaining is 100% complete, update the main Records sheet
 */
function updateMainSheetSustainDate(memberName, action) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Records");
  if (!sheet) return;
  
  var todayStr = formatDate(new Date()).split(" ")[0];
  var values = sheet.getDataRange().getValues();
  var headers = values[0]; // Row 1 headers
  
  var nameCol = headers.indexOf("Member Name");
  var stepCol = headers.indexOf("Current Step");
  var recordTypeCol = headers.indexOf("Record Type");
  
  if (action.toLowerCase() === "sustain") {
    // Find matching Calling or Ordination record
    var dateSustainedCol = headers.indexOf("Date Sustained");
    
    for (var r = 1; r < values.length; r++) {
      var rowName = String(values[r][nameCol] || "").trim().toLowerCase();
      var rowStep = values[r][stepCol];
      var rowType = values[r][recordTypeCol];
      
      if (rowName === memberName.trim().toLowerCase() &&
          ["Complete", "Cancelled", "Declined"].indexOf(rowStep) === -1) {
        
        if (rowType === "Calling" && dateSustainedCol !== -1) {
          sheet.getRange(r + 1, dateSustainedCol + 1).setValue(todayStr);
          sheet.getRange(r + 1, stepCol + 1).setValue("Set Apart");
          break;
        } else if (rowType === "Ordination" && dateSustainedCol !== -1) {
          sheet.getRange(r + 1, dateSustainedCol + 1).setValue(todayStr);
          sheet.getRange(r + 1, stepCol + 1).setValue("Ordination");
          break;
        }
      }
    }
  } else if (action.toLowerCase() === "release & thank") {
    // Find matching Release record
    var dateReleasedCol = headers.indexOf("Date Released");
    
    for (var r = 1; r < values.length; r++) {
      var rowName = String(values[r][nameCol] || "").trim().toLowerCase();
      var rowStep = values[r][stepCol];
      var rowType = values[r][recordTypeCol];
      
      if (rowName === memberName.trim().toLowerCase() &&
          rowType === "Release" &&
          rowStep !== "Release Complete") {
        if (dateReleasedCol !== -1) {
          sheet.getRange(r + 1, dateReleasedCol + 1).setValue(todayStr);
        }
        sheet.getRange(r + 1, stepCol + 1).setValue("Release Complete");
        break;
      }
    }
  }
}

// ============================================================
// ADMIN: ROSTER MANAGEMENT
// ============================================================

function renameApprovalHeaders(ss, oldNames, newNames, sheetNames) {
  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = ss.getSheetByName(sheetNames[s]);
    if (sheet) {
      var values = sheet.getDataRange().getValues();
      if (values.length >= 1) {
        var headers = values[0]; // Row 1 headers
        for (var i = 0; i < Math.min(oldNames.length, newNames.length); i++) {
          var oldName = oldNames[i];
          var newName = newNames[i].trim();
          if (oldName !== newName && oldName !== "" && newName !== "") {
            var oldHeader = "Approval [" + oldName + "]";
            var newHeader = "Approval [" + newName + "]";
            var colIdx = headers.indexOf(oldHeader);
            if (colIdx !== -1) {
              sheet.getRange(1, colIdx + 1).setValue(newHeader);
              headers[colIdx] = newHeader; // update in memory for subsequent loops
            }
          }
        }
      }
    }
  }
}

function updateHighCouncilors(newNames, newUnits) {
  var config = getConfig();
  var oldNames = config.hc_list ? config.hc_list.split(",").map(function(n) { return n.trim(); }) : [];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  renameApprovalHeaders(ss, oldNames, newNames, ["Records", "Actions"]);
  
  updateSettingsRow(ss, "High Councilors", newNames);
  if (newUnits) {
    updateSettingsRow(ss, "HC Unit Assignments", newUnits);
  }
  
  SpreadsheetApp.flush();
  return { success: true, message: "High Council roster and unit relationships updated." };
}

function updateStakePresidency(newNames) {
  var config = getConfig();
  var oldNames = config.sp_list ? config.sp_list.split(",").map(function(n) { return n.trim(); }) : [];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  renameApprovalHeaders(ss, oldNames, newNames, ["Actions"]);
  
  updateSettingsRow(ss, "Stake Presidency", newNames);
  SpreadsheetApp.flush();
  return { success: true, message: "Stake Presidency roster updated." };
}

function updateAdmins(newNames) {
  var config = getConfig();
  var oldNames = config.admin_list ? config.admin_list.split(",").map(function(n) { return n.trim(); }) : [];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  renameApprovalHeaders(ss, oldNames, newNames, ["Actions"]);
  
  updateSettingsRow(ss, "Admins", newNames);
  SpreadsheetApp.flush();
  return { success: true, message: "Admins roster updated." };
}

function updatePINs(adminPin, hcPin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (adminPin) updateSettingsRow(ss, "Admin PIN", [adminPin]);
  if (hcPin) updateSettingsRow(ss, "HC PIN", [hcPin]);
  SpreadsheetApp.flush();
  return { success: true, message: "PINs updated successfully" };
}

/**
 * Helper: Update a row in the Settings tab by its label.
 * Writes values into columns B through M (Value 1 - Value 12).
 */
function updateSettingsRow(ss, rowLabel, values) {
  var sheet = ss.getSheetByName("Settings");
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0] || "").trim() === rowLabel) {
      // Clear existing values in columns B-M, then write new ones
      for (var c = 1; c <= 12; c++) {
        var val = (c - 1 < values.length) ? values[c - 1] : "";
        sheet.getRange(r + 1, c + 1).setValue(val);
      }
      return;
    }
  }
}
