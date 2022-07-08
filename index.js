//const http = require("http");
const express = require("express");
const session = require("express-session");

const { getPhotosHandler } = require("./rest/get-photos-handler");
const { getAlbumHandler } = require("./rest/get-albums-handler");
const { getIdentifyHandler } = require("./rest/get-identify-handler");
const { getLogoutHandler } = require("./rest/get-logout-handler");
const {
  oauth2CallbackHandler,
  getAuthUrl,
} = require("./rest/oauth2-callback-handler");
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
const port = parseInt(process.env.PORT) || 3000;

async function main() {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  app.use(session({ secret: "asdfneil", cookie: { maxAge: 60000 } }));

  app.get("/", (req, res) => {
    console.log(req.session.access_token);
    if (req.session.access_token) {
      res.writeHead(301, { Location: "home.html" });
    } else {
      const authorizationUrl = getAuthUrl();
      res.writeHead(301, { Location: authorizationUrl });
    }
    res.end();
  });

  app.get("/oauth2callback", oauth2CallbackHandler);
  app.get("/getalbums", getAlbumHandler);
  app.get("/getphotos", getPhotosHandler);
  app.get("/identify", getIdentifyHandler);
  app.get("/logout", getLogoutHandler);
}

main().catch(console.error);
