const Data = require('../classes/data.js');

module.exports = {
    name:'fixrole',
    usage:'fixrole [guild id] [user id] [role id]',
    async execute({args}){
        if(!args[0] || !args[1] || !args[2]) return console.log("\x1b[32m%s\x1b[0m", 'Usage: ' + this.usage);
        let data = await Data.get(args[0], args[1]);
        data.unlocked.roles.push(args[2]);
        if(await Data.set(args[0], args[1], data)) console.log("\x1b[32m%s\x1b[0m", "Success!");
        else console.log("\x1b[32m%s\x1b[0m", "Failed.");
    }
};