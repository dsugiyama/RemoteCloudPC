'use strict';

import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';

const mimetypes: { [extension: string]: string } = {
    '.html': 'text/html',
    '.js': 'text/javascript'
};

http.createServer((request, response) => {
    const filename = decodeURI(request.url).substr(1) || 'index.html';
    if (fs.existsSync(filename)) {
        response.writeHead(200, { 'Content-Type': mimetypes[path.extname(filename)] });
        response.end(fs.readFileSync(filename));
    } else {
        response.writeHead(404);
        response.end('Not found.');
    }
}).listen(1337);
