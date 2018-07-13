#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wk_argv_parser_1 = require("wk-argv-parser");
const context_1 = require("../context");
const string_1 = require("lol/utils/string");
const c = new context_1.Context('wk');
const wk = c.api();
const command = wk_argv_parser_1.Parser
    .command('wk')
    .boolean('tasks', false)
    .alias('tasks', ['T'])
    .string('file')
    .help();
const params = command.parse(process.argv.slice(2)).result.params;
// Help
if (params.help) {
    const packageJSON = require(process.cwd() + '/package.json');
    console.log(`wk v${packageJSON.version}` + command.get('help').description);
}
else if (!!params.file) {
    if (Array.isArray(params.file)) {
        params.file.forEach((file) => wk.load(file));
    }
    else if (typeof params.file === 'string') {
        wk.load(params.file);
    }
}
else if (params.tasks) {
    (function () {
        let length = 0;
        const tasks = wk.infos('tasks')
            .map((name) => {
            const task = c.defaultNamespace.resolveTask(name);
            if (task) {
                length = Math.max(length, name.length);
                return {
                    name: name,
                    description: task.options.description
                };
            }
        })
            .filter(task => !!task)
            .map((task) => {
            return string_1.pad(task.name, length + 5, ' ', false) + '# ' + task.description;
        });
        console.log(tasks.join('\n'));
    })();
}
else {
    wk.serie(...params._.map(function (task) {
        let argv = process.argv.slice(2);
        argv = argv.slice(argv.indexOf(task));
        return argv.join(' ');
    }));
}
