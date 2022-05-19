const { readJSON, writeJSON } = require("../json.js");
const Locale = require("../classes/locale.js");

module.exports = {
    name: "clanbattle-add-question",
    execute: async ({interaction, userdata}) => {
        let question = {
            title: interaction.fields.getTextInputValue("question-title"),
            answer: parseInt(interaction.fields.getTextInputValue("question-answer")),
            options: interaction.fields.getTextInputValue("question-options")
        };
        if(isNaN(question.answer)) return {content: Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_RESPONSE_INVALID_ANSWER_NUMBER"), ephemeral: true};
        question.answer -= 1;
        question.options = question.options.split("\n");
        if(1 > question.options.length > 11) return {content: Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_RESPONSE_INVALID_OPTIONS_AMOUNT")}
        if(!question.options[question.answer]) return {content: Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_RESPONSE_INVALID_ANSWER_NUMBER"), ephemeral: true};
        let json = readJSON('json/clanbattle.json');
        json.questions.push(question);
        writeJSON('json/clanbattle.json', json);
        return {content: Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_RESPONSE_SUCCESS", question.title)};
    }
}