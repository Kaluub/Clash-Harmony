module.exports = {
    name:'help',
    aliases:['?'],
    usage:'help [command]',
    async execute(client,args,ex){
        let msg;
        if(args[0]){
            const command = ex.commands.get(args[0]) || ex.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
            msg = `Help menu:\nName: ${command.name}\nUsage: ${command.usage}\nAliases: ${command.aliases.join('; ')}`;
        } else {
            msg = `List of commands:`;
            for(const [key,cmd] of ex.commands.entries()){
                if(!cmd) continue;
                msg = msg + `\n- ${cmd.name}`;
            };
        };
        return console.log("\x1b[32m%s\x1b[0m",msg);
    }
};