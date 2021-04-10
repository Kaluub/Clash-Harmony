const Keyv = require('keyv');
const {readJSON} = require('../json.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'frame',
    aliases:['fr'],
    admin:false,
    hidden:true,
    desc:`This is a command for customizing your profile card's frame.`,
    usage:'!frame [owned frame]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let name = args.join(' ');
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let rewards = await readJSON('rewards.json');
        let frame = null;
        for(const i in rewards.rewards.frames){
            let f = rewards.rewards.frames[i];
            if(f.name.toLowerCase() == name.toLowerCase()){
                frame = f;
                break;
            };
        };
        if(!frame) return message.channel.send('There are no frames with this name.');
        if(!userdata.unlocked.frames.includes(frame.id)) return message.channel.send(`You don't own this frame. See \`!list frames\` for a list of owned frames.`);
        userdata.card.frame = frame.id;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        return message.channel.send(`Successfully set your active frame to ${frame.name}.`);
    }
};