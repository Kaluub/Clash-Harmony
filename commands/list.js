const Keyv = require('keyv');
const {readJSON} = require('../json.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const {MessageEmbed} = require('discord.js');

module.exports = {
    name:'list',
    aliases:['fr'],
    admin:false,
    desc:`This is a command for viewing your owned frames and backgrounds.`,
    usage:'!list [frames/backgrounds]',
    async execute(message,args){
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let rewards = await readJSON('rewards.json');
        if(args[0]){
            const fText = ['frames','frame','f','fr'];
            if(fText.includes(args[0].toLowerCase())){
                let embed = new MessageEmbed()
                    .setTitle('Owned frames:')
                    .setColor('#838383')
                    .setDescription('')
                    .setFooter(Math.random() >= 0.5? 'TIP: To set a frame, use !frame [frame name].' : 'TIP: You can purchase more frames using !shop.')
                for(const i in userdata.unlocked.frames){
                    let id = userdata.unlocked.frames[i]
                    let frame = rewards.rewards.frames[id];
                    embed.setDescription(embed.description + `\n• ${frame.name}`);
                };
                return message.channel.send(embed);
            };
    
            const bText = ['backgrounds','background','b','bg','bgs','backg'];
            if(bText.includes(args[0].toLowerCase())){
                let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
                let rewards = await readJSON('rewards.json');
                let embed = new MessageEmbed()
                    .setTitle('Owned backgrounds:')
                    .setColor('#838383')
                    .setDescription('')
                    .setFooter(Math.random() >= 0.5? 'TIP: To set a background, use !background [background name].' : 'TIP: You can purchase more frames using !shop.')
                for(const i in userdata.unlocked.backgrounds){
                    let id = userdata.unlocked.backgrounds[i]
                    let background = rewards.rewards.backgrounds[id];
                    embed.setDescription(embed.description + `\n• ${background.name}`);
                };
                return message.channel.send(embed);
            };
        };

        const emojis = ['💠','🌐'];
        let embed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle(`Owned rewards:`)
            .setDescription(`To select a category, react with the emojis provided.\n\nLegend:\n${emojis[0]} • Backgrounds\n${emojis[1]} • Frames`)
            .setFooter(`This message expires at:`)
            .setTimestamp(Date.now() + 300000);
        const msg = await message.channel.send({embed:embed});
        await msg.react(emojis[0]); await msg.react(emojis[1]);

        let collector = msg.createReactionCollector((reaction, user) => !user.bot && user.id == message.author.id && emojis.includes(reaction.emoji.name), {time:300000});
        collector.on('collect', async (reaction,user) => {
            if(reaction.emoji.name == emojis[0]){ // Backgrounds:
                embed.setDescription('**Backgrounds**:\n');
                for(const i in userdata.unlocked.backgrounds){
                    let id = userdata.unlocked.backgrounds[i]
                    let background = rewards.rewards.backgrounds[id];
                    embed.setDescription(embed.description + `\n• ${background.name}`);
                };
            };

            if(reaction.emoji.name == emojis[1]){ // Frames:
                embed.setDescription('**Frames**:\n');
                for(const i in userdata.unlocked.frames){
                    let id = userdata.unlocked.frames[i]
                    let frame = rewards.rewards.frames[id];
                    embed.setDescription(embed.description + `\n• ${frame.name}`);
                };
            };

            embed.setDescription(embed.description + '\n\nTo select a frame or background, use `!custom [reward name]`.');
            await reaction.users.remove(user);
            await msg.edit({embed:embed});
        });
        collector.on('end', async (collected, reason) => {
            try {
                await msg.reactions.removeAll();
            } catch {
                return;
            }
        });
    }
};