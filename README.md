# Calling & Ordination Tracker Setup Guide

This guide will show you how to deploy the web application for free using **GitHub Pages** (frontend) and **Google Apps Script** (backend API).

---

## Part 1: Deploying the Backend (Google Apps Script API)

1. Open your Google Spreadsheet (the copy you made from the Excel sheet).
2. Go to the menu and click **Extensions** > **Apps Script**.
3. You will see a file named `Code.gs` (or `Code.js`). Delete any placeholder code.
4. Copy the entire contents of `Code.js` (from this workspace) and paste it into the editor.
5. Click the **Save** (floppy disk) icon at the top of the editor.
6. Click the **Deploy** button > select **New deployment**.
7. In the configuration popup, click the **Gear (Select type)** icon next to "Configuration" and select **Web app**.
8. Fill out the web app options exactly as follows:
   * **Description:** `Calling Tracker API`
   * **Execute as:** **Me (your-email@gmail.com)** *(This is critical so the API writes with your account permissions)*
   * **Who has access:** **Anyone** *(This is critical so the frontend app can communicate with the API)*
9. Click **Deploy**.
10. Google will prompt you to **Authorize Access**. Click *Authorize access*, select your Google account, click *Advanced* (small text), and click *Go to Untitled project (unsafe)*. Accept the permissions.
11. Once completed, Google will display a **Web App URL** (ending in `/exec`). **Copy this URL**; you will need it in Part 3.

---

## Part 2: Hosting the Frontend (GitHub Pages)

GitHub Pages provides free static web hosting with no user limits.

1. Go to [GitHub.com](https://github.com/) and log in (or create a free account).
2. Create a new repository:
   * Click **New** (green button).
   * Name the repository (e.g., `calling-tracker`).
   * Choose **Public** (required for the free hosting tier).
   * Click **Create repository**.
3. Upload the frontend file:
   * Click the link that says **"uploading an existing file"**.
   * Drag and drop the `index.html` file (from this workspace) into the upload area.
   * Scroll down and click **Commit changes** (green button).
4. Enable GitHub Pages:
   * Inside your new repository, click the **Settings** tab (gear icon on the top right).
   * In the left sidebar, scroll down to the "Code and automation" section and click **Pages**.
   * Under "Build and deployment", set **Source** to `Deploy from a branch`.
   * Under "Branch", change `None` to `main` (or `master`) and keep `/ (root)` selected.
   * Click **Save**.
5. After about 30 seconds, refresh the page. At the top of the Pages settings, you will see your live URL (e.g., `https://<your-username>.github.io/calling-tracker/`).

---

## Part 3: Connecting the App to your Sheet

1. Open your live GitHub Pages URL on your mobile phone or computer.
2. Tap the **Settings** tab in the bottom navigation menu.
3. Paste the **Google Apps Script Web App URL** you copied in Part 1 into the "Google Apps Script Web App URL" field.
4. Tap **Save Web App URL**.
5. The page will reload and direct you to the Login screen, now fully connected to your Google Sheet!

---

## Part 4: Using the App & Access PINs

When the app connects to the sheet for the first time, it automatically creates a new sheet tab called `_Config` containing default PINs.

* **Admin PIN:** `5678` (Grants full access to read/write all fields, add new records, view history, and change settings).
* **High Councilor PIN:** `1234` (Requires selecting a name from the active High Council roster. Grants access to view active items and edit votes/whitelisted status fields).

### Changing PINs & Managing the High Council
Log in as an Admin (`5678`) and click **Settings**:
* **PIN Administration:** Change the shared Admin and High Councilor PINs.
* **High Council Roster:** Modify the names of the 12 High Councilors. Editing a name here will **automatically rename the column headers** (e.g. `Approval [OldName]` $\rightarrow$ `Approval [NewName]`) in the spreadsheet.

---

## Part 5: Installing as a Mobile App (PWA)

To make it behave like a native app on your phone (runs full-screen with its own launcher icon):

### iOS (iPhone / iPad)
1. Open your GitHub Pages URL in **Safari**.
2. Tap the **Share** button (box with up arrow at the bottom of the screen).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** on the top right.

### Android
1. Open your GitHub Pages URL in **Chrome**.
2. Tap the **Three Dots** menu icon in the upper right.
3. Tap **Add to Home Screen** (or **Install app**).
