[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)


# How to run this program
1. Create a project at [Adobe Developer Console](https://developer.adobe.com/console).
1. Add the [PDF Services API](https://developer.adobe.com/document-services/docs/overview/pdf-services-api/) to the project with a [server-to-server authentication](https://developer.adobe.com/developer-console/docs/guides/authentication/ServerToServerAuthentication/) credential.
1. Find the Client ID.
1. Generate a client secret, not an access token.
1. Set the environment variables.
   ```shell
   export PDF_SERVICES_CLIENT_ID="YOUR_CLIENT_ID"
   export PDF_SERVICES_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   ```
1. Run the program.
   ```shell
   npx tsx src/main.ts
   ```
