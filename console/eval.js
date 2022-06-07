const Discord = require('discord.js');
const { UserData } = require('../classes/data.js');

module.exports = {
    name:'eval',
    usage:'eval [JS code]',
    async execute({args, client}){
        if(!args[0]) return console.log("\x1b[32m%s\x1b[0m",`Usage: ${this.usage}`);
        try {
            const code = args.join(" ");
            let evaled = eval(code);
            if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
            console.log(evaled);
        } catch(err) {
            console.log(`Error occurred during eval:\n${err}`);
        }
    }
}