import { Alert } from 'react-native';
import ai from '../../public/HERODesigner/AI.json';
import aiSixth from '../../public/HERODesigner/AI6E.json';
import automaton from '../../public/HERODesigner/Automaton.json';
import automatonSixth from '../../public/HERODesigner/Automaton6E.json';
import computer from '../../public/HERODesigner/Computer.json';
import computerSixth from '../../public/HERODesigner/Computer6E.json';
import heroic from '../../public/HERODesigner/Heroic.json';
import heroicSixth from '../../public/HERODesigner/Heroic6E.json';
import main from '../../public/HERODesigner/Main.json';
import mainSixth from '../../public/HERODesigner/Main6E.json';
import normal from '../../public/HERODesigner/Normal.json';
import superheroic from '../../public/HERODesigner/Superheroic.json';
import superheroicSixth from '../../public/HERODesigner/Superheroic6E.json';
import { common } from './Common';

export const TYPE_CHARACTERISTIC = 1;

export const TYPE_MOVEMENT = 2;

export const GENERIC_OBJECT =  'GENERIC_OBJECT';

export const TYPE_ADVANTAGES = 0;

export const TYPE_LIMITATIONS = 1;

export const SKILL_ENHANCERS = [
    'SCIENTIST',
    'JACK_OF_ALL_TRADES',
    'LINGUIST',
    'SCHOLAR',
    'TRAVELER'
]

const MISSING_CHARACTERISTIC_DESCRIPTIONS = {
    "ocv": "Offensive Combat Value represents a character’s general accuracy in combat.",
    "dcv": "Defensive Combat Value represents how difficult it is to hit a character in combat.",
    "omcv": "Offensive Mental Combat Value represents a character’s general accuracy in Mental Combat.",
    "dmcv": "Defensive Mental Combat Value represents how difficult it is to hit a character in Mental Combat."
}

const CHARACTERISTIC_NAMES = {
    "str": "Strength",
    "dex": "Dexterity",
    "con": "Constitution",
    "int": "Intelligence",
    "ego": "Ego",
    "pre": "Presence",
    "com": "Comeliness",
    "ocv": "OCV",
    "dcv": "DCV",
    "omcv": "OMCV",
    "dmcv": "DMCV",
    "spd": "Speed",
    "pd": "PD",
    "ed": "ED",
    "rec": "Recovery",
    "end": "Endurance",
    "body": "Body",
    "stun": "Stun"
};

const BASE_MOVEMENT_MODES = {
    "running": "Running",
    "swimming": "Swimming",
    "leaping": "Leaping"
}

const SKILL_ROLL_BASE = 9;

const SKILL_FAMILIARITY_BASE = 8;

const SKILL_PROFICIENCY_BASE = 10;

class HeroDesignerCharacter {
    getCharacter(heroDesignerCharacter) {
        const template = this._getTemplate(heroDesignerCharacter.template);

        character =  {
            version: heroDesignerCharacter.version,
            template: template,
            characterInfo: heroDesignerCharacter.characterInfo,
            characteristics: [],
            movement: [],
            skills: [],
            perks: []
        };

        this._populateMovementAndCharacteristics(character, heroDesignerCharacter.characteristics, template);
        this._populateLists(character, 'skills');
        this._populateSkills(character, heroDesignerCharacter.skills, template);
//        this._populateLists(character, 'perks');
//        this._populatePerks(character, heroDesignerCharacter.perks, template);
//        this._populateTalents(character, heroDesignerCharacter.powers, template);
//        this._populateMartialArts(character, heroDesignerCharacter.powers, template);
//        this._populatePowers(character, heroDesignerCharacter.powers, template);
//        this._populateDisadvantages(character, heroDesignerCharacter.powers, template);
//        this._populateEquipment(character, heroDesignerCharacter.powers, template);

        return character;
    }

