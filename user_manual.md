# Calling & Ordination Tracker — User Manual

---

## 1. Tab Overview

The app features main navigation tabs at the bottom of the screen. Their visibility and utility vary depending on your role.

### Dashboard Tab
- **Admin:** Sees a comprehensive overview of all active callings, ordinations, and releases. Can reorder records, view all statuses, and access deep edit menus. The Dashboard has three sub-views accessible via toggle buttons at the top:
  - **Active Tracker** — The main view showing all active callings, ordinations, and release-only records with full status details and counts.
  - **Conference** — A focused view for Stake Conference sustainings.
  - **Actions** — A view for managing action items assigned to leadership (see Section 5 below).
- **Presidency:** Sees an identical comprehensive overview as Admins. Used to track the overall progress of stake callings and sustainings.
- **High Councilor (HC):** Sees a filtered dashboard showing only the records they need to vote on (in the "HC Approval" step) or records where they are assigned to a specific task (e.g., setting someone apart).

### My Tasks Section
- **All Roles:** This section appears on the **Active Tracker** view and acts as a personalized to-do list. It automatically filters all active records in the stake and only displays the ones where your name is assigned to the "Current Step." For example, if you are assigned to set someone apart, that record will only show up in your tasks when the Current Step becomes "Set Apart."

### Over the Pulpit Tab
- **All Roles:** This tab shows the sustaining and release announcements organized for reading over the pulpit in ward/branch meetings. It has three sections displayed in order:
  1. **Priesthood Ordinations** — Candidates for Elder or High Priest ordination.
  2. **Release & Thank** — Members being released from their callings.
  3. **Callings** — Members being sustained for new callings.
- A **unit selector** dropdown lets you filter by a specific unit or view all units at once.
- High Councilors and Presidency members see a **preset script** that can be read directly from the pulpit, along with checkboxes to mark items as completed.
- Admins see all pending items across all units with "Mark Complete" buttons and remaining unit counts.

### Create Tab *(Admin Only)*
- Used to create new calling, ordination, or release-only records.

### History Tab *(Admin Only)*
- Used to search and view historical records.

### Settings Tab
- **Admin:** Full access to manage the app. Can manually sync data, clear the cache, trigger demo mode, update PINs, manage rosters, and send email digests.
- **Presidency:** Can manually sync data and clear the cache. Cannot change PINs.
- **High Councilor (HC):** Can manually sync data and clear the cache.

---

## 2. Admin Role: Creating and Managing Records

Admins have full read/write access to the entire application. Your primary job is to shepherd records through their lifecycle by keeping the "Current Step" updated and ensuring assignments are made and dates are updated.

### The "Current Step" Field

The "Current Step" dropdown is the engine of the app. Changing this field dictates who sees the record in their "My Tasks" section.

**Callings Step Order:**

| Step | Assigned To |
|------|-------------|
| Admin Review | The **Clerk** (first admin in the roster) |
| HC Approval | Pushes the record to all High Councilors' dashboards for voting |
| Call / Release | The person in the "Assigned to Extend Calling/Release" field |
| Sustain | The person in the "Assigned to Oversee Sustaining/Ordination" field |
| Set Apart | The person in the "Assigned to Set Apart" field |
| Training | The person in the "Assigned Trainer" field |
| Complete | Removes the record from active dashboards (archives it) |

**Ordinations Step Order:**

| Step | Assigned To |
|------|-------------|
| Admin Review | The **Clerk** (first admin in the roster) |
| Interview | The **Executive Secretary** (second admin in the roster) — task: "Set Up Priesthood Interview" |
| HC Approval | Pushes the record to all High Councilors' dashboards for voting |
| Sustaining | The person in the "Assigned to Oversee Sustaining/Ordination" field |
| Ordination | The person in the "Assigned to Oversee Sustaining/Ordination" field |
| Certificate | The **Clerk** (first admin in the roster) — task: "Certificate & LCR" |

**Release Only Step Order:**

| Step | Assigned To |
|------|-------------|
| Admin Review | The **Clerk** (first admin in the roster) |
| Extend Release | The person in the "Assigned to Extend Release" field |
| Pulpit Release | Automatically creates a "Release & Thank" entry on the Over the Pulpit tab |
| Complete | Removes the record from active dashboards (archives it) |

### Automated Processes & Prompts

#### HC Approval Voting
When a record is in "HC Approval," High Councilors will click "Yes" or "No." The app tallies these votes. Admins can see the total vote count on the dashboard card.

#### "Training Provided?" Prompt
When an Admin or Trainer changes "Training Provided" to "Yes," a custom prompt will appear asking if the calling is complete.
- Clicking **"Yes"** automatically changes the Current Step to "Complete."
- Clicking **"Not Sure"** automatically changes the Current Step to "Admin Review" so an Admin can double-check the paperwork.

