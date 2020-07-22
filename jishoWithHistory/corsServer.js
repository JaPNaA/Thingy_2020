const http = require("http");
const https = require("https");

http.createServer(function(req, res) {
    const url = req.url.slice(1);
    console.log(url);

    try {
        https.get(url, returningRes => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            returningRes.pipe(res);
        });
    } catch (err) {
        res.writeHead(500);
        res.end("Server error");
    }
}).listen(8081);

