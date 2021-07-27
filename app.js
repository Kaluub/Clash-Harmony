const Discord = require('discord.js');
const Keyv = require('keyv');
const Data = require('./data.js');
const {readJSON} = require('./json.js');
const {token} = readJSON('config.json');
const commands = require('./commands.js');

let maintenance = false;

const client = new Discord.Client({
    messageCacheLifetime:1800,
    messageSweepInterval:300,
    restTimeOffset:100
});

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

client.on('ready', () => {
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
            if(reaction.emoji.name == emojis[0]){
                const channel = await client.channels.fetch(config.modMailChannel);
                let embed = new Discord.MessageEmbed()
                    .setColor('#333333')
                    .setTitle(`Mod Mail`)
                    .setDescription(`New message from ${msg.author} (${msg.author.tag}):${category?`\nCategory: *${category}*`:''}\n\n${msg.content}`)
                    .setTimestamp();
                channel.send(embed);
                msg.channel.send(`Your message has been sent to the staff of the Clash & Harmony Clans.\n**NOTE**: Even if you haven't received a message back, your message will be read!`);
                return collector.stop('sent');
            };
            if(reaction.emoji.name == emojis[1]){
                const categories = ['🟦','🟪','❓','❗'];
                const rmsg = await message.channel.send('Please react to this message with one of the following:\n🟦: Harmony Application\n🟪: Clash Application\n❓: Question\n❗: Issue');
                await rmsg.react('🟦'); await rmsg.react('🟪'); await rmsg.react('❓'); await rmsg.react('❗');
                const rcol = rmsg.createReactionCollector((reaction, user) => !user.bot && categories.includes(reaction.emoji.name), {time: 10000});
                rcol.on('collect', (r) => {
                    if(r.emoji.name == '🟦') rcol.stop('Harmony Application');
                    if(r.emoji.name == '🟪') rcol.stop('Clash Application');
                    if(r.emoji.name == '❓') rcol.stop('Question');
                    if(r.emoji.name == '❗') rcol.stop('Issue');
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
        const command = commands.commands.get(commandName) || commands.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(!command) return;
        if((maintenance && command.name != 'maintenance'))
            if(maintenance && !config.admins.includes(msg.author.id)) return msg.channel.send('There is an on-going maintenance right now. Please wait until it is over to continue using the bot.')
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
        try{
            await command.execute(client,args,{commands:commands.consoleCommands,discordCommands:commands.commands,readline:readline});
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

client.login(token);
require('./interface/interface.js')(client);