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
            const data = await parser.test(params);
            res
            .writeHead(200, {
                'Content-Type': 'application/json'
            })
            .end(data);
            break;
        }
        default:
        {
            let filePath = path.join(__dirname, "public", url === "/" ? "index.html" : url);
            const ext = path.extname(filePath);
            let contentType = "text/html";

            switch (ext) {
                case ".css":
                    contentType = "text/css";
                    break;
                case ".js":
                    contentType = "text/javascript";
                    break;
                default:
                    contentType = "text/html";
            }

            if (!ext) {
                filePath += ".html";
            }

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    fs.readFile(path.join(__dirname, "public", "error.html"), (err, data) => {
                        if (err) {
                            res.writeHead(500);
                            res.end("Error");
                        } else {
                            res.writeHead(200, {
                                "Content-Type": "text/html",
                            });
                            res.end(data);
                        }
                    });
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
