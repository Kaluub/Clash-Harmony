const { MessageEmbed } = require('discord.js');
const Keyv = require('keyv');
const { readJSON } = require('../json');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'add',
    admin:true,
    desc:'This command is used to add rewards directly to users from the shop.',
    usage:'!add [@user] [reward name]',
    async execute(message,args){
        if(!args[0] || !args[1]) return message.channel.send('Usage: ' + this.usage);
        let member = message.mentions.members.first();
        if(!member){
            try {
                let user = await message.client.users.fetch(args[0]);
                if(!user) return message.channel.send('Invalid user ID.');
                member = await message.guild.members.fetch(user);
                if(!member) return message.channel.send('Invalid guild member.');
            } catch {
                return message.channel.send('Usage: ' + this.usage);
            };
        };
        let userdata = await userdb.get(`${message.guild.id}/${member.user.id}`);
        let rewards = await readJSON('rewards.json');
        args.shift();
        let itemname = args.join(' ');
        let item, category = null;
        for(const i in rewards.rewards.frames){
            let f = rewards.rewards.frames[i];
            if(f.name.toLowerCase() == itemname.toLowerCase()){
                item = f; category = 'frames';
                break;
            };
        };
        if(!item){
            for(const i in rewards.rewards.backgrounds){
                let b = rewards.rewards.backgrounds[i];
                if(b.name.toLowerCase() == itemname.toLowerCase()){
                    item = b; category = 'backgrounds';
                    break;
                };
            };
            if(!item){
                for(const i in rewards.rewards.roles){
                    let r = rewards.rewards.roles[i];
                    if(r.name.toLowerCase() == itemname.toLowerCase()){
                        item = r; category = 'roles';
                        break;
                    };
                };
                if(!item){
                    for(const i in rewards.rewards.services){
                        let s = rewards.rewards.services[i];
                        if(s.name.toLowerCase() == itemname.toLowerCase()){
                            item = s; category = 'services';
                            break;
                        };
                    };
                };
            };
        };
        if(!item) return message.channel.send(`No reward found with the name \`${itemname}\`.`);
        if(category == 'frames' || category == 'backgrounds'){
            if(await userdata.unlocked[category].includes(item.id)) return message.channel.send('This user has this reward.');
            userdata.unlocked[category].push(item.id);
            await userdb.set(`${message.guild.id}/${member.user.id}`,userdata);
            return message.channel.send(`You gave the ${item.name} to ${member.user.tag}.`);
        } else if(category == 'roles'){
            if(message.guild.id != '636986136283185172') return message.channel.send('This reward can only be claimed in the Clash & Harmony discord server!');
            if(await message.member.roles.cache.has(item.id)) return message.channel.send('This user has this reward!');
            await message.member.roles.add(item.id,`Reward given by ${message.author.tag}.`);
            return message.channel.send(`You gave the ${item.name} to ${member.user.tag}.`);
        } else if(category == 'services'){
            const LMO = await message.client.users.fetch('186459664974741504');
            const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${message.author} (${message.author.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
            await LMO.send(embed);
            return message.channel.send(`You gave the ${item.name} to ${member.user.tag}.`);
        } else {
            return message.channel.send(`There was an error rewarding this item.`);
        };
    }
};