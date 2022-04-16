const { readFileSync, writeFileSync } = require('fs');

function readJSON(path){
    let rawJson = readFileSync(`./${path}`);
    return JSON.parse(rawJson);
};

function writeJSON(path,json){
    let data = JSON.stringify(json, null, 4);
    writeFileSync(`./${path}`, data);
    return true;
};

module.exports = { readJSON, writeJSON };