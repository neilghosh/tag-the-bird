const https = require("https");
const url = require("url");
const { google } = require("googleapis");

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 */

/* Global variable that stores user credential in this code example.
 * ACTION ITEM for developers:
 *   Store user's refresh token in your data store if
 *   incorporating this code into your real app.
 *   For more information on handling refresh tokens,
 *   see https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
 */
let userCredential = null;

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

console.log("Redirect URL :" + process.env.REDIRECT_URL);
// Access scopes for read-only Drive activity.
const scopes = ["https://www.googleapis.com/auth/photoslibrary.readonly"];

// Generate a url that asks permissions for the Drive activity scope
const authorizationUrl = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: "offline",
  /** Pass in the scopes array defined above.
   * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
  scope: scopes,
  // Enable incremental authorization. Recommended as a best practice.
  include_granted_scopes: true,
});

const getAuthUrl = () => {
  return authorizationUrl;
};

const oauth2CallbackHandler = async (req, res) => {
  let q = url.parse(req.url, true).query;
  if (q.error) {
    // An error response e.g. error=access_denied
    console.log("Error:" + q.error);
  } else {
    // Get access and refresh tokens (if access_type is offline)
    let response = await oauth2Client.getToken(q.code);
    oauth2Client.setCredentials(response.tokens);

    /** Save credential to the global variable in case access token was refreshed.
     * ACTION ITEM: In a production app, you likely want to save the refresh token
     *              in a secure persistent database instead. */
    userCredential = response.tokens;
    //const userInfo = JSON.parse(Buffer.from(response.tokens.id_token.split('.')[1], 'base64').toString());
    //console.log(userInfo);
    // Example of using Google Drive API to list filenames in user's Drive.
    //Authorization: Bearer oauth2-token
    req.session.access_token = userCredential.access_token;

    // res.setHeader("Content-Type", "application/json");
    // res.write('{"loggedIn":"success"}');
    res.writeHead(301, { Location: "home.html" });
    res.end();
  }
};

module.exports = {
  oauth2CallbackHandler,
  getAuthUrl,
};
