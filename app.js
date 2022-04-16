const Discord = require('discord.js');
const cron = require('node-cron');
const { UserData, GuildData } = require('./classes/data.js');
const UsageLogger = require('./classes/usageLogger.js');
const StatusLogger = require('./classes/statusLogger.js');
const { readJSON } = require('./json.js');
const { updateSuggestion } = require('./functions.js');
const { token } = readJSON('config.json');
const commands = require('./commands.js');
const modMail = require('./modmail.js');

let maintenance = false;

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS
    ],
    partials: [
        "CHANNEL",
        "REACTION"
    ],
    restTimeOffset: 100
});

client.commands = commands.commands;

function completer(line){
    const completions = [];
    for(const [key, cmd] of commands.consoleCommands.entries()){
        if(!cmd) continue;
        completions.push(cmd.name);
    };
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
};

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: completer
});

UsageLogger.init();
StatusLogger.init();

let statusNum = 0;
const statuses = [
    {name: 'for /help', options: {type: 'WATCHING'}},
    {name: 'for /tutorial', options: {type: 'WATCHING'}},
    {name: 'DMs for Mod Mail.', options: {type: 'LISTENING'}}
];

client.on('ready', async () => {
    //await require('./commands/event.js').initEvents(client);
    process.title = "Clash & Harmony console";
    console.log("\x1b[34m\x1b[1m%s\x1b[0m", 'Bot started successfully.');
    readline.prompt();
    StatusLogger.logStatus({type: "start", detail: "The bot was started"});

    setInterval(() => {
        if(maintenance) return;
        client.user.setActivity(statuses[statusNum].name,statuses[statusNum].options);
        statusNum += 1;
        if(statusNum >= statuses.length) statusNum = 0;
    }, 30000);

    for(const event of commands.events){
        cron.schedule(event.cronTime, async () => await event.execute({channel: client.channels.cache.get(event.channel)}), {timezone: "UTC"})
    };
});

client.on('messageCreate', async (msg) => {
    if(msg.author.bot) return;
    const config = await readJSON('config.json');

    if(!msg.guild) return await modMail(msg, config.modMailChannel);
    if(msg.content.startsWith(config.prefix)){ // Discord commands:
        const args = msg.content.slice(config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(!command) return;
        if(UserData.isLocked(msg.author.id) && !config.admins.includes(msg.author.id)) return msg.channel.send('Unable to use this command: Your data is locked, are you in a trade?');
        let userdata = await UserData.get(msg.guild.id, msg.author.id);
        if(userdata.blocked) return message.reply('You are blocked.');
        if(maintenance && !config.admins.includes(msg.author.id)) return msg.channel.send('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.');
        if(command.admin && !config.admins.includes(msg.author.id)) return msg.channel.send('This command requires admin permission.');
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !config.admins.includes(msg.author.id))) return msg.channel.send(`This command needs a special feature available from the shop.`);
        userdata.addStatistic('commandsUsed');
        await UserData.set(msg.guild.id, msg.author.id, userdata);
        UsageLogger.logAction({guildId: msg.guild.id, channelId: msg.channel.id, userId: msg.author.id, actionName: msg.content});
        try{
            await command.execute({message:msg, args, userdata}).then(async res => {
                if(res) await msg.channel.send(res);
                readline.prompt(true);
            });
        } catch(error){
            console.error(error);
            readline.prompt(true);
            StatusLogger.logStatus({type: "command-error", detail: error});
            return msg.channel.send('An error occured while running this command.');
        };
    };
});

