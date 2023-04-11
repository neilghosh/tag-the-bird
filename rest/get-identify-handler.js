const https = require("https");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const Stream = require("stream").Transform;
const vision = require("@google-cloud/vision");
const axios = require("axios");

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
  if (req.query.detectobject === "true") {
    let options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0",
      },
      maxRedirects: 0,
      //TODO need to try by allowing axios to redirect and land on the result directly and 
      //parse it directly. Current regex works only in the two step fetch
      validateStatus: function (status) {
        // if this function returns true, exception is not thrown, so
        // in simplest case just return true to handle status checks externally.
        return true;
      },
    };
    let result = await axios.get(
      "https://lens.google.com/uploadbyurl?url=" + photoId,
      options
    );
    //console.log(result);
    const lensUrl = result.headers["location"];
    result = await axios.get(lensUrl);
    const lensResult = result.data;
    //const regex = /dir="ltr" class.*?>(.*?)<\/div/gm; 
    //This regex works when lens is loaded in browser. probably some 
    //init JS function gets invoked after being loaded and DOM changes .
    const regex = /data:(\[\[.*?https.*?"])/gm;
    //This regex is dirtier but required to have when loaded via XHR/Proxy
    const matches = lensResult.matchAll(regex);
    let labels = [];
    for (const object of matches) {
      try {
        //TODO we dont know which one is well formatted json so taking a chance on every one.
        labels = JSON.parse(object[0].substring(5))[2][3][0][0][2];
        break;
      } catch (error) {
        console.log("Unable to parse ", object[0].substring(5));
      }
    }

    const response = [];
    for (const label of labels) {
      response.push({ description: label[2], confidence: label[3] });
    }
    res.write(JSON.stringify(response));
    console.log("Response", response);
    res.end();
  } else {
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
  }
};

module.exports = {
  getIdentifyHandler,
};
