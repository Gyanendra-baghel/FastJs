const http = require("http");
const fs = require('fs');
const path = require('path');

class FastJs {

    constructor() {
        this.routes = [];
        this.staticHandlers = [];
        this.notFoundHandler = this.default404;
    }
    use(handler) {
        this.routes.push({ path: '*', handler });
    }
    get(path, handler) {
        this.routes.push({ path, handler, method: 'GET' });
    }
    handleRequest(req, res) {
        console.log(req.url);
        const matchedRoutes = this.routes.filter(route => {
            if (route.method && route.method !== req.method) return false;
            if (route.path === "*" || route.path === req.url) return true;
            return false;
        });

        if (matchedRoutes.length === 0) {
            for (const { handler, dirPath } of this.staticHandlers) {
                if (req.url.startsWith('/' + path.basename(dirPath))) {
                    return handler(req, res);
                }
            }
        }

        if (matchedRoutes.length === 0) {
            this.notFoundHandler(req, res);
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        matchedRoutes.forEach((route) => {
            if (typeof route.handler === 'function') {
                route.handler(req, res);
            }
            else if (typeof route.handler === 'string') {
                this.renderFile(route.handler, res);
            }
        });
    }
    listen(port, callback) {
        const server = http.createServer(this.handleRequest.bind(this));
        server.listen(port, callback);
    }
    static(dirPath) {
        const handler = (req, res) => {
            const filePath = dirPath + req.url;
            fs.readFile(filePath, (err, data) => {
                if (!err)
                    res.end(data);
                else
                    return this.handleRequest(req, res);
            })
        }
        this.staticHandlers.push({ handler, dirPath });
        return handler;
    }
    renderFile(path, res) {
        const filePath = "./views/" + path.replace(/^\//, '');
        fs.readFile(filePath, (err, data) => {
            if (!err)
                res.end(data);
        })
    }
    render404(res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("Page Not Found");
    }
    setNotFoundhandler(handler) {
        this.notFoundHandler = handler;
    }
    default404(req, res) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end("<h1>Page Not Found</h1>");
    }
}


module.exports = FastJs;