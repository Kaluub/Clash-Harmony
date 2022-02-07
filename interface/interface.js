const http = require('http');
const fs = require('fs');
const url = require('url');

const { Collection } = require('discord.js');

const methods = new Map();
const methodFiles = fs.readdirSync('./interface/api').filter(file => file.endsWith('.js'));
for(const file of methodFiles){
    const method = require(`./api/${file}`);
    methods.set(method.name, method);
};

const receivedData = new Collection();

class WebData {
    constructor(address) {
        this.address = address;
        this.connections = [];
    };
};

function interface(client){
    if(!client) throw new Error(`The interface requires a valid Discord client!`);

    http.createServer(async (req, res) => {
        const address = req.socket.remoteAddress;
        let data = receivedData.get(address) ?? new WebData(address);
        data.connections.push({time: Date.now()});
        data.connections = data.connections.filter(conn => conn.time > Date.now() - 600000);
        receivedData.set(address, data);

        if(data.connections.length > 60) { // more than 60 requests in the last minute
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Ratelimit");
        };

        let parsed = url.parse(req.url, true);

        if(parsed.pathname.startsWith('/api/')){ // API Handler
            const methodName = parsed.pathname.slice(5).slice(0, -1);
            const method = methods.get(methodName);
            if(method){
                try {
                    await method.run({client:client, parsed:parsed, req:req, res:res});
                } catch(error){
                    console.error(error);
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    return res.end("500 Unknown Server Error");
                };
                return;
            } else {
                res.writeHead(400, {'Content-Type': 'text/html'});
                return res.end("400 API Method Invalid");
            };
        };

        if(parsed.pathname != '/'){ // File Server
            if(parsed.pathname.endsWith('.html') || parsed.pathname.endsWith('.css') || parsed.pathname.endsWith('.png')){
                fs.readFile(`./interface${parsed.pathname}`, (err, data) => {
                    if(err){
                        res.writeHead(404, {'Content-Type': 'text/html'});
                        return res.end("404 Not Found");
                    };
                    res.writeHead(200, parsed.pathname.endsWith('.css') ? {'Content-Type': 'text/css'} : {'Content-Type': 'text/html'});
                    res.write(data);
                    return res.end();
                });
                return;
            } else {
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end("404 Not Found");
            };
        };

        fs.readFile('./interface/main.html', (err, data) => { // If nothing else, show the main page
            if(err){
                console.error(err);
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end('404 Not Found.');
            };
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            return res.end();
        });
    }).listen(64);
};

module.exports = interface;