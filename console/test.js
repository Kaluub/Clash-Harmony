const { UserData } = require('../classes/data.js');

module.exports = {
    name: 'test',
    usage: 'test',
    async execute({args}){
        let guildId = "807309287797686343";
        if(args[0]) guildId = args[0];
        let userdata = await UserData.get(guildId, "461564949768962048");
        userdata.dailyCooldown = "0/0/0"
        await UserData.set(guildId, "461564949768962048", userdata);
        return console.log("Reset daily cooldown for Kaluub (Debug)");
    }
};