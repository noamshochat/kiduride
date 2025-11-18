# Enable Google Sheets API

The error shows that Google Sheets API is not enabled for your project. Here's how to fix it:

## Quick Fix

1. **Click this link** (it's specific to your project):
   https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=475824161902

2. **Click the "Enable" button** (big blue button)

3. **Wait 1-2 minutes** for the API to be enabled

4. **Try creating a ride again** in your app

## Alternative: Manual Steps

If the link doesn't work:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in project `475824161902` (check the project dropdown at the top)
3. Go to "APIs & Services" > "Library" (in the left menu)
4. Search for "Google Sheets API"
5. Click on "Google Sheets API"
6. Click the "Enable" button
7. Wait 1-2 minutes
8. Try again

## After Enabling

Once enabled, your app should work! The error will go away and you'll be able to:
- Create rides
- Add passengers
- View rides from Google Sheets

