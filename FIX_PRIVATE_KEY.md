# Fix: OpenSSL DECODER Error

This error happens when the private key in your JSON isn't properly formatted in the `.env.local` file.

## Solution 1: Use File Path (Easiest) ✅

Instead of putting the JSON in the environment variable, use the file path:

1. **Move your JSON file** to your project folder (e.g., `service-account-key.json`)
2. **Update `.env.local`** to use the file path:

```env
GOOGLE_SHEET_ID=1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account-key.json
```

3. **Make sure the JSON file is in your project root** (same folder as `package.json`)
4. **Restart your dev server**

## Solution 2: Fix JSON Format in .env.local

If you want to keep using the environment variable, the private key must have `\n` escape sequences:

1. **Open your original JSON file**
2. **Find the `private_key` field** - it should look like:
   ```json
   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```
3. **In `.env.local`, make sure the entire JSON is on ONE line** with `\n` preserved:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n","client_email":"..."}'
   ```

**Important:** Use double backslashes `\\n` in the env file, or the newlines will be lost.

## Recommendation

**Use Solution 1 (file path)** - it's much easier and less error-prone!

