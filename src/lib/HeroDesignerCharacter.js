import { Alert } from 'react-native';
import { connect } from 'react-redux';
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
import RNFetchBlob from 'rn-fetch-blob'
import { common } from './Common';
import { SKILL_ROLL_BASE } from '../decorators/skills/Roll';
import { store } from '../../App';

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
    'TRAVELER',
    'WELL_CONNECTED'
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

const CHARACTER_TRAITS = {
    "skills": "skill",
    "perks": "perk",
    "talents": "talent",
    "martialArts": "maneuver",
    "powers": "power"
};

class HeroDesignerCharacter {
    getCharacter(heroDesignerCharacter) {
//        RNFetchBlob.fs.writeFile(RNFetchBlob.fs.dirs.DownloadDir + '/hdChar.json', JSON.stringify(heroDesignerCharacter));
        const template = this._getTemplate(heroDesignerCharacter.template);

        let character = {
            version: heroDesignerCharacter.version,
            characterInfo: heroDesignerCharacter.characterInfo,
            characteristics: [],
            movement: [],
            skills: [],
            perks: [],
            talents: [],
            martialArts: [],
            powers: [],
            disadvantages: []
        };

        this._normalizeCharacterData(heroDesignerCharacter);
        this._normalizeTemplateData(template);

        this._populateMovementAndCharacteristics(character, heroDesignerCharacter.characteristics, template);
        this._populateTrait(character, template, heroDesignerCharacter.skills, 'skills', 'skill', 'skills');
        this._populateTrait(character, template, heroDesignerCharacter.perks, 'perks', 'perk', 'perks');
        this._populateTrait(character, template, heroDesignerCharacter.talents, 'talents', 'talent', 'talents');
        this._populateTrait(character, template, heroDesignerCharacter.martialarts, 'martialArts', 'maneuver', 'maneuver');
        this._populateTrait(character, template, heroDesignerCharacter.powers, 'powers', 'power', 'powers');
        this._populateTrait(character, template, heroDesignerCharacter.disadvantages, 'disadvantages', 'disad', 'disad');
//        this._populateTrait(character, template, heroDesignerCharacter.martialarts, 'martialArts', 'maneuver', 'maneuvers');

//        RNFetchBlob.fs.writeFile(RNFetchBlob.fs.dirs.DownloadDir + '/test.json', JSON.stringify(character));
//        RNFetchBlob.fs.writeFile(RNFetchBlob.fs.dirs.DownloadDir + '/template.json', JSON.stringify(template));

        return character;
    }

    isCharacteristic(item) {
        return Object.keys(CHARACTERISTIC_NAMES).includes(item.xmlid.toLowerCase());
    }

    isMultipowerItem(item, character) {
        if (item.hasOwnProperty('parentid') && character.powers.length > 0) {
            let powersMap = common.toMap(character.powers, 'id');

            if (powersMap.has(item.parentid)) {
                return powersMap.get(item.parentid).originalType === 'multipower';
            }
        }

        return false;
    }

    getCharacteristicFullName(abbreviation) {
        abbreviation = abbreviation.toLowerCase();

        return CHARACTERISTIC_NAMES.hasOwnProperty(abbreviation) ? CHARACTERISTIC_NAMES[abbreviation] : '';
    }

    hasSecondaryCharacteristics(powers) {
        for (let power of powers) {
            if (!power.affectsPrimary && power.affectsTotal) {
                return true;
            }
        }

        return false;
    }

    getCharacteristicTotal(characteristic, powersMap) {
         let value = characteristic.value;
         let showSecondary = store.getState().character.showSecondary;

         if (powersMap.has(characteristic.shortName.toUpperCase())) {
             let char = powersMap.get(characteristic.shortName.toUpperCase());

             if ((char.affectsPrimary && char.affectsTotal) || (!char.affectsPrimary && char.affectsTotal && showSecondary)) {
                 value += char.levels;
             }
         }

         if (powersMap.has('DENSITYINCREASE')) {
             let densityIncrease = powersMap.get('DENSITYINCREASE');

             if ((densityIncrease.affectsPrimary && densityIncrease.affectsTotal) ||
                 (!densityIncrease.affectsPrimary && densityIncrease.affectsTotal && showSecondary)) {
                 switch (characteristic.shortName.toUpperCase()) {
                     case 'STR':
                         value += densityIncrease.levels * 5;
                         break;
                     case 'PD':
                     case 'ED':
                         value += densityIncrease.levels;
                         break;
                     default:
                         // Do nothing
                 }
             }
         }

         if (powersMap.has('FORCEFIELD')) {
             let resistantDefence = powersMap.get('FORCEFIELD')

             if ((resistantDefence.affectsPrimary && resistantDefence.affectsTotal) ||
                 (!resistantDefence.affectsPrimary && resistantDefence.affectsTotal && showSecondary)) {
                 switch (characteristic.shortName.toUpperCase()) {
                     case 'PD':
                         value += resistantDefence.pdlevels;
                         break;
                     case 'ED':
                         value += resistantDefence.edlevels;
                         break;
                     default:
                         // Do nothing
                 }
             }
         }

         return value;
    }

