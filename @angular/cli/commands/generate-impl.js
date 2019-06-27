"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematic_command_1 = require("../models/schematic-command");
const json_schema_1 = require("../utilities/json-schema");
class GenerateCommand extends schematic_command_1.SchematicCommand {
    async initialize(options) {
        // Fill up the schematics property of the command description.
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        this.collectionName = collectionName;
        this.schematicName = schematicName;
        await super.initialize(options);
        const collection = this.getCollection(collectionName);
        const subcommands = {};
        const schematicNames = schematicName ? [schematicName] : collection.listSchematicNames();
        // Sort as a courtesy for the user.
        schematicNames.sort();
        for (const name of schematicNames) {
            const schematic = this.getSchematic(collection, name, true);
            this.longSchematicName = schematic.description.name;
            let subcommand;
            if (schematic.description.schemaJson) {
                subcommand = await json_schema_1.parseJsonSchemaToSubCommandDescription(name, schematic.description.path, this._workflow.registry, schematic.description.schemaJson);
            }
            else {
                continue;
            }
            if (this.getDefaultSchematicCollection() == collectionName) {
                subcommands[name] = subcommand;
            }
            else {
                subcommands[`${collectionName}:${name}`] = subcommand;
            }
        }
        this.description.options.forEach(option => {
            if (option.name == 'schematic') {
                option.subcommands = subcommands;
            }
        });
    }
    async run(options) {
        if (!this.schematicName || !this.collectionName) {
            return this.printHelp(options);
        }
        return this.runSchematic({
            collectionName: this.collectionName,
            schematicName: this.schematicName,
            schematicOptions: options['--'] || [],
            debug: !!options.debug || false,
            dryRun: !!options.dryRun || false,
            force: !!options.force || false,
        });
    }
    async reportAnalytics(paths, options) {
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        if (!schematicName || !collectionName) {
            return;
        }
        const escapedSchematicName = (this.longSchematicName || schematicName).replace(/\//g, '_');
        return super.reportAnalytics(['generate', collectionName.replace(/\//g, '_'), escapedSchematicName], options);
    }
    parseSchematicInfo(options) {
        let collectionName = this.getDefaultSchematicCollection();
        let schematicName = options.schematic;
        if (schematicName) {
            if (schematicName.includes(':')) {
                [collectionName, schematicName] = schematicName.split(':', 2);
            }
        }
        return [collectionName, schematicName];
    }
    async printHelp(options) {
        await super.printHelp(options);
        this.logger.info('');
        // Find the generate subcommand.
        const subcommand = this.description.options.filter(x => x.subcommands)[0];
        if (Object.keys((subcommand && subcommand.subcommands) || {}).length == 1) {
            this.logger.info(`\nTo see help for a schematic run:`);
            this.logger.info(core_1.terminal.cyan(`  ng generate <schematic> --help`));
        }
        return 0;
    }
}
exports.GenerateCommand = GenerateCommand;
