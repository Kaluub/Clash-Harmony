const { randInt } = require('../functions.js');
const { readdirSync } = require('fs');
const { readJSON } = require('../json.js');

class Locale {
    static texts = {};

    static reloadLocale() {
        const localeFiles = readdirSync("./locale").filter(file => file.endsWith('.json'));
        for(const localeFile of localeFiles){
            const locale = readJSON("./locale/" + localeFile);
            this.texts[localeFile.split(".")[0]] = locale
        };
    }

    /**
     * Used for text retrieving, supports multiple languages.
     * @param {string} locale The locale to use. The default is "en-GB", for English.
     * @param {string} key The key of the text to retrieve.
     * @param {...any} args Up to 4 arguments can be provided for the filler parameters, e.g.: {0}, {1}, {2}, {3}.
     * @returns {string} text
     */
    static text(locale, key, ...args) {
        let string = this.texts[locale]?.[key];
        if(!string) string = this.texts["en-GB"][key]; // Fallback to english, will return undefined if the key is invalid
        if(string instanceof Array) string = string[randInt(0, string.length)]; // If array, return random key
        
        string = string.replaceAll('{0}', args[0]);
        string = string.replaceAll('{1}', args[1]);
        string = string.replaceAll('{2}', args[2]);
        string = string.replaceAll('{3}', args[3]);
        
        return string;
    };
};

module.exports = Locale;