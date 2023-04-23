const https = require("https");

function updatePhoto(photoid,description, access_token) {
  //PATCH https://photoslibrary.googleapis.com/v1/mediaItems/media-item-id?updateMask=description
  console.log("Setting content of photoid " + photoid);
  const postData = JSON.stringify({
    description: description,
  });
  const options = {
    hostname: "photoslibrary.googleapis.com",
    port: 443,
    path: "/v1/mediaItems/photoid?updateMask=description",
    method: "PATCH",
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

const updatePhotosHandler = async (req, res) => {
  access_token = req.session.access_token;
  photoid = req.query.photoid;
  description = req.query.description;
  const mediaItems = await updatePhoto(photoid,description, access_token);
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
  updatePhotosHandler,
};
