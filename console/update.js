module.exports = {
    name:'update',
    usage:'update [command name]',
    async execute({args}){
        if(!args[0]) return console.log("\x1b[32m%s\x1b[0m",`Usage: ${this.usage}`);
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
            return console.log("\x1b[32m%s\x1b[0m",`There was an error while reloading a command ${command.name}:\n${error.message}`);
        }
    }
};