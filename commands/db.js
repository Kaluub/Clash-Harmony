const {writeJSON} = require('../json.js');
const {MessageAttachment} = require('discord.js');
const fetch = require('node-fetch');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'db',
    admin:true,
    desc:'This is a dangerous but useful command for managing user data.',
    usage:'!db [get/set] [guild ID + / + user ID]',
    async execute(message,args){
        if(!args[0] || !args[1]) return message.channel.send('Usage: ' + this.usage);
        if(args[0] == 'get'){
            let userdata = await userdb.get(args[1]);
            if(!userdata) return message.channel.send('No data found for this user.');
            writeJSON('data/userdata.json',userdata);
            const attachment = new MessageAttachment('./data/userdata.json','userdata.json');
            return message.channel.send(`Data for ${args[1]}:`,attachment);
        };
        if(args[0] == 'set'){
            let attachment = message.attachments.filter(att => att.name && att.name.endsWith('.json')).first();
            if(!attachment) return message.channel.send('Please attach a .json file to set.');
            let data = await fetch(attachment.url).then(res => res.json());
            await userdb.set(args[1],data);
            return message.channel.send(`Data set for ${args[1]}.`);
        }
    }
};