//const http = require("http");
const https = require("https");
const url = require("url");
const { google } = require("googleapis");
const express = require("express");
const session = require("express-session");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const Stream = require('stream').Transform;
const vision = require('@google-cloud/vision');

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
const port = parseInt(process.env.PORT) || 3000;

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 */
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

/* Global variable that stores user credential in this code example.
 * ACTION ITEM for developers:
 *   Store user's refresh token in your data store if
 *   incorporating this code into your real app.
 *   For more information on handling refresh tokens,
 *   see https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
 */
let userCredential = null;

function getAlbums(access_token) {
  const options = {
    hostname: "photoslibrary.googleapis.com",
    port: 443,
    path: "/v1/albums",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + access_token,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(responseBody));
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    //req.write(data);
    req.end();
  });
}

function getPhotos(albumId, access_token) {
  console.log("Getting content of album " + albumId);
  const postData = JSON.stringify({
    albumId: albumId,
  });
  const options = {
    hostname: "photoslibrary.googleapis.com",
    port: 443,
    path: "/v1/mediaItems:search",
    method: "POST",
    body: postData,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": postData.length,
      Authorization: "Bearer " + access_token,
    },
  };
  console.log(options);
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(responseBody));
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

function identify(photoId, access_token) {
  console.log("Identifying objects in " + photoId);
  //save to disk
  const url = photoId;
  const uuid = uuidv4();
  return new Promise((resolve, reject) => {
    https
      .request(url, function (response) {
        var data = new Stream();

        response.on("data", function (chunk) {
          data.push(chunk);
        });

        response.on("end", function () {
          fs.writeFileSync("/tmp/" + uuid, data.read());
          console.log("copied "+ "/tmp/" + uuid);
          resolve(uuid);
        });
      })
      .end();
  });
  // const postData = JSON.stringify({
  //   albumId: albumId,
  // });
  // const options = {
  //   hostname: "photoslibrary.googleapis.com",
  //   port: 443,
  //   path: "/v1/mediaItems:search",
  //   method: "POST",
  //   body: postData,
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Content-Length": postData.length,
  //     Authorization: "Bearer " + access_token,
  //   },
  // };
  // console.log(options);
  // return new Promise((resolve, reject) => {
  //   const req = https.request(options, (res) => {
  //     res.setEncoding("utf8");
  //     let responseBody = "";

  //     res.on("data", (chunk) => {
  //       responseBody += chunk;
  //     });

  //     res.on("end", () => {
  //       resolve(JSON.parse(responseBody));
  //     });
  //   });

  //   req.on("error", (err) => {
  //     reject(err);
  //   });

  //   req.write(postData);
  //   req.end();
  // });
}

async function main() {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  app.use(session({ secret: "asdfneil", cookie: { maxAge: 60000 } }));

  app.get("/", (req, res) => {
    res.writeHead(301, { Location: authorizationUrl });
    res.end();
  });

  app.get("/oauth2callback", async (req, res) => {
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
  });

  app.get("/getalbums", async (req, res) => {
    access_token = req.session.access_token;
    const albums = await getAlbums(access_token);
    console.log("Found albums :" + albums.albums.length);
    //res.write(JSON.stringify(albums));
    res.render("albums", {
      username: "neil",
      albums: albums,
    }); // index refers to index.ejs
    //res.end();
  });

  app.get("/getphotos", async (req, res) => {
    access_token = req.session.access_token;
    albumId = req.query.albumid;
    const mediaItems = await getPhotos(albumId, access_token);
    console.log(mediaItems.mediaItems.length);
    //res.write(JSON.stringify(mediaItems));
    res.render("photos", {
      username: "neil",
      mediaItems: mediaItems,
      access_token : access_token
    }); // index refers to index.ejs
    res.end();
  });
  //identify
  app.get("/identify", async (req, res) => {
    access_token = req.session.access_token;
    photoId = req.query.photoid;
    const uuid = await identify(photoId, access_token);
    //console.log(mediaItems.mediaItems.length);
    console.log(uuid);

    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    const fileName = "/tmp/"+uuid;

    // Performs label detection on the local file
    const [result] = await client.labelDetection(fileName);
    const labels = result.labelAnnotations;
    console.log('Labels:');
    labels.forEach(label => console.log(label.description));
    res.write(JSON.stringify(labels));

    // res.render("photos",{
    //   username: "neil",
    //   mediaItems: mediaItems
    // }); // index refers to index.ejs
    res.end();
  });

  app.get("/logout", (req, logoutResponse) => {
    // Build the string for the POST request
    let postData = "token=" + req.session.access_token;
    // Options for POST request to Google's OAuth 2.0 server to revoke a token
    let postOptions = {
      host: "oauth2.googleapis.com",
      port: "443",
      path: "/revoke",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    // Set up the request
    const postReq = https.request(postOptions, function (res) {
      res.setEncoding("utf8");
      res.on("data", (d) => {
        console.log("Response: " + d);
        //logoutResponse.send("Logged Out")
        logoutResponse.writeHead(301, { Location: "/" });
        logoutResponse.end();
      });
    });

    postReq.on("error", (error) => {
      console.log(error);
      logoutResponse.send("Error Logging Out");
    });

    // Post the request with data
    postReq.write(postData);
    postReq.end();
  });
}

main().catch(console.error);
