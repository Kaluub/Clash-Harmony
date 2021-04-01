const {MessageEmbed} = require('discord.js');
const Keyv = require('keyv');
const {readJSON} = require('../json.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'custom',
    aliases:['c'],
    admin:false,
    desc:'This is a command for customizing your profile card.',
    usage:'!custom [frame/background/list] [value]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        if(args[0] == 'list'){
            if(!args[1]) return message.channel.send('Usage: !custom list [frames/backgrounds]');
            if(args[1] == 'frames' || args[1] == 'f'){
                let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
                let rewards = await readJSON('rewards.json');
                let embed = new MessageEmbed()
                    .setTitle('Owned frames:')
                    .setColor('#838383')
                    .setDescription('')
                for(const i in userdata.unlocked.frames){
                    let id = userdata.unlocked.frames[i]
                    let frame = rewards.rewards.frames[id];
                    embed.setDescription(embed.description + `\n• ${frame.name}`);
                };
                return message.channel.send(embed);
            };
            if(args[1] == 'backgrounds' || args[1] == 'b'){
                let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
                let rewards = await readJSON('rewards.json');
                let embed = new MessageEmbed()
                    .setTitle('Owned backgrounds:')
                    .setColor('#838383')
                    .setDescription('')
                for(const i in userdata.unlocked.backgrounds){
                    let id = userdata.unlocked.backgrounds[i]
                    let background = rewards.rewards.backgrounds[id];
                    embed.setDescription(embed.description + `\n• ${background.name}`);
                }
                return message.channel.send(embed);
            };
            return message.channel.send('Usage: !custom list [frames/backgrounds]');
        };
        if(args[0] == 'frame'){
            args.shift();
            let name = args.join(' ');
            let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
            let rewards = await readJSON('rewards.json');
            let frame = null;
            for(const i in rewards.rewards.frames){
                let f = rewards.rewards.frames[i];
                if(f.name.toLowerCase() == name.toLowerCase()){
                    frame = f;
                    break;
                };
            };
            if(!frame) return message.channel.send('There are no frames with this name.');
            if(!userdata.unlocked.frames.includes(frame.id)) return message.channel.send(`You don't own this frame. See \`!custom list frames\` for a list of owned frames.`);
            userdata.card.frame = frame.id;
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
            return message.channel.send(`Successfully set your active frame to ${frame.name}.`);
        };
        if(args[0] == 'background'){
            args.shift();
            let name = args.join(' ');
            let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
            let rewards = await readJSON('rewards.json');
            let background = null;
            for(const i in rewards.rewards.backgrounds){
                let b = rewards.rewards.backgrounds[i];
                if(b.name.toLowerCase() == name.toLowerCase()){
                    background = b;
                    break;
                };
            };
            if(!background) return message.channel.send('There are no backgrounds with this name.');
            if(!userdata.unlocked.backgrounds.includes(background.id)) return message.channel.send(`You don't own this background. See \`!custom list backgrounds\` for a list of owned backgrounds.`);
            userdata.card.background = background.id;
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
            return message.channel.send(`Successfully set your active frame to ${background.name}.`);
        };
        return message.channel.send('Usage: ' + this.usage);
    }
};