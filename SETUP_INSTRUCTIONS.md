# Quick Setup Instructions

## What You Need (5 minutes)

You need to create a **Google Cloud Service Account** (not a regular Google user). This is a special account that lets your app access Google Sheets via API.

## Step-by-Step:

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Click the project dropdown at the top
- Click "New Project" (or use existing)
- Name it "KidoRide" (or anything)
- Click "Create"

### 3. Enable Google Sheets API
- In the left menu: "APIs & Services" > "Library"
- Search for "Google Sheets API"
- Click on it, then click "Enable"

### 4. Create Service Account
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "Service Account"
- **Service account name:** `kidoride-service`
- Click "Create and Continue"
- Skip "Grant this service account access" (click "Continue")
- Click "Done"

### 5. Create Key (Download JSON)
- Click on the service account you just created (the email that looks like `kidoride-service@...`)
- Go to "Keys" tab
- Click "Add Key" > "Create new key"
- Choose **JSON** format
- Click "Create"
- **A file will download** - save it somewhere safe (like your Downloads folder)

### 6. Share Spreadsheet with Service Account
1. Open the downloaded JSON file (it's a text file)
2. Find the line that says `"client_email"` - it looks like:
   ```
   "client_email": "kidoride-service@your-project.iam.gserviceaccount.com"
   ```
3. Copy that email address (the part in quotes)
4. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI/edit
5. Click the "Share" button (top right)
6. Paste the service account email
7. Make sure it says "Editor" (not Viewer)
8. Uncheck "Notify people" (optional)
9. Click "Share"

### 7. Create .env.local File
1. In your project folder, create a file named `.env.local`
2. Open the downloaded JSON file
3. Copy ALL its contents (the entire JSON)
4. In `.env.local`, add:

```env
GOOGLE_SHEET_ID=1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI
GOOGLE_SERVICE_ACCOUNT_KEY='PASTE_THE_ENTIRE_JSON_HERE'
```

**Important:** 
- Put the JSON between single quotes `'...'`
- Make sure it's all on one line (or properly formatted)
- The JSON should start with `{"type":"service_account"...`

### 8. Restart Your Server
```bash
# Stop your dev server (Ctrl+C)
npm run dev
```

## That's It!

After these steps, your app should be able to read and write to Google Sheets.

## Troubleshooting

**Still getting error?**
- Make sure `.env.local` is in the project root (same folder as `package.json`)
- Make sure the JSON is properly formatted (single quotes around it)
- Make sure you shared the spreadsheet with the service account email
- Restart your dev server after creating `.env.local`

**Need help?** The error message will tell you exactly what's missing.

