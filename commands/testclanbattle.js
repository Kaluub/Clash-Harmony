module.exports = {
    name: 'testclanbattle',
    aliases: ['tcb', 'duelclan'],
    desc: 'Is this even relevant anymore?',
    usage: '!tcb',
    admin: true,
    hidden: true,
    execute: async ({message}) => {
        if(!message) return 'How did you get here?';
        const cd =  require('../events/clanbattle.js');
        await cd.execute({channel: message.channel});
    }
};