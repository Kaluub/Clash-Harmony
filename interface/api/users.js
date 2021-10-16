const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'users',
    async run({parsed, res}){
        if(parsed.query.guildID && parsed.query.userID){
            let data = await userdb.get(`${parsed.query.guildID}/${parsed.query.userID}`);
            if(!data) data = null;
            let userdata = JSON.stringify(data, null, 4);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(userdata);
        } else {
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };
    }
};