const Discord = require('discord.js');
const Keyv = require('keyv');
const Data = require('./classes/data.js');
const {readJSON} = require('./json.js');
const {token} = readJSON('config.json');
const commands = require('./commands.js');

let maintenance = false;

const client = new Discord.Client({
    intents:[
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
    partials:[
        "CHANNEL",
        "REACTION"
    ],
    messageCacheLifetime:1800,
    messageSweepInterval:300,
    restTimeOffset:100
});

client.commands = commands.commands;

function completer(line){
    const completions = [];
    for(const [key,cmd] of commands.consoleCommands.entries()){
        if(!cmd) continue;
        completions.push(cmd.name);
    };
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
};

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    completer:completer
});

const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const guilddb = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

const statuses = [
    {name:'for !help',options:{type:'WATCHING'}},
    {name:'for !tutorial',options:{type:'WATCHING'}},
    {name:'DMs for Mod Mail.',options:{type:'LISTENING'}}
];
let statusNum = 0;
client.setInterval(function(){
    if(maintenance) return;
    client.user.setActivity(statuses[statusNum].name,statuses[statusNum].options);
    statusNum += 1;
    if(statusNum >= statuses.length) statusNum = 0;
},30000);

client.on('ready', async () => {
    await require('./commands/event.js').initEvents(client);
    process.title = "Clash & Harmony console";
    console.log("\x1b[34m\x1b[1m%s\x1b[0m",'Bot started successfully.');
    readline.prompt();
});

client.on('message', async (msg) => {
    if(msg.author.bot) return;

    const config = await readJSON('config.json');
    if(!msg.guild){ // Modmail
        let userdata = await userdb.get(`636986136283185172/${msg.author.id}`);
        if(userdata && userdata.blocked) return message.channel.send(`You've previously been blocked from using this system. Please directly DM a staff member to help you out.`);
        let dmEmbed = new Discord.MessageEmbed().setColor('#333333').setTitle('Clash & Harmony Mod Mail system:').setTimestamp();
        dmEmbed.setDescription(`Warning:
        Sending messages in DMs will send them to the staff of the Clash & Harmony Clans.
        Please do not abuse this system, you can be blocked from using it.\n
        To confirm this message, press the ✅ reaction.
        To add a category to your message, press ⏺️ the reaction.
        To cancel this message, press the ⛔ reaction.`);
        let category;
        const message = await msg.channel.send(dmEmbed);
        await message.react('✅');
        await message.react('⏺️');
        await message.react('⛔');

        const emojis = ['✅','⏺️','⛔'];
        const collector = message.createReactionCollector((reaction, user) => !user.bot && emojis.includes(reaction.emoji.name), {time: 300000});

        collector.on('collect', async (reaction) => {
            if(reaction.partial) await reaction.fetch();
            if(reaction.emoji.name == emojis[0]){
                const channel = await client.channels.fetch(config.modMailChannel);
                let embed = new Discord.MessageEmbed()
                    .setColor('#333333')
                    .setTitle(`Mod Mail`)
                    .setDescription(`New message from ${msg.author} (${msg.author.tag}):${category?`\nCategory: *${category}*`:''}\n\n${msg.content.length > 1900 ? msg.content.slice(0,1899) + `...` : msg.content}`)
                    .setTimestamp();
                if(msg.attachments.size) embed.setImage(msg.attachments.first().url);
                const file = Buffer.from(`This file is generated to allow for longer messages & ease of readability.\n\nMessage received:\n${msg.content}`, 'utf-8');
                const attachment = new Discord.MessageAttachment(file, `message.txt`);
                channel.send({embed:embed, files:[attachment]});
                msg.channel.send(`Your message has been sent to the staff of the Clash & Harmony Clans.\n**NOTE**: Even if you haven't received a message back, your message will be read!`);
                return collector.stop('sent');
            };

            if(reaction.emoji.name == emojis[1]){
                const categories = ['🟦','🟪','❓','❗','📝'];
                const rmsg = await message.channel.send('Please react to this message with one of the following:\n🟦: Harmony Application\n🟪: Clash Application\n❓: Question\n❗: Issue\n📝: Event Submission');
                await rmsg.react('🟦'); await rmsg.react('🟪'); await rmsg.react('❓'); await rmsg.react('❗'); await rmsg.react('📝');
                const rcol = rmsg.createReactionCollector((reaction, user) => !user.bot && categories.includes(reaction.emoji.name), {time: 10000});
                rcol.on('collect', async (r) => {
                    if(r.partial) await r.fetch();
                    if(r.emoji.name == '🟦') rcol.stop('Harmony Application');
                    if(r.emoji.name == '🟪') rcol.stop('Clash Application');
                    if(r.emoji.name == '❓') rcol.stop('Question');
                    if(r.emoji.name == '❗') rcol.stop('Issue');
                    if(r.emoji.name == '📝') rcol.stop('Event Submission');
                });
                rcol.on('end', (col, reason) => {
                    if(reason == 'time') return message.channel.send('Time expired for adding a category.');
                    category = reason;
                    return message.channel.send(`The category \`${category}\` has been added to your mail.`);
                });
            };

            if(reaction.emoji.name == emojis[2]){
                return collector.stop('cancelled');
            };
        });

        collector.on('end', async (collected, reason) => {
            if(reason == 'time' || reason == 'cancelled'){
                msg.channel.send('Your message will not be sent to the staff of the Clash & Harmony clans.\nIf this was a mistake, resend the message and press the :white_check_mark: reaction.');
                console.log("\x1b[33m%s\x1b[0m",`[DM] ${msg.author.tag}: ${msg.content}`);
                return readline.prompt();
            };
            return;
        });
        return;
    };

    let userdata = await userdb.get(`${msg.guild.id}/${msg.author.id}`);

    if(!userdata){ // Add new userdata if none found.
        await userdb.set(`${msg.guild.id}/${msg.author.id}`, new Data('user',{}));
        userdata = await userdb.get(`${msg.guild.id}/${msg.author.id}`);
    };

    if(userdata.version != Data.version){ // Update user data if outdated.
        userdata = await Data.updateData(userdata);
        await userdb.set(`${msg.guild.id}/${msg.author.id}`,userdata);
    };

    if(msg.content.startsWith(config.prefix)){ // Discord commands:
        const args = msg.content.slice(config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(!command) return;
        if((maintenance && command.name != 'maintenance'))
            if(maintenance && !config.admins.includes(msg.author.id)) return msg.channel.send('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.')
        if(command.admin && !config.admins.includes(msg.author.id)) return msg.channel.send('This command requires admin permission.');
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !admins.includes(msg.author.id))) return msg.channel.send(`This command needs a special feature available from the shop.`);
        userdata.statistics.commandsUsed += 1;
        await userdb.set(`${msg.guild.id}/${msg.author.id}`,userdata);
        try{
            await command.execute({message:msg,args:args}).then(async res => {
                if(res) await msg.channel.send(res);
            });
        } catch(error){
            console.error(error);
            return msg.channel.send('An error occured while running this command.');
        };
    };
});

