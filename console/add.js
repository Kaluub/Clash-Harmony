module.exports = {
    name:'add',
    usage:'add [command file]',
    async execute({args}){
        if(!args[0]) return console.log("\x1b[32m%s\x1b[0m",`Usage: ${this.usage}`);
        const {commands} = require('../commands.js');
        const commandFile = args[0].toLowerCase();
        let command;
        try {
            command = require(`../commands/${commandFile}`);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",`There was an error while adding the command ${commandFile}.`);
        };
        if(!command || !command.name || !command.desc || !command.execute) return console.log("\x1b[32m%s\x1b[0m",`No command found.`);
        try {
            commands.set(command.name, command);
            console.log("\x1b[32m%s\x1b[0m",`Successfully added the file ${commandFile} to the usable commands.`);
        } catch (error) {
            console.error(error);
            console.log("\x1b[32m%s\x1b[0m",`There was an error while adding the command ${commandFile}:\n${error.message}`);
        }
    }
};