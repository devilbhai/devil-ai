---
name: google-workspace
description: Interact with Gmail, Google Calendar, Drive, Sheets, and Docs via the Google API with service account or OAuth credentials
category: productivity
version: 1.0.0
origin: devil-ai
license: Apache-2.0
tags: google, gmail, calendar, drive, sheets, docs, workspace, api, oauth, email
---

# Google Workspace Integration

Access Gmail, Google Calendar, Drive, Sheets, and Docs through the Google REST APIs.

**CRITICAL NOTE FOR DEVIL AI AGENTS:** 
When the user has connected Gmail/Google Calendar via Devil AI Connectors, the OAuth access token is **ALREADY INJECTED** into your terminal environment as `$GOOGLE_ACCESS_TOKEN`. You DO NOT need to read encrypted credentials or use `gcloud`. Just use `curl` with this token!

## When to Use

- User wants to read or send Gmail messages
- User wants to list or create Google Calendar events
- User wants to read/write a Google Sheet
- User wants to list Google Drive files
- User wants to read or update a Google Doc

## How to Use (macOS/Linux)

### 1. Authenticate

Simply use the injected environment variable for your `curl` commands:
\`\`\`bash
HEADER="Authorization: Bearer $GOOGLE_ACCESS_TOKEN"
\`\`\`

*(If `$GOOGLE_ACCESS_TOKEN` is missing, tell the user they need to connect Gmail in the Devil AI Connectors settings first and restart the app).*

### 2. List recent Gmail messages

\`\`\`bash
curl -s -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10"
\`\`\`

To read a specific message to see its subject/from/date:
\`\`\`bash
curl -s -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" "https://gmail.googleapis.com/gmail/v1/users/me/messages/MESSAGE_ID?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date"
\`\`\`

### 3. List today's Calendar events

\`\`\`bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
END=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ") # macOS specific date add 1 day
curl -s -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=$NOW&timeMax=$END&singleEvents=true&orderBy=startTime"
\`\`\`

### 4. Read a Google Sheet

\`\`\`bash
SPREADSHEET_ID="your-sheet-id"
RANGE="Sheet1!A1:E20"
curl -s -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" "https://sheets.googleapis.com/v4/spreadsheets/$SPREADSHEET_ID/values/$RANGE"
\`\`\`

## Examples

**"Show me my unread Gmail emails from today"**
→ Use step 2 with query parameter `q=is:unread` like:
\`\`\`bash
curl -G -s -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" "https://gmail.googleapis.com/gmail/v1/users/me/messages" --data-urlencode "q=is:unread" --data-urlencode "maxResults=10"
\`\`\`
Then iterate through the message IDs and fetch their metadata to show the user!

## Cautions

- OAuth tokens expire after 1 hour. Devil AI automatically manages this, but if a `curl` returns 401 Unauthorized, the token might have expired. Tell the user to reconnect.
- Use `jq` to parse the JSON output from `curl` to make it easier for you to read.