    _populateMovementAndCharacteristics(character, characteristics, template) {
        let templateCharacteristic = null;
        let formattedCharacteristic = null;
        let type = null;
        let name = null;
        let definition = null;
        let value = 0;
        let cost = 0;
        let roll = null;

        for (let [key, characteristic] of Object.entries(characteristics)) {
            type = CHARACTERISTIC_NAMES.hasOwnProperty(key.toLowerCase()) ? TYPE_CHARACTERISTIC : TYPE_MOVEMENT;
            templateCharacteristic = template.characteristics[key.toLowerCase()];
            name = type === TYPE_CHARACTERISTIC ? CHARACTERISTIC_NAMES[key.toLowerCase()] : BASE_MOVEMENT_MODES[key.toLowerCase()];
            definition = templateCharacteristic.definition;
            roll = null;

            if (templateCharacteristic.lvlval > 1) {
                value = characteristic.levels + templateCharacteristic.base;
                cost = Math.round((value - templateCharacteristic.base) / templateCharacteristic.lvlval);
            } else {
                value = characteristic.levels * templateCharacteristic.lvlval + templateCharacteristic.base;
                cost = templateCharacteristic.lvlcost * characteristic.levels
            }

            if (templateCharacteristic.base === 10 && name.toLowerCase() !== 'body') {
                roll = Math.round(value / 5) + SKILL_ROLL_BASE;
            }

            if (definition === null && Object.keys(MISSING_CHARACTERISTIC_DESCRIPTIONS).includes(key.toLowerCase())) {
                definition = MISSING_CHARACTERISTIC_DESCRIPTIONS[key.toLowerCase()];
            }

            formattedCharacteristic = {
                type: type,
                name: name,
                shortName: characteristic.alias,
                value: value,
                cost: cost,
                base: templateCharacteristic.base,
                definition: definition,
                roll: roll === null ? null : `${roll}-`,
                ncm: null
            };

            if (type === TYPE_MOVEMENT) {
                formattedCharacteristic.ncm = this._getCharacteristicNcm(templateCharacteristic);

                character.movement.push(formattedCharacteristic);
            } else {
                formattedCharacteristic.roll = roll === null ? null : `${roll}-`;

                character.characteristics.push(formattedCharacteristic);
            }
        }
    }

    _getCharacteristicNcm(templateCharacteristic) {
        if (Array.isArray(templateCharacteristic.adder)) {
            let adder = templateCharacteristic.adder.filter(adder => adder.xmlid === 'IMPROVEDNONCOMBAT')[0];

            return adder.lvlval * adder.lvlmultiplier;
        }

        return templateCharacteristic.adder.lvlval * templateCharacteristic.adder.lvlmultiplier
    }

    _populateLists(character, key) {
        if (character[key].hasOwnProperty('list')) {
            if (Array.isArray(character[key].list)) {
                for (let listEntry of character[key].list) {
                    character[key].push(this._createList(listEntry, key));
                }
            } else {
                character[key].push(this._createList(character[key].list, key));
            }
        }
    }

    _createList(item, key) {
        let listEntry = {
            type: GENERIC_OBJECT,
            xmlId: item.xmlid,
            id: item.id,
            alias: item.alias,
            name: item.name || '',
            position: item.position,
            notes: item.notes || '',
            modifier: item.modifier
        };

        listEntry[key] = [];

        return listEntry;
    }

    _getLists(data) {
        let lists = [];

        if (data.hasOwnProperty('list')) {
            if (typeof data.list === 'string') {
                lists.push(data.list);
            } else {
                lists = lists.concat(data.list);
            }
        }

        return lists;
    }

    _create

    _populateSkills(character, skills, template) {
        let characterSkill = null;
        let roll = null;
        let type = null;
        let templateSkill = null;

        skills.skill = skills.skill.concat(this._getLists(skills));

        for (let skillEnhancer of SKILL_ENHANCERS) {
            if (skills.hasOwnProperty(common.toCamelCase(skillEnhancer))) {
                skills.skill.push(skills[common.toCamelCase(skillEnhancer)]);
            }
        }

        skills.skill.sort((a, b) => a.position > b.position);

        for (let [key, skill] of Object.entries(skills.skill)) {
            if (skill.xmlid.toUpperCase() === GENERIC_OBJECT || SKILL_ENHANCERS.includes(skill.xmlid.toUpperCase())) {
                character.skills.push({
                    type: 'list',
                    xmlId: skill.xmlid,
                    id: skill.id,
                    alias: skill.alias,
                    name: skill.name || '',
                    position: skill.position,
                    notes: skill.notes,
                    skills: [],
                    modifier: skill.modifier
                });
                continue;
            }

            if (skill.proficiency) {
                roll = SKILL_PROFICIENCY_BASE;
            } else if (skill.familiarity || skill.everyman) {
                roll = SKILL_FAMILIARITY_BASE
            } else {
                templateSkill = template.skills.skill.filter(s => {
                    if (s.xmlid.toUpperCase() === GENERIC_OBJECT) {
                        return false;
                    }

                    return s.xmlid.toLowerCase() === skill.xmlid.toLowerCase();
                }).shift();

                roll = parseInt(character.characteristics.filter(c => c.shortName.toLowerCase() === skill.characteristic.toLowerCase()).shift().roll.slice(0, -1), 10);

                roll = `${roll + skill.levels}-`;
            }

            this._addModifierLevelCost(skill.modifier, template);

            skill.type = 'skill';
            skill.template = templateSkill;
            skill.roll = roll;

            if (skill.hasOwnProperty('parentid')) {
                character.skills.filter(s => s.id === skill.parentid).shift().skills.push(skill);
            } else {
                character.skills.push(skill);
            }
        }
    }

