module.exports = {
    name:'help',
    aliases:['?'],
    usage:'help [command]',
    async execute({args, commands}){
        let msg;
        if(args[0]){
            const command = commands.get(args[0]) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
            if(!command) return console.log("\x1b[32m%s\x1b[0m", 'No command found!');
            msg = `Help menu:\nName: ${command.name}\nUsage: ${command.usage}\nAliases: ${command.aliases.join('; ')}`;
        } else {
            msg = `List of commands:`;
            for(const [key,cmd] of commands.entries()){
                if(!cmd) continue;
                msg = msg + `\n- ${cmd.name}`;
            };
        };
        return console.log("\x1b[32m%s\x1b[0m",msg);
    }
};