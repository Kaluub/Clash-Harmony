const Locale = require("../classes/locale.js");

module.exports = {
    name: 'reloadlocale',
    usage: 'reloadlocale',
    async execute(){
        Locale.reloadLocale();
        console.log("Reloaded locale.")
    }
};