#### Callings Auto-Progression (Sustaining → Set Apart → Admin Review)
When a Presidency member or High Councilor updates a calling record:
1. If the Current Step is **"Sustain"** and the **Date Sustained** is entered, the app automatically advances the step to **"Set Apart"**.
2. Once the **Date Set Apart** is also entered, the app checks for the **"Assigned to Set Apart"** field. If it is empty, a warning appears: *"Please select a person from the 'Assigned to Set Apart' dropdown."*
3. When all three fields (**Date Sustained**, **Date Set Apart**, and **Assigned to Set Apart**) are filled, the app displays a confirmation dialog: *"Sustaining and Setting Apart are finished. The Current Step for this record will now be set to 'Admin Review' for updating LCR."* Clicking **OK** advances the step to **"Admin Review"**.

#### Ordination Auto-Progression (Sustaining → Ordination → Certificate)
When a Presidency member or High Councilor updates an ordination record:
1. If the Current Step is **"Sustaining"** and the **Date Sustained** is entered, the app automatically advances the step to **"Ordination"**.
2. Once the **Ordained Date** is also entered, the app checks for the **"Ordained By"** field. If it is empty, a warning appears: *"Please enter a name in the 'Ordained By' field."*
3. When all three fields (**Date Sustained**, **Ordained Date**, and **Ordained By**) are filled, the app displays a confirmation dialog: *"Sustaining and Ordination are complete. The Current Step will be set to 'Certificate'."* Clicking **OK** advances the step to **"Certificate"**.

#### Pulpit Release
When a Release Only record's Current Step is changed to **"Pulpit Release,"** the app automatically creates a **"Release & Thank"** entry on the **Over the Pulpit** tab. This entry will appear in the releases section for the appropriate unit so it can be announced during a ward meeting.

#### Dashboard Reordering
Admins have up/down arrows on dashboard cards. Clicking these updates the row order directly in the Google Sheet.

---

## 3. Presidency and High Council Roles: Updating Records

### Presidency

- **Full Edit Access:** The Presidency has the same editing permissions as Admins. You can modify any field, change the Current Step, and assign trainers or overseers.
- **Workflow:** Use the Dashboard to get a bird's-eye view of all stake callings. Use the "My Tasks" section to see exactly who you need to call, release, set apart, or train this week.

### High Council

- **Restricted Edit Access:** High Councilors can only edit specific fields relevant to their duties (e.g., checking off "Calling Accepted?", "Key Provided?", "Training Provided?"). Assignment fields and the "Current Step" are locked.
- **Voting:** When a record enters the "HC Approval" step, it will appear on your dashboard. Tap the record, and you will see voting buttons with your name at the top of the screen where you will click until it shows "Yes" or "No." Your vote is recorded instantly.
- **My Tasks:** If the Stake Presidency assigns you to extend a calling or set someone apart, the record will automatically appear in your "My Tasks" section the moment the Current Step reaches your assignment.

---

## 4. Remote Approval Request

Admins can send an email to all High Councilors requesting remote approval votes for callings and ordinations that are at the "HC Approval" step.

**To send a Remote Approval Request:**
1. On the **Active Tracker** view of the Dashboard, tap the amber **"Send Remote Approval Request"** button.
2. A modal will appear listing all callings and ordinations currently at the "HC Approval" step.
3. Use the **Select All** checkbox or individually select the records you want to send for approval.
4. Tap **"Send Approval Request to High Council."**
5. An email will be sent to all High Councilors who have email addresses listed in the roster.

> **Note:** This button is only visible on the Active Tracker view and is hidden on the Conference and Actions views.

---

## 5. Actions (Task Management)

The **Actions** view is a built-in task management system for tracking action items discussed in leadership meetings.

### Accessing the Actions View
On the Dashboard tab, tap the green **"Actions"** button to switch to the Actions view.

### Creating a New Action
1. Tap the **"+ Create New Action"** button.
2. Fill in the required fields:
   - **Topic** — A short title for the action item (required).
   - **Action** — A description of what needs to be done (required).
   - **Owner** — Who is responsible. Select from groups (Everyone, High Council, Presidency) or individual names (required).
   - **Notes** — Optional additional details.
3. Tap **"Create Action."**

### Filtering Actions
Use the filter bar at the top to narrow down the list:
- **Filter: Open** — Shows action items that are still in progress (checked by default).
- **Filter: Closed** — Shows action items that have been completed or closed.
- **Search** — Type to search across action topics, descriptions, and owners.

### Managing Actions
Tap any action card to open its detail view:
- **Admins** can edit the owner, close or reopen the action, and see a completion progress bar.
- **All users** can mark their individual task as complete using the "Mark as Complete" toggle.

### Emailing Action Digests
Admins can tap **"Email Actions / Tasks"** to send a summary email to all Presidency, High Councilors, and Admins who have email addresses in the roster. The email includes their active assignments and action items.

---

## 6. Action / Task Email Notifications

Admins can send personalized email summaries to all leadership members.
Admins can also set the system to automatically send emails using Google App Script triggers.

### Sending Action / Task Email Notifications
1. Go to **Settings** and find the **"Email Digests"** card, or tap **"Email Actions / Tasks"** in the Actions view.
2. Tap **"Email Actions / Tasks"** to send a digest to all members with email addresses listed in the roster.
3. Each recipient receives a personalized email listing:
   - Their active **assignments** (callings to extend, people to set apart, etc.)
   - Their **action items** from the Actions system

