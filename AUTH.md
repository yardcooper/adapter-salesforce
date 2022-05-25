## Authenticating Salesforce Adapter 

This document will go through the steps for authenticating the Salesforce adapter with Basic Authentication. Properly configuring the properties for an adapter in IAP is critical for getting the adapter online. You can read more about adapter authentication <a href="https://www.itential.com/automation-platform/integrations/adapters-resources/authentication/" target="_blank">HERE</a>. 

### Basic Authentication
The Salesforce adapter requires Basic Authentication. If you change authentication methods, you should change this section accordingly and merge it back into the adapter repository.

STEPS  
1. Ensure you have access to a Salesforce server and that it is running
2. Follow the steps in the README.md to import the adapter into IAP if you have not already done so
3. Use the properties below for the ```properties.authentication``` field
```json
"authentication": {
  "auth_method": "basic user_password",
  "username": "<username>",
  "password": "<password>",
  "token": "",
  "token_timeout": 1800000,
  "token_cache": "local",
  "invalid_token_error": 401,
  "auth_field": "header.headers.Authorization",
  "auth_field_format": "Basic {b64}{username}:{password}{/b64}",
  "auth_logging": false,
  "client_id": "",
  "client_secret": "",
  "grant_type": ""
}
```
4. Restart the adapter. If your properties were set correctly, the adapter should go online. 

### Troubleshooting
- Make sure you copied over the correct username and password.
- Turn on debug level logs for the adapter in IAP Admin Essentials.
- Turn on auth_logging for the adapter in IAP Admin Essentials (adapter properties).
- Investigate the logs - in particular:
  - The FULL REQUEST log to make sure the proper headers are being sent with the request.
  - The FULL BODY log to make sure the payload is accurate.
  - The CALL RETURN log to see what the other system is telling us.
- Remember when you are done to turn auth_logging off as you do not want to log credentials.
