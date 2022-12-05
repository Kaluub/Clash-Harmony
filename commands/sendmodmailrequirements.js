const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name: 'sendmodmail',
    desc: 'Text command for sending messages.',
    usage: '!send [channel ID] [message]',
    noInteraction: true,
    admin: true,
    execute: async ({message}) => {
        await message.channel.send(`CLASH & HARMONY CLAN MEMBERSHIP REQUIREMENTS
        Please note that the requirements which you'll see below are not final and might differ depending on the person, situation, and many other considered factors.
        
        \`\`\`
        - Must be up to actively engage with other clan members, both: in-game and on the clan's dedicated Discord server. If a clan member becomes inactive and won't resume their activity within a month — it may lead to a kick unless the proper reason got implied behind it. Notice: the player should notify and discuss the following with one of the clan's staff members (leader, co-leaders, elders) and resume their activity afterwards.
        
        - Must have mature behaviour while communicating with the other clan members and people outside of the clan, an honourable attitude, a sense of social etiquette and a respectable reputation within the community. Notice: any breach of the mentioned traits may result in a kick from the clan. Examples of preferred characteristics: honesty, loyalty, kindness, maturity, friendliness, etc. Examples of unpreferred ones: dishonesty, rudeness, immaturity, self-enclosure, unfriendliness. The aforementioned factors & characteristics are considered based on the clan's staff members point of view.
        
        - Must be well-informed about the Pixel Worlds game mechanics and have general knowledge about the game's history.
        
        - Must be willing to cooperate with fellow clan members in our in-game or otherwise activities.
        
        - Do not insist on asking about your clan membership. We, first of all, search for patient & loyal members.
        
        - If a member has in-game skills such as world-building, wiring, pixel-art creation and/or real-life skills such as drawing, it would be appreciated if the clan's staff got informed of it. We value our members' talents, and they might come in handy for us.
        \`\`\``);
        await message.channel.send(`\`\`\`- If a problem arises between two or more clan members — they have to handle it maturely and solve it privately in a healthy way within themselves only. If this won't be enough, then the problem may be referred to the clan's staff that might help with resolving it.

        - If you have any complaints regarding something ongoing in the clan/have any suggestions which you think could improve it, engage clan members together, or help boost the clan's progress — feel free to notify the clan's staff. You may also express your suggestions and keep them on display for fellow clan members to give their opinions about it in the dedicated channel #suggestions inside the clan's Discord server.\`\`\`
        
        
        If you have read the requirements, find yourself suitable enough and still want to join our clan, here is the process:
        Send your application using the below template as a direct message to Clash & Harmony bot → Click the ⏺️ button under the bot's reply → Choose either Harmony Application or Clash Application category by using the corresponding button under the bot's message → Confirm your message by using the ✅ button.
        We're looking forward to the future of the clans and new clan members & events to come.
        Sincerely,
        The Clash & Harmony Clans.`);
        await message.channel.send({content: `\`\`\`**Date**: YYYY-MM-DD
        **IGN**: Your in-game name.
        **Account age**: Your in-game account age.
        **Level**: Your in-game account XP level (and legacy level, if you have one).
        **Reason**: Reason is described here for why you want to join into the clan.
        **Reason(s) to invite you**: Reason for why we should invite you to the clan.
        **Free space**: Feel free to write anything from yourself in here.\`\`\``, components: [new MessageActionRow().addComponents(new MessageButton().setCustomId("modmail").setLabel("Write an application here!").setStyle("PRIMARY"))]});
    }
}