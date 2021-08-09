const {writeJSON} = require('../json.js');
const {MessageAttachment} = require('discord.js');
const fetch = require('node-fetch');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const guilddb = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

module.exports = {
    name:'db',
    admin:true,
    desc:'This is a dangerous but useful command for managing user data.',
    usage:'/db [get/set] [guild ID + / + user ID]',
    execute: async ({interaction,message,args}) => {
        if(message){
            if(!args[0] || !args[1]) return `Usage: ${module.exports.usage}`;
            if(args[0] == 'get'){
                let userdata = await userdb.get(args[1]);
                if(!userdata) userdata = await guilddb.get(args[1]);
                if(!userdata) return 'No data found for this user.';
                writeJSON('data/userdata.json',userdata);
                const attachment = new MessageAttachment('./data/userdata.json','userdata.json');
                return {content:`Data for ${args[1]}:`,files:[attachment]};
            };
            if(args[0] == 'set'){
                let attachment = message.attachments.filter(att => att.name && att.name.endsWith('.json')).first();
                if(!attachment) return 'Please attach a .json file to set.';
                let data = await fetch(attachment.url).then(res => res.json());
                await userdb.set(args[1],data);
                return `Data set for ${args[1]}.`;
            };
            return `Usage: ${module.exports.usage}`;
        };
        if(interaction){
            if(interaction.options.getSubcommand(false) == 'get'){
                let userdata = await userdb.get(`${interaction.options.getString('guild-id')}/${interaction.options.getString('user-id')}`);
                if(!userdata) return 'No data found for this user.';
                writeJSON('data/userdata.json',userdata);
                const attachment = new MessageAttachment('./data/userdata.json','userdata.json');
                return {content:`Data for ${interaction.options.getString('guild-id')}/${interaction.options.getString('user-id')}:`,files:[attachment]};
            };
            if(interaction.options.getSubcommand(false) == 'set') return `Unsupported until Discord supports receiving attachments over interactions.`;
        };
    }
};