### Sending a Test Email
In the Email Digests settings card, tap **"Send Test"** to send a single test email to any email address you enter. This lets you preview what the digest looks like before sending to the full roster.

---

## 7. Settings — Admin Roster

In the Settings tab, the **Admins Roster** card manages the two admin roles:

| Label | Role | Tasks Assigned |
|-------|------|----------------|
| **Clerk** | First admin slot | Admin Review tasks, Certificate & LCR tasks |
| **Executive Secretary** | Second admin slot | Set Up Priesthood Interview tasks |

Each admin slot has a **Name** field and an **Email** field. The email field is used for sending email digests and notifications.

---

## 8. Demo Mode

Demo mode should only be used when first installing the app so users can test the application with sample data. Once you go live, it will permanently remove all active data in the app.

### Wiping Demo Data ("Go Live")

Once training is complete, you can safely wipe out all the test callings and records and reset the app for live use:

1. Navigate to the **Settings** tab in the app.
2. Below the "App User Manual" button, you will see an amber button labeled **"Go Live - Clear Demo Data."**
3. Clicking this button will display a confirmation warning. If accepted, the app will automatically wipe all test rows from the Actions, Records, and Pulpit Tracker tabs in your Google Sheet, leaving only the headers intact. It will also clear out the Presidency, High Council, and Admin names in the Settings tab (while safely preserving your PIN numbers) and turn Demo Mode to "Off."

---

## 9. Creating a New Instance of the App for a New Stake

To deploy this app for an entirely new stake, you will need to set up the Google Apps Script backend and the frontend deployment.

### Steps:

1. **Duplicate the Google Sheet:** Create a new copy of the master Google Sheet that houses all the data using this link:
   [https://docs.google.com/spreadsheets/d/1EVMPpaUt_-S4Tn-ygUFcr-jgTmYU8O5Yw2zmmQnP9Hg/copy](https://docs.google.com/spreadsheets/d/1EVMPpaUt_-S4Tn-ygUFcr-jgTmYU8O5Yw2zmmQnP9Hg/copy)

2. **Clear Existing Data:** In the new Google Sheet, clear out the rows in the data tabs (Callings & Releases, Ordinations, Release Only). Do not delete the header rows.

3. **Update Settings:** Go to the Settings tab in the new sheet and update the lists of names for the Stake Presidency, High Councilors, Admins, and Units to match the new stake.

4. **Deploy Google Apps Script:**
   - Open the Apps Script editor from the new Google Sheet (Extensions > Apps Script).
   - Copy the `Code.js` backend script into the editor.
   - Deploy as a Web App (Deploy > New Deployment). Set "Execute as: Me" and "Who has access: Anyone."
   - Copy the resulting Web App URL.

5. **Connect the Frontend:**
   - Open the frontend code (`index.html`).
   - Locate the `APPS_SCRIPT_URL` variable at the top of the file and replace the URL string with the new Web App URL from Step 4.
   - Deploy the frontend via your hosting provider (e.g., GitHub Pages, Firebase, Vercel, etc.).

---

## 10. Frequently Asked Questions (FAQ)

**Q: I've been assigned as the Trainer, but the record isn't showing up in my "My Tasks." Why?**
A: A record only appears in your tasks when the "Current Step" matches your assignment. Even if you are the Assigned Trainer, the record won't appear in your tasks until the Stake Presidency or Admin changes the Current Step to "Training."

**Q: A name I want to assign isn't in the dropdown list. What do I do?**
A: The dropdown lists for assignment fields (like "Assigned Trainer" or "Set Apart By") populate from the Google Sheet settings. However, you can freely type any custom name into these boxes! Just click the box and start typing.

**Q: The app seems slow to update after I make a change on my phone. Is it broken?**
A: The app relies on a Google Sheet backend, which can sometimes take 1-3 seconds to process saves. When you change a dropdown or type in a text box, wait for the small "Saving..." toast notification at the bottom of the screen to confirm your change was securely pushed to the database.

**Q: How do we remove old or completed callings from the main dashboard?**
A: Change the "Current Step" to Complete, Declined, or Cancelled. The app automatically filters these out of the active dashboards to keep your views clean. They remain safely stored in the Google Sheet.

**Q: Why are some fields greyed out for me?**
A: High Councilors have restricted views to prevent accidental overwrites of clerical data. Only Admins and the Stake Presidency can change structural fields like the "Current Step" or Assignment names.

**Q: How does the app decide when to automatically advance the Current Step?**
A: The app auto-advances the Current Step when specific fields are filled in:

- **Callings:**
  - *Sustain → Set Apart:* Triggered when **Date Sustained** is entered.
  - *Set Apart → Admin Review:* Triggered when **Date Sustained**, **Date Set Apart**, and **Assigned to Set Apart** are all populated.

- **Ordinations:**
  - *Sustaining → Ordination:* Triggered when **Date Sustained** is entered.
  - *Ordination → Certificate:* Triggered when **Date Sustained**, **Ordained Date**, and **Ordained By** are all populated.
