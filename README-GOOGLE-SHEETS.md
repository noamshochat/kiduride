# Google Sheets Database Setup

This app can use Google Sheets as the database instead of a JSON file. Here's how to set it up:

## Setup Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "KiduRide Database" (or any name you prefer)
4. Create two sheets:
   - **Rides** - for storing ride information
   - **Passengers** - for storing passenger assignments

### 2. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 3. Create Service Account (Recommended)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Give it a name (e.g., "kiduride-service")
4. Click "Create and Continue"
5. Skip role assignment (or add "Editor" role)
6. Click "Done"
7. Click on the created service account
8. Go to "Keys" tab
9. Click "Add Key" > "Create new key"
10. Choose "JSON" format
11. Download the JSON file

### 4. Share Google Sheet with Service Account

1. Open the JSON file you downloaded
2. Copy the `client_email` value (looks like: `kiduride-service@project-id.iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click "Share" button
5. Paste the service account email
6. Give it "Editor" permission
7. Click "Send"

### 5. Configure Environment Variables

Create a `.env.local` file in the project root (you can copy from `.env.local.example`):

```env
GOOGLE_SHEET_ID=1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Your Spreadsheet ID is already set:** `1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI`

**For GOOGLE_SERVICE_ACCOUNT_KEY:**
- Open the downloaded JSON file from step 3
- Copy the entire JSON content
- Paste it as a single-line string in `.env.local` (use single quotes around it)
- **Important:** Make sure the `client_email` from this JSON is shared with your Google Sheet (step 4)

### 6. Initialize the Sheets

The sheets will be automatically initialized with headers when you first use the API, or you can run:

```typescript
// In a setup script or API route
await googleSheets.initializeSheets()
```

## Alternative: Public Sheet with API Key (Simpler, but less secure)

If you want a simpler setup for testing:

1. Make your Google Sheet **public** (Share > "Anyone with the link" > "Viewer")
2. Get an API Key from Google Cloud Console
3. Add to `.env.local`:

```env
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_API_KEY=your-api-key
```

**Note:** This only works for reading. For writing, you need OAuth or Service Account.

## Benefits

✅ **Easy to view/edit data** - Just open Google Sheets  
✅ **Real-time collaboration** - Multiple people can view simultaneously  
✅ **No server file management** - Google handles storage  
✅ **Accessible anywhere** - View from any device  
✅ **Automatic backups** - Google handles version history  

## Limitations

⚠️ **API Quotas** - 500 requests per 100 seconds per project  
⚠️ **Data Size** - 5 million cells per spreadsheet limit  
⚠️ **Performance** - Slower than a dedicated database for large datasets  

For a car-pool app, these limits should be more than sufficient!

