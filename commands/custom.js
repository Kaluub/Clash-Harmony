const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const {readJSON} = require('../json.js');
const {guessRewards} = require('../functions.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    name:'custom',
    aliases:['c','use'],
    admin:false,
    desc:'This is a command for customizing your profile card.',
    usage:'!custom [reward name]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let name = args.join(' ');
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let rewards = await readJSON('rewards.json');

        // Guessing
        let possibleRewards = await guessRewards(rewards,name);

        if(possibleRewards.length == 0){
            return message.channel.send('There are no rewards with or similar to this name.');
        } else if(possibleRewards.length == 1){
            let category = possibleRewards[0].colour ? 'backgrounds' : 'frames';
            if(!userdata.unlocked[category].includes(possibleRewards[0].id)) return message.channel.send(`You don't own the ${category.slice(0,-1)} "${possibleRewards[0].name}". See \`!list ${category}\` for a list of owned ${category}.`);
            userdata.card[category.slice(0,-1)] = await possibleRewards[0].id;
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
            return message.channel.send(`Successfully set your active ${category.slice(0,-1)} to ${possibleRewards[0].name}.`);
        } else if(possibleRewards.length < 10){
            const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
            const embed = new MessageEmbed()
                .setTitle('Similar rewards:')
                .setColor('#AEC6CF')
                .setDescription('Loading...');
            const msg = await message.channel.send({embed:embed});
            embed.setDescription('A list of similar rewards is provided here.\nTo select one, react with the corresponding emoji.\n');
            for(const i in possibleRewards){
                let reward = possibleRewards[i];
                let index = possibleRewards.indexOf(reward);
                embed.setDescription(embed.description + `\n${emojis[index]}: ${reward.name}`);
                await msg.react(emojis[index]);
            };
            embed.setDescription(embed.description + `\n\n🗑️: Reset Card\n⛔: Cancel`);
            await msg.react('🗑️');
            await msg.react('⛔');
            await msg.edit({embed:embed});
            const collector = await msg.createReactionCollector((reaction, user) => user.id == message.author.id && emojis.includes(reaction.emoji.name) || reaction.emoji.name == '⛔' || reaction.emoji.name == '🗑️', {time:300000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == '🗑️'){
                    await message.delete().catch(null);
                    await msg.delete();
                    userdata.card.background = 'default_background';
                    userdata.card.frame = 'default_frame';
                    await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
                    message.channel.send(`Successfully reset your active frame and background.`);
                    return collector.stop('success');
                };
                if(reaction.emoji.name == '⛔'){
                    await message.delete().catch(null);
                    await msg.delete();
                    return collector.stop('success');
                };
                let index = emojis.indexOf(reaction.emoji.name);
                let reward = await possibleRewards[index];
                let category = reward.colour ? 'backgrounds' : 'frames';
                if(await userdata.unlocked[category].includes(reward.id)){
                    userdata.card[category.slice(0,-1)] = await possibleRewards[index].id;
                    await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
                    await msg.delete();
                    message.channel.send(`Successfully set your active ${category.slice(0,-1)} to ${await possibleRewards[index].name}.`);
                    return collector.stop('success');
                } else {
                    message.channel.send(`You don't own this reward!`);
                    await reaction.users.remove(user.id);
                };
            });
            collector.on('end', async (collected, reason) => {
                if(reason == 'success') return;
                try{
                    await msg.reactions.removeAll();
                } catch {
                    return null;
                }
            });
        } else {
            return message.channel.send(`There are too many items (${possibleRewards.length}) with a similar name! Consider being a little more specific.`);
        };
    }
};