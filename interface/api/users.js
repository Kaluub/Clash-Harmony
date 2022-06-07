const { UserData } = require('../../classes/data.js');

module.exports = {
    name: 'users',
    run: async ({parsed, res}) => {
        if(parsed.query.guildID && parsed.query.userID){
            const data = await UserData.get(parsed.query.guildID, parsed.query.userID);
            const userdata = JSON.stringify(data, null, 4);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(userdata);
        } else {
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };
    }
};