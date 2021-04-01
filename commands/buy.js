const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'buy',
    aliases:['b'],
    admin:false,
    desc:'This command is used to purchase rewards from the shop.',
    usage:'!buy [item name]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
    }
};