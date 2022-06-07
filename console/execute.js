module.exports = {
    name:'execute',
    usage:'execute [options: -c={channel id} -m={message id} -cmd={command}]',
    async execute({client, line, discordCommands}){
        let args = line.split(' -');
        args.shift(); // 'execute'
        let channel = null;
        let message = null;
        let command = null;
        for(let a of args){
            const arg = a.split('=');
            if(arg[0] == 'cmd') command = arg[1];
            if(arg[0] == 'c') channel = await client.channels.fetch(arg[1]);
            if(arg[0] == 'm'){
                message = await channel?.messages.fetch(arg[1]);
                if(!message) continue;
                await message.guild.members.fetch(message.author.id);
            };
        };
        if(!channel || !message || !command) return console.log("\x1b[32m%s\x1b[0m",`Usage: ${this.usage}`);
        const eargs = command.split(/ +/);
        const ecommandName = eargs.shift().toLowerCase();
        const ecommand = discordCommands.get(ecommandName) || discordCommands.find(ecmd => ecmd.aliases && ecmd.aliases.includes(ecommandName));
        try {
            ecommand.execute({message, args: eargs}).then(async res => {
                if(res) await channel.send(res);
                return console.log("\x1b[32m%s\x1b[0m",`Result from execute where ${args.join('; ')}:\n${res}`);
            });
        } catch(error) {
            return console.log("\x1b[31m%s\x1b[0m",`Error:\n${error}`);
        };
    }
};