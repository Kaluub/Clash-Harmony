module.exports = {
    name:'update',
    usage:'update [command name]',
    async execute({args}){
        if(!args[0]) {
            const {commands} = require('../commands.js');
            commands.forEach(command => {
                if(!command) return console.log("\x1b[32m%s\x1b[0m",`No command found.`);
                delete require.cache[require.resolve(`../commands/${command.name}.js`)];
                try {
                    const newCommand = require(`../commands/${command.name}.js`);
                    commands.set(newCommand.name, newCommand);
                    console.log("\x1b[32m%s\x1b[0m",`Successfully updated updated the command ${command.name}.`);
                } catch (error) {
                    console.error(error);
                    return console.log("\x1b[32m%s\x1b[0m",`There was an error while reloading a command ${command.name}:\n${error}`);
                };
            });
            return console.log("\x1b[32m%s\x1b[0m",`Successfully updated all commands.`);
        } else {
            if(args[0].includes('.js')){
                delete require.cache[require.resolve(`../${args[0]}`)];
                require(`../${args[0]}`);
                return console.log("\x1b[32m%s\x1b[0m",`Reloaded the file "${args[0]}". Note that there could be some issues!`);
            };
            const {commands} = require('../commands.js');
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if(!command) return console.log("\x1b[32m%s\x1b[0m",`No command found.`);
            delete require.cache[require.resolve(`../commands/${command.name}.js`)];
            try {
                const newCommand = require(`../commands/${command.name}.js`);
                commands.set(newCommand.name, newCommand);
                console.log("\x1b[32m%s\x1b[0m",`Successfully updated the command ${command.name}.`);
            } catch (error) {
                console.error(error);
                return console.log("\x1b[32m%s\x1b[0m",`There was an error while reloading a command ${command.name}:\n${error}`);
            };
        };
    }
};