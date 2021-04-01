const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'status',
    aliases:['st'],
    admin:false,
    desc:'This command is used to set your custom status.',
    usage:'!status [text (60 character limit)]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let status = args.join(' ');
        if(status.length > 60) return message.channel.send('Usage: ' + this.usage);
        userdata.status = status;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        return message.channel.send('Your status (!profile) was set to: ' + status);
    }
};