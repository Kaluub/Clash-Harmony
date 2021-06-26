const {MessageAttachment} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name:'test',
    desc:'A testing command.',
    usage:'!test',
    admin:true,
    async execute({message}){
        fetch('http://localhost:64/api/card/?guildID=636986136283185172&userID=186459664974741504')
        .then(res => res.buffer())
        .then(async buffer => {
            console.log(buffer)
            const att = new MessageAttachment(buffer);
            message.channel.send(att);
            return 'test';
        });
    }
};