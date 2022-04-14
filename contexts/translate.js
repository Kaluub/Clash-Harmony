const translate = require("@vitalets/google-translate-api");
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'Translate to English',
    type: 'MESSAGE',
    execute: async ({interaction, userdata}) => {
        const res = await translate(interaction.targetMessage.content, {to: "en"});
        if(res) {
            return {
                content: Locale.text(userdata.settings.locale, "TRANSLATE_TRANSLATED", interaction.targetMessage.author.tag, res.from.language.iso, res.text),
                ephemeral: true
            };
        } else return {content: Locale.text(userdata.settings.locale, "TRANSLATE_FAILED"), ephemeral: true};
    }
};