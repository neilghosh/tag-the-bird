const https = require("https");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const Stream = require("stream").Transform;
const vision = require("@google-cloud/vision");

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
          console.log("copied " + "/tmp/" + uuid);
          resolve(uuid);
        });
      })
      .end();
  });
}

const getIdentifyHandler = async (req, res) => {
  access_token = req.session.access_token;
  photoId = req.query.photoid;
  const uuid = await identify(photoId, access_token);
  //console.log(mediaItems.mediaItems.length);
  console.log(uuid);

  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  const fileName = "/tmp/" + uuid;

  // Performs label detection on the local file
  const [result] = await client.labelDetection(fileName);
  const labels = result.labelAnnotations;
  console.log("Labels:");
  labels.forEach((label) => console.log(label.description));
  res.write(JSON.stringify(labels));

  // res.render("photos",{
  //   username: "neil",
  //   mediaItems: mediaItems
  // }); // index refers to index.ejs
  res.end();
};

module.exports = {
  getIdentifyHandler,
};
