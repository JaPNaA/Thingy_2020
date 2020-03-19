import http from "http";

const server = http.createServer(function(req, res) {
    res.end(req.url);
});

server.listen(8081);