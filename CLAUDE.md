# Collierville Hub - Project Instructions

## Overview
Daily operations checklist and manager dashboard app for the Collierville Guthrie's restaurant. Single-page vanilla HTML/CSS/JS app with no build process.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (single `index.html` file)
- **Data Storage**: Browser `localStorage` (auto-save) + Google Sheets (manual submit)
- **Backend**: Google Apps Script (serverless) for Sheets integration
- **Hosting**: Vercel (CLI deploy, no git integration on Vercel side)

## Deployment

### Vercel
- **Live URL**: https://collierville-hub.vercel.app
- **Project**: `keon-pinckneys-projects/collierville-hub`
- **Deploy command**: `vercel --prod --yes` (from project root)
- **No build step** — Vercel serves static files directly

### GitHub
- **Repo**: https://github.com/withinreachintl-coder/collierville-hub
- **Branch**: `master`
- **Note**: Vercel is deployed via CLI, NOT auto-deployed from GitHub pushes

### Deploy Workflow
```bash
# After making changes:
git add -A && git commit -m "description of changes"
git push origin master
vercel --prod --yes
```

## App Structure

### Single File: `index.html`
Everything lives in one file — HTML structure, CSS styles, and JavaScript logic.

### Navigation Modules
| Module | Description |
|--------|-------------|
| Opening / Closing | Combined checklist page with tab switching |
| Weekly Cleaning | Separate checklist page |
| Prep Sheet | Par level tracking with auto-calc |
| Manager Dashboard | Real-time ops overview with summary cards |
| How-To Guide | User instructions |
| Guthries Ops Hub | External link to main ops hub |
| First Choice Facilities | External link to facilities hub |

### Checklist Sections
| Section | Tab/Page | Items | Photo-Enabled Items |
|---------|----------|-------|-------------------|
| Opening Checklist | Tab within Opening/Closing | 50 items | o18, o19, o20, o23, o33, o45 |
| Closing Checklist | Tab within Opening/Closing | 70 items | c4, c6, c28, c29, c48, c57 |
| Weekly Cleaning | Separate page | 33 items | w2, w7, w14, w17, w21, w29 |
| Prep Sheet | Separate page | 11 table rows | N/A |

### Key JavaScript Constants
- `STORAGE_PREFIX`: `'collierville-hub-'`
- `TEAM`: `['Keon', 'Sharon', 'Haley', 'Trey']`
- `SHEETS_URL`: Google Apps Script web app endpoint (already configured)
- `CHECKLIST_SECTIONS`: `['opening', 'closing', 'weekly']`

## Features

### Session Management
- Each checklist requires a name entry before starting
- Session tracks: who started, when started, when completed
- Session name is applied to all completed items automatically

### Checklist Behavior (Consistent Across All Modules)
- Progress bar with count ("X of Y complete") and percentage
- Color-coded progress bar: red (<40%), yellow (40-79%), green (80%+)
- Completed items get green checkmark, strikethrough text, green background
- Each completed item shows: name, time, date in metadata line
- Photo-enabled items have camera/upload button with thumbnail preview

### Photo Support
- Uses HTML5 FileReader API with `capture="environment"` for rear camera
- Photos stored as base64 in localStorage (separate key to avoid quota issues)
- Shows thumbnail preview and "Photo attached" confirmation
- Remove button to clear photos
- Photo data included in Google Sheets submission

### Manager Dashboard
- **Summary Cards**: Completion Rate, Tasks Done, Photos Attached, Open Items
- **Live Status**: Real-time status of all 4 checklists with progress bars
- **Today's Snapshot**: Opening/Closing roll-up with completion details
- **Recent Activity**: Table of last 15 submitted checklists with status
- **Bottom Summary**: Current Prep status and Weekly Cleaning status

### Auto-Save
Every checkbox, input, and photo change saves to `localStorage` immediately.

### Daily Auto-Reset
- State stamped with `_savedDate` in localStorage
- On page load, if saved date differs from today, all sections are wiped
- Current day's data archived to history before clearing
- `scheduleMidnightReset()` timer clears at exactly midnight
- History retained for last 30 entries

### Manual Reset
Reset buttons on every section with confirmation prompt.

### Google Sheets Integration
- Submit button on each section POSTs data to Google Apps Script
- Includes: tasks, completion status, who completed, timestamps, photo flags
- Script writes to matching sheet tabs: Opening, Closing, Weekly, Prep
- **Apps Script file**: `google-apps-script.js` (reference copy)

## Data Model (localStorage)
```javascript
{
  _savedDate: "3/25/2026",
  sessions: {
    opening: { startedBy: "Keon", startedAt: "ISO", completedAt: "ISO" },
    closing: null,
    weekly: null,
    prep: null
  },
  items: {
    "o1": { checked: true, completedBy: "Keon", completedAt: "ISO", photo: null },
    "o18": { checked: true, completedBy: "Keon", completedAt: "ISO", photo: "base64..." }
  },
  prep: { "prep-hand-0": "4", "prep-hand-1": "2" },
  history: [
    { date: "3/24/2026", type: "Opening", completedBy: "Sharon", progress: "50/50", status: "Complete" }
  ]
}
```

Photos stored separately in `collierville-hub-photos` localStorage key to manage size.

## Key Functions Reference
| Function | Purpose |
|----------|---------|
| `startSession(id)` | Begin a checklist session with name entry |
| `renderSessionUI(id)` | Show/hide session start vs active bar |
| `updateProgress(id)` | Update progress bar, count, and percentage |
| `renderItemMeta(id)` | Show completion name/time/date under item |
| `setupPhotoControls()` | Initialize camera/upload buttons on photo items |
| `renderPhotoState(id)` | Show photo thumbnail and status |
| `saveState()` | Persist all data to localStorage |
| `loadState()` | Restore state on page load (with day-change check) |
| `clearSection(id)` | Reset one section |
| `archiveCurrentDay()` | Save current day to history before reset |
| `scheduleMidnightReset()` | Timer to auto-clear at midnight |
| `submitToSheets(id)` | POST section data to Google Sheets |
| `collectSectionData(id)` | Gather all form data for submission |
| `calcPrep()` | Auto-calculate prep needs (Par - On Hand) |
| `refreshDashboard()` | Rebuild all dashboard components |
| `showSection(id, btn)` | Navigate between modules |
| `switchTab(tabId, btn)` | Switch Opening/Closing tabs |
