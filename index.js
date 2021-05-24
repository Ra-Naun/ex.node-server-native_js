const http = require("http");
const fs = require("fs");
const path = require("path");
const parser = require("./parser/parser");
const { getParams, getUrl, } = require("./utils");

const server = http.createServer(async (req, res) => {

    const url = getUrl(req);
    const params = getParams(req)
    switch (url) {
        case '/4freephotos/save-images':
        {
            const data = await parser.start(params);
            res
            .writeHead(200, {
                'Content-Type': 'application/json'
            })
            .end(await JSON.stringify(data));
            break;
        }
        default:
        {
            let filePath = path.join(__dirname, url);
            const ext = path.extname(filePath);
            let contentType = "text/html";

            switch (ext.toLowerCase()) {
                case ".jpg":
                    contentType = "image/jpeg";
                    break;
                case ".png":
                    contentType = "image/png";
                    break;
                case ".svg":
                    contentType = "image/png";
                    break;
            }

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                    });
                    res.end(JSON.stringify({
                        err,
                    }));
                } else {
                    res.writeHead(200, {
                        "Content-Type": contentType,
                    });
                    res.end(content);
                }
            });
            break
        };
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server has been started on ${PORT}...`);
});
