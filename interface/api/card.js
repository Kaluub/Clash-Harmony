const {readJSON} = require('../../json.js');
const {createProfileCard} = require('../../functions.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'card',
    async run({client, parsed, res}){
        if(!parsed.query.guildID || !parsed.query.userID){
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };
        const guild = client.guilds.cache.get(parsed.query.guildID)
        const member = await guild?.members?.fetch(parsed.query.userID);
        if(!member){
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };
        const userdata = await userdb.get(`${parsed.query.guildID}/${parsed.query.userID}`);
        if(!userdata){
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };

        const rewards = await readJSON('json/rewards.json');
        const buffer = await createProfileCard(member, rewards, userdata);

        res.writeHead(200, {'Content-Type': 'image/png'});
        return res.end(buffer);
    }
};