client.on('interaction', async (interaction) => {
    if(interaction.isCommand()){
        let userdata = await userdb.get(`${interaction.guildID}/${interaction.user.id}`);
        if(!userdata){
            await userdb.set(`${interaction.guildID}/${interaction.user.id}`, new Data('user',{}));
            userdata = await userdb.get(`${interaction.guildID}/${interaction.user.id}`);
        };
        const command = commands.commands.get(interaction.commandName.toLowerCase()) || commands.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName.toLowerCase()));
        if(!command) return;
        const config = await readJSON('config.json');
        if((maintenance && command.name != 'maintenance'))
            if(maintenance && !config.admins.includes(interaction.user.id)) return interaction.reply('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.');
        if(command.admin && !config.admins.includes(interaction.user.id)) return interaction.reply('This command requires admin permission.');
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !admins.includes(interaction.user.id))) return interaction.reply(`This command needs a special feature available from the shop.`);
        if(!interaction.guild && !command.noGuild) return interaction.reply(`This command can not be used in DMs.`);
        let args = [];
        interaction.options.forEach((option) => args.push(option.value ? option.value.toString() : option));
        userdata.statistics.commandsUsed += 1;
        await userdb.set(`${interaction.guildID}/${interaction.user.id}`,userdata);
        try{
            await command.execute({interaction:interaction,args:args}).then(async res => {
                if(res && !interaction.replied) await interaction.reply(res);
                else if(!interaction.replied) interaction.reply(`No message was returned. This is probably a bug.`);
            });
        } catch(error){
            console.error(error);
            return interaction.reply('An error occured while running this command.', {ephemeral: true});
        };
    } else if(interaction.isMessageComponent() && interaction.isButton()){
        if(interaction.customID.startsWith('poll')){ // Poll event
            const parts = interaction.customID.split('-');
            let events = await guilddb.get(`${interaction.guildID}/Events`);
            for(let event of events){
                if(event.id == parts[2]){
                    const index = events.indexOf(event);
                    if(interaction.message.embeds[0].timestamp < Date.now || interaction.message.pinned){
                        const embed = new Discord.MessageEmbed()
                            .setTitle(`Poll results: ${event.name}`)
                            .setColor(`#AEC6CF`)
                            .setDescription(`Here are the results of the poll:\n`)
                        let n = 0;
                        event.voteCounts.forEach(num => {
                            embed.setDescription(embed.description + `\n${event.pollOptions[n]}: ${num} votes`);
                            n += 1;
                        });
                        return interaction.update({embeds:[embed], components:[]});
                    };
                    if(event.uniqueUserVotes.includes(interaction.user.id)) return interaction.reply({content: `You've already voted in this poll.`, ephemeral: true});
                    event.voteCounts[parts[1]] += 1;
                    event.uniqueUserVotes.push(interaction.user.id);
                    events[index] = event;
                    break;
                };
            };
            await guilddb.set(`${interaction.guildID}/Events`, events);
            return interaction.reply({content: `Vote submitted for option ${parts[1]}.`, ephemeral: true});
        };
    };
});

readline.on('line', async line => { // Console commands:
    const args = line.split(/ +/);
    const commandName = args.shift().toLowerCase();
    if(commandName == 'maintenance' || commandName == 'maint'){ // Maintenance. Needs to be in this file.
        maintenance = !maintenance;
        if(maintenance){
            client.user.setPresence({activity:{name:'maintenance on-going', type:'WATCHING'}, status:'idle'});
        } else {
            client.user.setPresence({activity:{name:'maintenance over', type:'PLAYING'}, status:'online'});
        };
        console.log("\x1b[32m%s\x1b[0m",`Successfully ${maintenance ? 'activated' : 'deactivated'} maintenance mode.`);
        return readline.prompt();
    };
    const command = commands.consoleCommands.get(commandName) || commands.consoleCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if(command){
        try {
            await command.execute(client,args,{commands:commands.consoleCommands,discordCommands:commands.commands,readline:readline});
        } catch(error) {
            console.error(error);
        };
    } else {
        console.log(`There is no command: ${commandName}`);
    };
    readline.prompt();
}).on('close', () => {
    console.log("\x1b[31m\x1b[1m%s\x1b[0m",'Shutting down ClashBot.');
    client.destroy();
    process.exit(0);
});

client.login(token);
// require('./interface/interface.js')(client); // Uncomment this line to run the web interface.
// require('./rpc.js')(); // Uncomment this line to run the RPC client.