    getRollTotal(characteristic, powersMap) {
        if (characteristic.roll === null) {
            return;
        }

        return `${Math.round(this.getCharacteristicTotal(characteristic, powersMap) / 5) + SKILL_ROLL_BASE}-`;
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

    _populateTrait(character, template, trait, traitKey, traitSubKey, characterSubTrait) {
        if (trait === null) {
            return;
        } else if (!Array.isArray(trait[traitSubKey])) {
            trait[traitSubKey] = [trait[traitSubKey]];
        }

        trait[traitSubKey] = trait[traitSubKey].concat(this._getLists(trait));

        for (let skillEnhancer of SKILL_ENHANCERS) {
            if (trait.hasOwnProperty(common.toCamelCase(skillEnhancer))) {
                trait[traitSubKey].push(trait[common.toCamelCase(skillEnhancer)]);
            }
        }

        trait[traitSubKey].sort((a, b) => a.position > b.position);

        for (let value of Object.values(trait[traitSubKey])) {
            if (value.xmlid.toUpperCase() === GENERIC_OBJECT || SKILL_ENHANCERS.includes(value.xmlid.toUpperCase())) {
                value.type = 'list';
                value[characterSubTrait] = [];

                if (value.originalType.toUpperCase() === 'VPP') {
                    value.template = this._buildVppTemplate(value, template);
                }

                character[traitKey].push(value);

                continue;
            } else if (value.xmlid.toUpperCase() === 'COMPOUNDPOWER') {
                this._getCompoundPowers(value, template, traitKey, traitSubKey);
            }

            templateTrait = this._getTemplateTrait(value, template, traitKey, traitSubKey);

            this._addModifierTemplate(value.modifier, template);

            value.type = traitSubKey;
            value.template = templateTrait;

            if (value.hasOwnProperty('parentid')) {
                character[traitKey].filter(t => t.id === value.parentid).shift()[characterSubTrait].push(value);
            } else {
                character[traitKey].push(value);
            }
        }
    }

    _getCompoundPowers(compoundPower, template, traitKey, traitSubKey) {
        compoundPower.powers = compoundPower.power;

        delete compoundPower.power;

        for (let power of compoundPower.powers) {
            templateTrait = this._getTemplateTrait(power, template, traitKey, traitSubKey);

            this._addModifierTemplate(power.modifier, template);

            power.type = traitSubKey;
            power.template = templateTrait;
            power.parentid = compoundPower.id;
        }
    }

    _getTemplateTrait(value, template, traitKey, traitSubKey) {
        let templateTrait = null;

        if (traitKey === 'powers') {
            for (let key of Object.keys(template.characteristics)) {
                if (value.xmlid.toLowerCase() === key.toLowerCase()) {
                    templateTrait = template.characteristics[key];
                    break;
                }
            }

            if (templateTrait === null) {
                for (let [key, subKey] of Object.entries(CHARACTER_TRAITS)) {
                    templateTrait = template[key][subKey].filter(t => {
                        if (t.xmlid.toUpperCase() === GENERIC_OBJECT) {
                            return false;
                        }

                        return t.xmlid.toLowerCase() === value.xmlid.toLowerCase();
                    }).shift();

                    if (templateTrait !== undefined) {
                        break;
                    }
                }
            }
        } else {
            templateTrait = template[traitKey][traitSubKey].filter(t => {
                if (t.xmlid.toUpperCase() === GENERIC_OBJECT) {
                    return false;
                }

                return t.xmlid.toLowerCase() === value.xmlid.toLowerCase();
            }).shift();
        }

        return templateTrait;
    }

    _addModifierTemplate(modifier, template) {
        if (modifier === undefined || modifier === null) {
            return;
        }

        if (Array.isArray(modifier)) {
            for (let mod of modifier) {
                this._addModifierTemplate(mod, template);
            }
        } else {
            for (let mod of template.modifiers.modifier) {
                if (mod.xmlid.toUpperCase() === modifier.xmlid.toUpperCase()) {
                    modifier.template = mod;
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

        return finalTemplate;
    }

    _normalizeTemplateData(template) {
        let normalizedEntries;

        for (let [listKey, subListKey] of Object.entries(CHARACTER_TRAITS)) {
            normalizedEntries = [];

            if (listKey === 'powers') {
                this._normalizeTemplatePowers(template);
                continue;
            }

            for (let [key, item] of Object.entries(template[listKey])) {
                if (Array.isArray(item)) {
                    for (let i of item) {
                        this._normalizeTemplateItem(normalizedEntries, key, i);
                    }
                } else {
                    if (!item.hasOwnProperty('xmlid')) {
                        item.xmlid = common.toSnakeCase(key).toUpperCase();
                    }

                    normalizedEntries.push(item);

                    delete template[listKey][key];
                }
            }

            template[listKey][subListKey] = template[listKey][subListKey].concat(normalizedEntries);
        }
    }


    _normalizeTemplateItem(normalizedEntries, key, item) {
        if (Array.isArray(item)) {
            for (let i of item) {
                this._normalizeTemplateItem(normalizedEntries, key, i);
            }
        } else {
            if (!item.hasOwnProperty('xmlid')) {
                if (key === 'maneuver') {
                    item.xmlid = common.toSnakeCase(item.display).toUpperCase();
                } else {
                    item.xmlid = key.toUpperCase();
                }
            }

            normalizedEntries.push(item);
        }
    }

    _normalizeTemplatePowers(template) {
        const blacklisted = ['sensegroup', 'sense']; // For some reason these are listed in powers

        template.senses = {};
        template.powers.power = [];
        template.characteristics.running.xmlid = 'RUNNING';
        template.powers.power.push(template.characteristics.running);
        template.characteristics.swimming.xmlid = 'SWIMMING';
        template.powers.power.push(template.characteristics.swimming);
        template.characteristics.leaping.xmlid = 'LEAPING';
        template.powers.power.push(template.characteristics.leaping);

        for (let [key, power] of Object.entries(template.powers)) {
            if (blacklisted.includes(key)) {
//                template.senses[key] = power;  // Uncomment to generate the senses.json file
                continue;
            }

            if (key !== 'power') {
                this._normalizeTemplatePower(template, key, power);

                delete template.powers[key];
            }
        }
    }

    _normalizeTemplatePower(template, key, power) {
        if (Array.isArray(power)) {
            for (let p of power) {
                this._normalizeTemplatePower(template, key, p);
            }
        } else {
            if (!power.hasOwnProperty('xmlid')) {
                power.xmlid = key.toUpperCase();
            }

            template.powers.power.push(power);
        }
    }

    _normalizeCharacterData(heroDesignerCharacter) {
        for (let [listKey, subListKey] of Object.entries(CHARACTER_TRAITS)) {
            if (listKey === 'powers' || listKey === 'martialArts') {
                this._normalizeCharacterItems(heroDesignerCharacter, listKey.toLowerCase(), subListKey);

                continue;
            }

            if (heroDesignerCharacter.hasOwnProperty(listKey.toLowerCase()) && heroDesignerCharacter[listKey] !== null) {
                for (let [key, item] of Object.entries(heroDesignerCharacter[listKey.toLowerCase()])) {
                    this._normalizeCharacterDataItem(heroDesignerCharacter, item, key);
                }
            }
        }
    }

    _normalizeCharacterDataItem(heroDesignerCharacter, item, key) {
        if (Array.isArray(item)) {
            for (let i of item) {
                this._normalizeCharacterDataItem(heroDesignerCharacter, i, key);
            }
        } else {
            if (!item.hasOwnProperty('xmlid')) {
                item.xmlid = common.toSnakeCase(item.display).toUpperCase();
            }

            item.originalType = key;
        }
    }

    _normalizeCharacterItems(heroDesignerCharacter, listKey, subListKey) {
        if (heroDesignerCharacter[listKey] === null || heroDesignerCharacter[listKey] === undefined) {
            return;
        }

        for (let [key, item] of Object.entries(heroDesignerCharacter[listKey])) {
            if (key !== subListKey) {
                this._normalizeCharacterItem(heroDesignerCharacter, item, listKey, subListKey, key);

                delete heroDesignerCharacter[listKey][key];
            } else if (key.toUpperCase() === 'MANEUVER') {
                for (let i of item) {
                    if (i.xmlid.toUpperCase() === 'MANEUVER') {
                        i.xmlid = common.toSnakeCase(i.alias).toUpperCase()
                    }
                }
            }
        }
    }

    _normalizeCharacterItem(heroDesignerCharacter, item, listKey, subListKey, originalType) {
        if (Array.isArray(item)) {
            for (let i of item) {
                this._normalizeCharacterItem(heroDesignerCharacter, i, listKey, subListKey, originalType);
            }
        } else {
            item.originalType = originalType;

            heroDesignerCharacter[listKey][subListKey].push(item);
        }
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

   _buildVppTemplate(power, template) {
       let mods = [];
       let adds = [{
           'xmlid': 'CONTROLCOST',
           'basecost': power.adder.baseCost,
           'levels': power.adder.levels,
           'lvlcost': power.adder.lvlcost,
           'lvlval': power.adder.lvlval
        }];

       for (let modifier of template.modifiers.modifier) {
           if (modifier.hasOwnProperty('type') && modifier.type.toUpperCase() === 'VPP') {
               mods.push(modifier);
           }
       }

       return {
          modifier: mods,
          adder: adds
       };
   }
}

export let heroDesignerCharacter = new HeroDesignerCharacter();
