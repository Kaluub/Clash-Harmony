const { MessageAttachment } = require('discord.js');

module.exports = {
    name: 'screwyoudiscord',
    aliases: ['syd'],
    desc: 'This is a command for displaying your profile card.',
    usage: '!screwyoudiscord',
    hidden: true,
    execute: async () => {
        const file1 = new MessageAttachment(`./img/frames/WinterFrame.png`);
        const file2 = new MessageAttachment(`./img/backgrounds/WinterBackground.png`);
        return {
            content: `It's really been a while, and it's a time for the third art contest to come!\n\nContest theme:\nThe Clash & Harmony bot's matching background & pack (e.g. Winter Frame & Winter Background, included below).\nThe frames are 300 by 300 pixels.\nThe backgrounds are 1000 pixels by 350 pixels (although Discord compresses it to 400 by 125).\n\nDeadline:\n2021/12/26 (YYYY-MM-DD; 26th December, 2021).\n\nTake your time and try the best of your abilities while creating the art! Don't forget to follow the contest rules for your submissions to be valid in the contest. There will be a 1st, 2nd, and 3rd places with the grand winner (1st place) earning a special prize presented by the Clash Clan staff!\n\nEveryone can submit their entries and vote by using the upvote/downvote reactions. The clan's staff (Leader, Co-Leaders & Elders) will later announce the winners! That's how we're going to select the winners for this contest.\n\nBest of luck,\nThe Clash Clan.`,
            files: [file1, file2]
        }
    }
}