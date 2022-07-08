const https = require("https");

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

const getAlbumHandler = async (req, res) => {
  access_token = req.session.access_token;
  const albums = await getAlbums(access_token);
  console.log("Found albums :" + albums.albums.length);
  //res.write(JSON.stringify(albums));
  res.render("albums", {
    username: "neil",
    albums: albums,
  }); // index refers to index.ejs
  //res.end();
};

module.exports = {
  getAlbumHandler,
};
