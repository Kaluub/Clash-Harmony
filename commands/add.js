const {MessageEmbed} = require('discord.js');
const Keyv = require('keyv');
const {readJSON} = require('../json');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'add',
    admin:true,
    desc:'This command is used to add rewards directly to users from the shop.',
    usage:'!add [@user] [reward name]',
    async execute({interaction,message,args}){
        if(!args[0] || !args[1]) return `Usage: ${this.usage}`;
        let member = message?.mentions.members.first() ?? interaction?.options[0].member;
        const guild = interaction?.guild ?? message?.guild;
        const author = interaction?.user ?? message?.author;
        if(!member && message){
            try {
                member = await message.guild.members.fetch(args[0]);
                if(!member) return 'Invalid guild member.';
            } catch {
                return `Usage: ${this.usage}`;
            };
        } else if(!member){
            return `Invalid interaction received.`;
        };
        if(member.user.bot) return `You can't add rewards to a bot.`;
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let rewards = await readJSON('json/rewards.json');
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
        if(!item) return `No reward found with the name \`${itemname}\`.`;
        if(category == 'frames' || category == 'backgrounds'){
            if(await userdata.unlocked[category].includes(item.id)) return 'This user has this reward.';
            userdata.unlocked[category].push(item.id);
            await userdb.set(`${guild.id}/${member.user.id}`,userdata);
            return `You gave the ${item.name} to ${member.user.tag}.`;
        } else if(category == 'roles'){
            if(guild.id != '636986136283185172') return 'This reward can only be claimed in the Clash & Harmony discord server!';
            if(await member.roles.cache.has(item.id)) return 'This user has this reward!';
            await member.roles.add(item.id,`Reward given by ${author.tag}.`);
            return `You gave the ${item.name} to ${member.user.tag}.`;
        } else if(category == 'services'){
            const LMO = await guild.client.users.fetch('186459664974741504');
            const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${member.user} (${member.user.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
            await LMO.send(embed);
            return `You gave the ${item.name} to ${member.user.tag}.`;
        } else {
            return `There was an error rewarding this item.`;
        };
    }
};