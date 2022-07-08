const https = require("https");

const getLogoutHandler = (req, logoutResponse) => {
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
};

module.exports = {
  getLogoutHandler,
};
