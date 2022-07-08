const https = require("https");

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

const getPhotosHandler = async (req, res) => {
  access_token = req.session.access_token;
  albumId = req.query.albumid;
  const mediaItems = await getPhotos(albumId, access_token);
  console.log(mediaItems.mediaItems.length);
  //res.write(JSON.stringify(mediaItems));
  res.render("photos", {
    username: "neil",
    mediaItems: mediaItems,
    access_token: access_token,
  }); // index refers to index.ejs
  res.end();
};

module.exports = {
  getPhotosHandler,
};
