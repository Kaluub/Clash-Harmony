const Discord = require('discord.js');
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout});
const Keyv = require('keyv');
const Data = require('./data.js');
const {readJSON} = require('./json.js');
const token = readJSON('config.json');
const client = new Discord.Client();
const commands = require('./commands.js');

const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

client.on('ready', () => {
    client.user.setActivity('for !help.', {type:'WATCHING'});
    console.log("\x1b[34m\x1b[1m%s\x1b[0m",'Bot started successfully.');
    readline.prompt();
});

client.on('message', async (msg) => {
    if(msg.author.bot) return;

    if(!msg.guild){
        let dmEmbed = new Discord.MessageEmbed().setColor('#333333').setTitle('ClashBot Mod Mail system:').setTimestamp();
        dmEmbed.setDescription(`Warning:
        Sending messages in DMs will send them to the staff of the Clash Clan.
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
        const collector = message.createReactionCollector((reaction, user) => emojis.includes(reaction.emoji.name), {time: 10000});

        collector.on('collect', async () => {
            if(reaction.emoji.name == emojis[0]){
                const channel = await client.channels.fetch('826926909077192734');
                let embed = new Discord.MessageEmbed()
                    .setColor('#333333')
                    .setTitle(`Mod Mail`)
                    .setDescription(`New message from ${msg.author} (${msg.author.tag}):${category?`Category: ${category}\n`:''}\n\n${msg.content}`)
                    .setTimestamp();
                channel.send(embed);
                msg.channel.send(`Your message has been sent to the staff of the Clash Clan.\n**NOTE**: Even if you haven't received a message back, your message will be read!`);
                return collector.stop('sent');
            };
            if(reaction.emoji.name == emojis[1]){
                collector.resetTimer({time:100000});
                const categories = ['Harmony application','Clash application','Question','Issue'];
                message.channel.send('Please type one of the following categories to add to your message:\n`Harmony application`; `Clash application`; `Question`; `Issue`');
                let msgCollector = message.channel.createMessageCollector()
                return;
            };
            if(reaction.emoji.name == emojis[2]){
                return collector.stop('cancelled');
            };
        });

        collector.on('end', async (collected, reason) => {
            console.log(reason)
            if(reason == 'time' || reason == 'cancelled'){
                msg.channel.send('Your message will not be sent to the staff of the Clash Clan.\nIf this was a mistake, resend the message and press the :white_check_mark: reaction.');
                console.log("\x1b[33m%s\x1b[0m",`[DM] ${msg.author.tag}: ${msg.content}`);
                return readline.prompt();
            };
            return;
        });

        return;
    };

    let userdata = await userdb.get(`${msg.guild.id}/${msg.author.id}`);
    if(!userdata){
        await userdb.set(`${msg.guild.id}/${msg.author.id}`,new Data('user',{}));
        userdata = await userdb.get(`${msg.guild.id}/${msg.author.id}`);
    };

    const config = await readJSON('config.json');
    if(msg.content.startsWith(config.prefix)){
        const args = msg.content.slice(config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.commands.get(commandName) || commands.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(!command) return;
        if(command.admin && !config.admins.includes(msg.author.id)) return msg.channel.send('This command requires admin permission.');
        userdata.statistics.commandsUsed += 1;
        await userdb.set(`${msg.guild.id}/${msg.author.id}`,userdata);
        try{
            command.execute(msg,args,{commands:commands.commands});
        } catch(error){
            console.error(error);
            return msg.channel.send('An error occured while running this command.');
        };
    };
});

readline.on('line', async line => {
    const args = line.split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.consoleCommands.get(commandName) || commands.consoleCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if(command){
        try{
            await command.execute(client,args,{commands:commands.consoleCommands,readline:readline});
        } catch(error){
            console.error(error);
        };
    } else {
        console.log(`There is no command: ${commandName}`);
    };
    readline.prompt();
}).on('close', () => {
    console.log("\x1b[31m\x1b[1m%s\x1b[0m",'Shutting down ClashBot.');
    process.exit(0);
});

client.login(token.token);