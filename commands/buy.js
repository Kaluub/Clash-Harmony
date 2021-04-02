const { MessageEmbed } = require('discord.js');
const Keyv = require('keyv');
const { readJSON } = require('../json');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'buy',
    aliases:['b'],
    admin:false,
    desc:'This command is used to purchase rewards from the shop.',
    usage:'!buy [reward name]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let rewards = await readJSON('rewards.json');
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
            if(userdata.unlocked[category].includes(item.id)) return message.channel.send('You already have this reward!');
            if(userdata.points < item.price) return message.channel.send(`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`);
            userdata.unlocked[category].push(item.id);
            userdata.points -= item.price;
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
            return message.channel.send(`You purchased the ${item.name} for ${item.price} points.`);
        } else if(category == 'roles'){
            if(message.guild.id != '636986136283185172') return message.channel.send('This reward can only be claimed in the Clash & Harmony discord server!');
            if(message.member.roles.cache.has(item.id)) return message.channel.send('You already have this reward!');
            if(userdata.points < item.price) return message.channel.send(`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`);
            userdata.points -= item.price;
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
            await message.member.roles.add(item.id,'Delivering purchase reward.');
            return message.channel.send(`You purchased the ${item.name} for ${item.price} points.`);
        } else if(category == 'services'){
            if(userdata.points < item.price) return message.channel.send(`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`);
            userdata.points -= item.price;
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
            const LMO = await message.client.users.fetch('186459664974741504');
            const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${message.author} (${message.author.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
            await LMO.send(embed);
            return message.channel.send(`You purchased the ${item.name} for ${item.price} points.`);
        } else {
            return message.channel.send(`There was an error purchasing this item.`);
        };
    }
};