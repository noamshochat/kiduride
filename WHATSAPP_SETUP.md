# WhatsApp Weekly Schedule Feature

This feature allows admins to send WhatsApp messages to all drivers with rides in the current week using Twilio's WhatsApp API.

## Setup Instructions

### 1. Get Twilio Credentials

1. Sign up at [twilio.com](https://www.twilio.com)
2. Go to **Console → Account Info** and copy:
   - **Account SID** (starts with `AC`)
   - **Auth Token**
3. Go to **Console → Develop → Messaging → Try it out → Send an SMS** and click "Get a Twilio Number" to get your WhatsApp number (format: `whatsapp:+1234567890`)

### 2. Create a WhatsApp Content Template (Optional)

For best results, create a message template in Twilio:

1. Go to **Console → Messaging → Content Templates**
2. Click **Create Template**
3. Example template with variables:
   ```
   Hello! Here's this week's drive schedule:
   Date: {1}
   Time: {2}
   Pickup: {3}
   ```
4. Copy the **Template SID** (format: `HXb5b62575e6e4ff6129ad7c8efe1f983e`)

### 3. Add Environment Variables

Create or update `.env.local`:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Ensure Driver Phone Numbers

Make sure all drivers have their WhatsApp phone numbers stored in the `users` table in Supabase:

```sql
UPDATE users SET phone = '+972586084212' WHERE id = 'driver_id';
```

## How to Use

### For Admins:

1. Log in as an admin user to the driver dashboard
2. Click the **"📱 Send WhatsApp to This Week's Drivers"** button
3. Enter:
   - **Twilio Template SID** - Your template ID from Twilio
   - **Content Variables** (optional) - JSON with template variables, e.g.:
     ```json
     {"1": "Feb 10", "2": "8:00 AM", "3": "Central Station"}
     ```
4. Click **"Send WhatsApp Messages"**
5. You'll see a success message with the count of drivers messaged

### API Endpoint

**POST** `/api/admin/send-weekly-drivers-whatsapp`

Request body:
```json
{
  "userId": "user_id",
  "templateSid": "HXb5b62575e6e4ff6129ad7c8efe1f983e",
  "contentVariables": "{\"1\":\"Feb 10\",\"2\":\"8:00 AM\"}"
}
```

Response:
```json
{
  "message": "WhatsApp messages sent to drivers",
  "driversMessaged": 3,
  "totalDrivers": 3,
  "errors": []
}
```

## How It Works

1. Gets all drivers with rides in the current week (Sunday-Saturday)
2. Retrieves their phone numbers from the database
3. Sends WhatsApp message using Twilio's Content API with your template
4. Returns success/error count

## Troubleshooting

### "Twilio credentials not configured"
- Make sure you've added all three environment variables
- Restart the development server after adding env variables

### "Failed to send message to driver"
- Check the driver's phone number format: should be international format with country code
- Make sure the phone number is in WhatsApp contact list
- If using Sandbox, ensure the driver has approved the Twilio WhatsApp Sandbox

### "Invalid template SID"
- Verify the Template SID is copied correctly from Twilio Console
- Make sure it's a Content API template, not a legacy template

## Cost

Twilio WhatsApp charges per message sent:
- Check [Twilio Pricing](https://www.twilio.com/whatsapp/pricing) for current rates
- Set up billing alerts in Twilio Console to track usage

## Security Notes

- Never commit environment variables to Git
- Keep Auth Token private - treat it like a password
- Use template variables instead of hardcoding sensitive info
- Verify user is admin before allowing message sending (enforced in API route)
