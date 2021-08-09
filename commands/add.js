const {MessageEmbed} = require('discord.js');
const Data = require('../classes/data.js');
const {readJSON} = require('../json.js');

module.exports = {
    name:'add',
    admin:true,
    desc:'This command is used to add rewards directly to users from the shop.',
    usage:'/add [@user] [reward name]',
    execute: async ({interaction,message,args}) => {
        if(!args[0] || !args[1]) return `Usage: ${module.exports.usage}`;
        let member = message?.mentions.members.first() ?? interaction?.options.getMember('user');
        const guild = interaction?.guild ?? message?.guild;
        const author = interaction?.user ?? message?.author;
        if(!member && message){
            try {
                member = await message.guild.members.fetch(args[0]);
                if(!member) return 'Invalid guild member.';
            } catch {
                return `Usage: ${module.exports.usage}`;
            };
        } else if(!member) return `Invalid interaction received.`;
        if(member.user.bot) return `You can't add rewards to a bot.`;

        let userdata = await Data.get(guild.id, member.user.id);
        let rewards = await readJSON('json/rewards.json');

        args.shift();
        let itemname = args.join(' ');
        let item = null;
        for(const ii in rewards){
            const i = rewards[ii];
            if(i.name.toLowerCase() == itemname.toLowerCase()){
                item = i;
                break;
            };
        };

        if(!item) return `No reward found with the name \`${itemname}\`.`;

        if(item.type == 'frames' || item.type == 'backgrounds'){
            if(userdata.hasReward(item)) return 'This user has this reward.';
            userdata.addReward(item);
            await Data.set(guild.id, member.user.id, userdata);
            return `You gave the ${item.name} to ${member.user.tag}.`;
        } else if(item.type == 'roles'){
            if(guild.id != '636986136283185172') return 'This reward can only be claimed in the Clash & Harmony discord server!';
            if(await member.roles.cache.has(item.id)) return 'This user has this reward!';
            userdata.unlocked[item.type].push(item.id);
            await Data.set(guild.id, member.user.id, userdata);
            await member.roles.add(item.id, `Reward given by ${author.tag}.`);
            return `You gave the ${item.name} to ${member.user.tag}.`;
        } else if(item.type == 'services'){
            const LMO = await guild.client.users.fetch('186459664974741504');
            const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${member.user} (${member.user.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
            await LMO.send({embeds:[embed]});
            return `You gave the ${item.name} to ${member.user.tag}.`;
        } else {
            return `There was an error rewarding this item.`;
        };
    }
};