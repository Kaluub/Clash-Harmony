const {loadImage, createCanvas} = require('canvas');
const {readdirSync} = require('fs');

module.exports = {
    name:'world',
    desc:`This is a command to convert any image to a world in Pixel Worlds.`,
    usage:'!world [url/attachment]',
    async execute({interaction, message, args}){
        return `Not ready.`;
        const BlockFiles = readdirSync(`./img/blocks`).filter(str => str.endsWith('.png'));
        const blocks = [];
        for(const file of BlockFiles){
            let object = {
                name: file.slice(0, -4).split(/(?=[A-Z])/).join(' '),
                image: null,
                dominantColor: null
            };
            object.image = await loadImage(`./img/blocks/${file}`);
            blocks.push(object);
        };
        console.log(blocks);
        console.log('done');
        return 'check the console';
    }
};