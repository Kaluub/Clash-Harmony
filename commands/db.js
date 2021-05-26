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
    async execute({interaction,message,args}){
        if(message){
            if(!args[0] || !args[1]) return `Usage: ${this.usage}`;
            if(args[0] == 'get'){
                let userdata = await userdb.get(args[1]);
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
            return `Usage: ${this.usage}`;
        }
        if(interaction){
            if(interaction.options[0].name == 'get'){
                let userdata = await userdb.get(`${interaction.options[0].options[0].value}/${interaction.options[0].options[1].value}`);
                if(!userdata) return 'No data found for this user.';
                writeJSON('data/userdata.json',userdata);
                const attachment = new MessageAttachment('./data/userdata.json','userdata.json');
                return {content:`Data for ${interaction.options[0].options[0].value}/${interaction.options[0].options[1].value}:`,files:[attachment]};
            };
            if(interaction.options[0].name == 'set') return `Unsupported until Discord supports receiving attachments over interactions.`
        }
    }
};