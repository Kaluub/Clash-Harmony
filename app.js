const Discord = require('discord.js');
const Keyv = require('keyv');
const Data = require('./classes/data.js');
const {readJSON} = require('./json.js');
const {updateSuggestion} = require('./functions.js');
const {token} = readJSON('config.json');
const commands = require('./commands.js');
const modMail = require('./modmail.js');

let maintenance = false;

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
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

const guilddb = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

let statusNum = 0;
const statuses = [
    {name:'for /help',options:{type:'WATCHING'}},
    {name:'for /tutorial',options:{type:'WATCHING'}},
    {name:'DMs for Mod Mail.',options:{type:'LISTENING'}}
];

client.on('ready', async () => {
    await require('./commands/event.js').initEvents(client);
    process.title = "Clash & Harmony console";
    console.log("\x1b[34m\x1b[1m%s\x1b[0m",'Bot started successfully.');
    readline.prompt();

    setInterval(function(){
        if(maintenance) return;
        client.user.setActivity(statuses[statusNum].name,statuses[statusNum].options);
        statusNum += 1;
        if(statusNum >= statuses.length) statusNum = 0;
    },30000);

    for(const event of commands.events){
        const now = new Date();
    };
});

client.on('messageCreate', async (msg) => {
    if(msg.author.bot) return;
    const config = await readJSON('config.json');

    if(!msg.guild) await modMail(msg, config.modMailChannel);
    else if(msg.content.startsWith(config.prefix)){ // Discord commands:
        const args = msg.content.slice(config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(!command) return;
        if(Data.isLocked(msg.author.id) && !config.admins.includes(msg.author.id)) return msg.channel.send('Unable to use this command: Your data is locked, are you in a trade?');
        let userdata = await Data.get(msg.guild.id, msg.author.id);
        if((maintenance && command.name != 'maintenance'))
            if(maintenance && !config.admins.includes(msg.author.id)) return msg.channel.send('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.')
        if(command.admin && !config.admins.includes(msg.author.id)) return msg.channel.send('This command requires admin permission.');
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !config.admins.includes(msg.author.id))) return msg.channel.send(`This command needs a special feature available from the shop.`);
        userdata.addStatistic('commandsUsed');
        await Data.set(msg.guild.id, msg.author.id, userdata);
        try{
            await command.execute({message:msg,args:args}).then(async res => {
                if(res) await msg.channel.send(res);
                readline.prompt(true);
            });
        } catch(error){
            console.error(error);
            readline.prompt(true);
            return msg.channel.send('An error occured while running this command.');
        };
    };
});

client.on('interactionCreate', async (interaction) => {
    if(interaction.isCommand()){
        const config = await readJSON('config.json');
        let userdata = await Data.get(interaction.guildId, interaction.user.id);
        if(!userdata && !config.admins.includes(interaction.user.id)) return interaction.reply({content: 'Unable to use this command: Your data is locked, are you in a trade?', ephemeral: true});
        const command = commands.commands.get(interaction.commandName.toLowerCase()) || commands.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName.toLowerCase()));
        if(!command) return interaction.reply('Command error: This command could not be handled as it does not exist.');
        if((maintenance && command.name != 'maintenance'))
            if(maintenance && !config.admins.includes(interaction.user.id)) return interaction.reply('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.');
        if(command.admin && !config.admins.includes(interaction.user.id)) return interaction.reply('This command requires admin permission.');
        if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !config.admins.includes(interaction.user.id))) return interaction.reply(`This command needs a special feature available from the shop.`);
        if(!interaction.guild && !command.noGuild) return interaction.reply(`This command can not be used in DMs.`);
        let args = [];
        interaction?.options?.data.forEach((option) => args.push(option.value ? option.value.toString() : option));
        userdata.addStatistic('commandsUsed');
        await Data.set(interaction.guildId, interaction.user.id, userdata);
        try{
            await command.execute({interaction:interaction,args:args}).then(async res => {
                if(res && !interaction.replied) await interaction.reply(res);
                else if(!interaction.replied) interaction.reply(`No message was returned. This is probably a bug.`);
                readline.prompt(true);
            });
        } catch(error){
            console.error(error);
            readline.prompt(true);
            return interaction.reply('An error occured while running this command.', {ephemeral: true});
        };
    } else if(interaction.isMessageComponent() && interaction.isButton()){
        if(interaction.customId.startsWith('poll')){ // Poll event
            const parts = interaction.customId.split('-');
            let events = await guilddb.get(`${interaction.guildId}/Events`);
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
            await guilddb.set(`${interaction.guildId}/Events`, events);
            return interaction.reply({content: `Vote submitted for option ${parts[1]}.`, ephemeral: true});
        } else if(interaction.customId.startsWith('suggestion')){ // Suggestion:
            const data = await guilddb.get(`${interaction.guild.id}/Suggestions/${interaction.message.id}`);
            if(data.voters.includes(interaction.user.id)) return interaction.reply({content: `You've already voted for this suggestion.`, ephemeral: true});
            const type = interaction.customId.split('-')[1];
            data[type] += 1;
            data.voters.push(interaction.user.id);
            await guilddb.set(`${interaction.guild.id}/Suggestions/${interaction.message.id}`, data);
            await updateSuggestion(data, interaction.message);
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
            await command.execute({
                client,
                args,
                line,
                commands:commands.consoleCommands,
                discordCommands:commands.commands,
                readline:readline
            });
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