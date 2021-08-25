const Keyv = require('keyv')
const guilddb = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});
const { updateSuggestion } = require('../functions.js');
const { readJSON } = require('../json.js');

module.exports = {
    name:'temp',
    usage:'temp [guild id] [message id] [n/p] [amount]',
    async execute({client, args}){
        if(!args[0] || !args[1] || !args[2] || !args[3]) return console.log("\x1b[32m%s\x1b[0m", 'Usage: ' + this.usage);
        let data = await guilddb.get(`${args[0]}/Suggestions/${args[1]}`);
        if(args[2] == 'p') data.positive += parseInt(args[3]);
        else data.negative += parseInt(args[3]);
        await guilddb.set(`${args[0]}/Suggestions/${args[1]}`, data);

        const { suggestionsChannel } = await readJSON('config.json');
        const channel = await client.channels.fetch(suggestionsChannel);
        if(!channel) return;
        const message = await channel.messages.fetch(args[1]);
        if(!message) return;
        await updateSuggestion(data, message);
    }
};