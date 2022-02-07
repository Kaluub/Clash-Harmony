const { UserData } = require('../../classes/data.js');
const { readJSON } = require('../../json.js');

module.exports = {
    name: 'reward',
    run: async ({parsed, res}) => {
        if(!parsed.query.reward) {
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };

        const rewards = readJSON('json/rewards.json');
        let reward = rewards[parsed.query.reward];

        if(!reward) {
            res.writeHead(400, {'Content-Type': 'text/html'});
            return res.end("400 Invalid Query");
        };

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(reward, null, 4));
    }
};