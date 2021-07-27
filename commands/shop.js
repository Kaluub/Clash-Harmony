const {readJSON} = require('../json.js');
const {MessageEmbed} = require('discord.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'shop',
    aliases:['s'],
    admin:false,
    desc:'This is a command for displaying the shop.',
    usage:'!shop',
    async execute(message,args){
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let shop = await readJSON('rewards.json');

        const emojis = ['💠','🌐','🔒'/*,'📝'*/];
        let embed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle(`Shop Interface (${message.author.tag}):`)
            .setDescription(`You have ${userdata.points} points right now.\nTo select a category, react with the emojis provided.\n\nLegend:\n${emojis[0]} • Backgrounds\n${emojis[1]} • Frames\n${emojis[2]} • Roles`/*\n${emojis[3]} • Services`*/)
            .setFooter(`This message expires at:`)
            .setTimestamp(Date.now() + 300000);
        const msg = await message.channel.send({embed:embed});
        await msg.react(emojis[0]); await msg.react(emojis[1]); await msg.react(emojis[2]); //await msg.react(emojis[3]);

        let collector = msg.createReactionCollector((reaction, user) => !user.bot && user.id == message.author.id && emojis.includes(reaction.emoji.name), {time:300000});
        collector.on('collect', async (reaction,user) => {
            if(reaction.emoji.name == emojis[0]){ // Backgrounds:
                embed.setDescription('**Backgrounds**:');
                for(const i in shop.rewards.backgrounds){
                    let background = shop.rewards.backgrounds[i];
                    if(!background.shown || !background.name) continue;
                    if(background.endTime && background.endTime < Date.now()) continue;
                    if(background.startTime && background.startTime > Date.now()) continue;
                    if(userdata.unlocked.backgrounds.includes(background.id)) continue;
                    if(args.length && !background.name.includes(args.join())) continue;
                    embed.setDescription(embed.description + `\n\n${background.endTime?':regional_indicator_l:: ':''}${background.name} (${background.price} points)`);
                };
            };

            if(reaction.emoji.name == emojis[1]){ // Frames:
                embed.setDescription('**Frames**:');
                for(const i in shop.rewards.frames){
                    let frame = shop.rewards.frames[i];
                    if(!frame.shown || !frame.name) continue;
                    if(frame.endTime && frame.endTime < Date.now()) continue;
                    if(frame.startTime && frame.startTime > Date.now()) continue;
                    if(userdata.unlocked.frames.includes(frame.id)) continue;
                    if(args.length && !frame.name.includes(args.join())) continue;
                    embed.setDescription(embed.description + `\n\n${frame.endTime?':regional_indicator_l:: ':''}${frame.name} (${frame.price} points)`);
                };
            };

            if(reaction.emoji.name == emojis[2]){ // Roles:
                embed.setDescription('**Roles**:');
                for(const i in shop.rewards.roles){
                    let role = shop.rewards.roles[i];
                    if(!role.shown || !role.name) continue;
                    if(role.endTime && role.endTime < Date.now()) continue;
                    if(role.startTime && role.startTime > Date.now()) continue;
                    if(message.member.roles.cache.has(role.id)) continue;
                    if(args.length && !role.name.includes(args.join())) continue;
                    embed.setDescription(embed.description + `\n\n${role.endTime?':regional_indicator_l:: ':''}${role.name} (${role.price} points)`);
                };
            };

            /*if(reaction.emoji.name == emojis[3]){ // Services:
                embed.setDescription('**Services**:\n');
                for(const i in shop.rewards.services){
                    let service = shop.rewards.services[i];
                    if(!service.shown || !service.name) continue;
                    if(service.endTime && service.endTime < Date.now()) continue;
                    embed.setDescription(embed.description + `\n${service.name} (${service.price} points)`);
                };
            };*/

            embed.setDescription(embed.description + `\n\n${args.length ? `Filtered by text: \`${args.join()}\`\n` : ''}To buy a reward, use \`!buy [reward name]\`.`);
            await reaction.users.remove(user);
            await msg.edit({embed:embed});
        });
        collector.on('end', async (collected, reason) => {
            if(!msg.deleted) await msg.reactions.removeAll();
        });
    }
};