client.on('interactionCreate', async (interaction) => {
    if(interaction.isCommand()){
        const config = await readJSON('config.json');
        let userdata = await UserData.get(interaction.guild?.id, interaction.user.id);
        if(userdata.blocked) return interaction.reply('You are blocked.');
        if(UserData.isLocked(interaction.user.id) && !config.admins.includes(interaction.user.id)) return interaction.reply({content: 'Unable to use this command: Your data is locked, are you in a trade?', ephemeral: true});
        const command = commands.commands.get(interaction.commandName.toLowerCase()) || commands.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName.toLowerCase()));
        if(!command) return interaction.reply('Command error: This command could not be handled as it does not exist.');
        if(maintenance && !config.admins.includes(interaction.user.id)) return interaction.reply('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.');
        if(command.admin && !config.admins.includes(interaction.user.id)) return interaction.reply('This command requires admin permission.');
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !config.admins.includes(interaction.user.id))) return interaction.reply(`This command needs a special feature available from the shop.`);
        if(!interaction.guild && !command.noGuild) return interaction.reply(`This command can not be used in DMs.`);
        let args = [];
        interaction?.options?.data.forEach((option) => args.push(option.value ? option.value.toString() : option));
        userdata.addStatistic('commandsUsed');
        if(userdata.settings.autoLocale) userdata.settings.locale = interaction.locale;
        await UserData.set(interaction.guildId, interaction.user.id, userdata);
        UsageLogger.logAction({guildId: interaction.guildId, channelId: interaction.channelId, userId: interaction.user.id, actionName: interaction.toString()});
        try{
            await command.execute({interaction, args, userdata}).then(async res => {
                if(res && interaction && !interaction.replied) await interaction.reply(res);
                else if(interaction && !interaction.replied) await interaction.reply(`No message was returned. This is probably a bug.`);
                readline.prompt(true);
            });
        } catch(error){
            console.error(error);
            readline.prompt(true);
            StatusLogger.logStatus({type: "command-error", detail: error});
        };
    } else if(interaction.isContextMenu()) {
        const config = await readJSON('config.json');
        let userdata = await UserData.get(interaction.guildId, interaction.user.id);
        if(UserData.isLocked(interaction.user.id) && !config.admins.includes(interaction.user.id)) return interaction.reply({content: 'Unable to use this command: Your data is locked, are you in a trade?', ephemeral: true});
        const command = commands.contexts.get(interaction.commandName) || commands.contexts.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));
        if(!command) return interaction.reply('Command error: This command could not be handled as it does not exist.');
        if(maintenance && !config.admins.includes(interaction.user.id)) return interaction.reply('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.');
        if(command.admin && !config.admins.includes(interaction.user.id)) return interaction.reply({content: 'This command requires admin permission.', ephemeral: true});
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !config.admins.includes(interaction.user.id))) return interaction.reply(`This command needs a special feature available from the shop.`);
        if(!interaction.guild && !command.noGuild) return interaction.reply(`This command can not be used in DMs.`);
        if(userdata.settings.autoLocale) userdata.settings.locale = interaction.locale;
        userdata.addStatistic('commandsUsed');
        await UserData.set(interaction.guildId, interaction.user.id, userdata);
        UsageLogger.logAction({guildId: interaction.guildId, channelId: interaction.channelId, userId: interaction.user.id, actionName: interaction.commandName});
        try {
            await command.execute({interaction, userdata}).then(async res => {
                if(res && !interaction.replied) await interaction.reply(res);
                else if(!interaction.replied) interaction.reply(`No message was returned. This is probably a bug.`);
                readline.prompt(true);
            });
        } catch(error){
            console.error(error);
            readline.prompt(true);
            StatusLogger.logStatus({type: "command-error", detail: error});
            if(interaction && !interaction.replied) return interaction.reply('An error occured while running this command.', {ephemeral: true});
        };
    } else if(interaction.isAutocomplete()) {
        const option = interaction.options.getFocused(true);
        const autocompleter = commands.autoCompletes.get(option.name);
        if(!autocompleter) return await interaction.respond([]);
        try {
            const res = await autocompleter.execute({interaction});
            if(res) await interaction.respond(res);
            else await interaction.respond([]);
        } catch(error){
            console.error(error);
            readline.prompt(true);
            StatusLogger.logStatus({type: "autocomplete-error", detail: error});
        };
    } else if(interaction.isMessageComponent() && interaction.isButton()){
        if(interaction.customId.startsWith('poll')){ // Poll event
            const parts = interaction.customId.split('-');
            let data = await GuildData.get(interaction.guildId);
            for(let event of data.events){
                if(event.id == parts[2]){
                    const index = data.events.indexOf(event);
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
                    data.events[index] = event;
                    break;
                };
            };
            await GuildData.set(interaction.guildId, data);
            return interaction.reply({content: `Vote submitted for option ${parts[1]}.`, ephemeral: true});
        } else if(interaction.customId.startsWith('suggestion')){ // Suggestion:
            const data = await GuildData.get(interaction.guildId);
            if(data.suggestions[interaction.message.id].voters.includes(interaction.user.id)) return interaction.reply({content: `You've already voted for this suggestion.`, ephemeral: true});
            const type = interaction.customId.split('-')[1];
            data.suggestions[interaction.message.id][type] += 1;
            data.suggestions[interaction.message.id].voters.push(interaction.user.id);
            await GuildData.set(interaction.guildId, data);
            await updateSuggestion(data.suggestions[interaction.message.id], interaction.message);
            await interaction.reply({content: 'Successfully voted!', ephemeral: true});
        };
    };
});

readline.on('line', async line => { // Console commands:
    const args = line.split(/ +/);
    const commandName = args.shift().toLowerCase();
    if(commandName == 'maintenance' || commandName == 'maint'){ // Maintenance. Needs to be in this file.
        maintenance = !maintenance;
        if(maintenance){
            StatusLogger.logStatus({type: "maintenance", detail: "The bot was put in maintenance."});
            client.user.setPresence({activity:{name:'maintenance on-going', type:'WATCHING'}, status:'idle'});
        } else {
            StatusLogger.logStatus({type: "maintenance", detail: "The bot was put off maintenance."});
            client.user.setPresence({activity:{name:'maintenance over', type:'PLAYING'}, status:'online'});
        };
        console.log("\x1b[32m%s\x1b[0m",`Successfully ${maintenance ? 'activated' : 'deactivated'} maintenance mode.`);
        return readline.prompt();
    };
    const command = commands.consoleCommands.get(commandName) || commands.consoleCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if(command){
        try {
            await command.execute({
                client,
                args,
                line,
                commands:commands.consoleCommands,
                discordCommands:commands.commands,
                readline:readline
            });
        } catch(error) {
            StatusLogger.logStatus({type: "console-error", detail: error});
            console.error(error);
        };
    } else {
        console.log(`There is no command: ${commandName}`);
    };
    readline.prompt();
}).on('close', () => {
    StatusLogger.logStatus({type: "shutdown", detail: "The bot was shut down"});
    console.log("\x1b[31m\x1b[1m%s\x1b[0m",'Shutting down ClashBot.');
    client.destroy();
    process.exit(0);
});

client.login(token);

// require('./interface/interface.js')(client); // Uncomment this line to run the web interface.
// require('./rpc.js')(); // Uncomment this line to run the RPC client.