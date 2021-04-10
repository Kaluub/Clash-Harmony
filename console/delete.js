const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'delete',
    usage:'delete [database entry]',
    async execute(client,args){
        if(!args[0]) return console.log("\x1b[32m%s\x1b[0m",'Usage: ' + this.usage);
        let deleted = await userdb.delete(args[0]);
        if(!deleted) return console.log("\x1b[32m%s\x1b[0m",`Could not delete the data under ${args[0]}.`);
        return console.log("\x1b[32m%s\x1b[0m",`Successfully deleted the data under ${args[0]}.`);
    }
};