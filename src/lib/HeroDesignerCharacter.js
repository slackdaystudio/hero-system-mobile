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

export const MISSING_CHARACTERISTIC_DESCRIPTIONS = {
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

const SKLILL_ROLL_BASE = 9;

class HeroDesignerCharacter {
    getCharacter(heroDesignerCharacter) {
        const template = this._getTemplate(heroDesignerCharacter.template);

        return {
            version: heroDesignerCharacter.version,
            characterInfo: heroDesignerCharacter.characterInfo,
            characteristics: this._getCharacteristics(heroDesignerCharacter.characteristics, template)
        };
    }

    _getCharacteristics(characteristics, template) {
        let formattedCharacteristics = [];
        let templateCharacteristic = null;
        let name = null;
        let definition = null;
        let value = 0;
        let cost = 0;
        let roll = null;

        for (let [key, characteristic] of Object.entries(characteristics)) {
            if (Object.keys(BASE_MOVEMENT_MODES).includes(key.toLowerCase())) {
                continue;
            }

            templateCharacteristic = template.characteristics[key.toLowerCase()];
            name = CHARACTERISTIC_NAMES[key.toLowerCase()];
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
                roll = Math.round(value / 5) + SKLILL_ROLL_BASE;
            }

            if (definition === null && Object.keys(MISSING_CHARACTERISTIC_DESCRIPTIONS).includes(key.toLowerCase())) {
                definition = MISSING_CHARACTERISTIC_DESCRIPTIONS[key.toLowerCase()];
            }

            formattedCharacteristics.push({
                name: name,
                shortName: characteristic.alias,
                value: value,
                cost: cost,
                base: templateCharacteristic.base,
                definition: definition,
                roll: roll === null ? null : `${roll}-`
            });
        }

        return formattedCharacteristics;
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
}

export let heroDesignerCharacter = new HeroDesignerCharacter();