    _populatePerks(character, perks, template) {
        let characterPerk = null;

        perks.perk = perks.perk.concat(this._getLists(perks));
        perks.perk.sort((a, b) => a.position > b.position);

        for (let [key, perk] of Object.entries(perks.perk)) {
            if (perk.xmlid.toUpperCase() === GENERIC_OBJECT) {
                perk.type = 'list';

                character.perks.push(perk);

                continue;
            }

            templatePerk = template.perks.perk.filter(p => {
                if (p.xmlid.toUpperCase() === GENERIC_OBJECT) {
                    return false;
                }

                return p.xmlid.toLowerCase() === perk.xmlid.toLowerCase();
            }).shift();

            this._addModifierLevelCost(perk.modifier, template);

            characterPerk = {
                type: type,
                xmlId: perk.xmlid,
                id: perk.id,
                parentId: perk.parentid || undefined,
                alias: perk.alias,
                name: perk.name || '',
                input: perk.input || '',
                position: perk.position,
                notes: perk.notes,
                modifier: perk.modifier
            };

            this._addTemplateKeyValues(['definition', 'lvlcost', 'lvlval', 'multipliercost', 'multipliervalue']);

            if (perk.hasOwnProperty('parentid')) {
                character.perks.filter(p => p.id === perk.parentid).shift().perks.push(characterPerk);
            } else {
                character.perks.push(characterPerk);
            }
        }
    }

    _addTemplateKeyValues(names, item, templateItem) {
        for (let name of names) {
            if (templateItem.hasOwnProperty(name)) {
                item[name] = templateItem[name];
            }
        }
    }

    _addModifierLevelCost(modifier, template) {
        if (modifier === undefined || modifier === null) {
            return;
        }

        if (Array.isArray(modifier)) {
            for (let mod of modifier) {
                this._addModifierLevelCost(mod, template);
            }
        } else {
            for (let mod of template.modifiers.modifier) {
                if (mod.xmlid.toUpperCase() === modifier.xmlid.toUpperCase()) {
                    if (mod.hasOwnProperty('lvlcost')) {
                        modifier.lvlcost = mod.lvlcost;
                    }

                    break;
                }
            }
        }
    }

    _getTemplate(template) {
        let characterTemplate = null;

        if (typeof template === 'string') {
            let baseTemplate = template.endsWith('6E.hdt') ? mainSixth : main;
            let subTemplate = null;

            switch (template) {
                case 'builtIn.AI.hdt':
                    subTemplate = ai;
                    break;
                case 'builtIn.AI6E.hdt':
                    subTemplate = aiSixth;
                    break;
                case 'builtIn.Automaton.hdt':
                    subTemplate = automaton;
                    break;
                case 'builtIn.Automaton6E.hdt':
                    subTemplate = automatonSixth;
                    break;
                case 'builtIn.Computer.hdt':
                    subTemplate = computer;
                    break;
                case 'builtIn.Computer6E.hdt':
                    subTemplate = computerSixth;
                    break;
                case 'builtIn.Heroic.hdt':
                    subTemplate = heroic;
                    break;
                case 'builtIn.Heroic6E.hdt':
                    subTemplate = heroicSixth;
                    break;
                case 'builtIn.Normal.hdt':
                    subTemplate = normal;
                    break;
                case 'builtIn.Superheroic.hdt':
                    subTemplate = superheroic;
                    break;
                case 'builtIn.Superheroic6E.hdt':
                    subTemplate = superheroicSixth;
                    break;
                default:
                    // do nothing
            }

            return subTemplate === null ? baseTemplate : this._finalizeTemplate(baseTemplate, subTemplate);
        }

        common.toast('Custom templates are currently not supported');

        return null;
    }

    _finalizeTemplate(baseTemplate, subTemplate) {
        let finalTemplate = baseTemplate;

        if (subTemplate.characteristics !== null) {
            if (subTemplate.characteristics.remove) {
                if (Array.isArray(subTemplate.characteristics.remove)) {
                    for (let characteristic of subTemplate.characteristics.remove) {
                        delete finalTemplate.characteristics[characteristic];
                    }
                } else {
                    delete finalTemplate.characteristics[subTemplate.characteristics.remove];
                }
            }
        }

        this._normalizeData(finalTemplate.skills, 'skill');

        return finalTemplate;
    }

    _normalizeData(data, listKey) {
        let xmlid = null;
        let normalizedEntries = [];

        for (let [key, item] of Object.entries(data)) {
            if (!Array.isArray(data[key]) && !item.hasOwnProperty('xmlid')) {
                item.xmlid = common.toSnakeCase(key).toUpperCase();

                normalizedEntries.push(item);
            }
        }

        data[listKey] = data[listKey].concat(normalizedEntries);

        for (let toBeDeleted of normalizedEntries) {
            let key = common.toCamelCase(toBeDeleted.xmlid.toLowerCase());

            if (data.hasOwnProperty(key)) {
                delete data[key];
            }
        }
    }
}

export let heroDesignerCharacter = new HeroDesignerCharacter();
