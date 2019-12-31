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

import RNFetchBlob from 'rn-fetch-blob'

class HeroDesignerTemplate {
    getTemplate(template) {
        let baseTemplate = null;
        let subTemplate = null;

        if (typeof template === 'string') {
            baseTemplate = template.endsWith('6E.hdt') ? mainSixth : main;

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
                    common.toast(`${template} is not recognized`);
            }
        } else {
            baseTemplate = template.extends.endsWith('6E.hdt') ? mainSixth : main;
            subTemplate = template;
        }

        return subTemplate === null ? baseTemplate : this._finalizeTemplate(baseTemplate, subTemplate);
    }

    _finalizeTemplate(baseTemplate, subTemplate) {
        let finalTemplate = JSON.parse(JSON.stringify(baseTemplate));

        finalTemplate = this._finalizeCharacteristics(finalTemplate, subTemplate);
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'skills', 'skill');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'skillEnhancers', 'enhancer');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'martialArts', 'maneuver');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'perks', 'perk');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'talents', 'talent');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'powers', 'power');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'modifiers', 'modifier');
        finalTemplate = this._finalizeItems(finalTemplate, subTemplate, 'disadvantages', 'disad');

        return finalTemplate;
    }

    _finalizeCharacteristics(finalTemplate, subTemplate) {
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

            if (subTemplate.characteristics) {
                for (let [key, characteristic] of Object.entries(subTemplate.characteristics)) {
                    finalTemplate.characteristics[key] = characteristic;
                }
            }
        }

        return finalTemplate;
    }

    _finalizeItems(finalTemplate, subTemplate, key, subKey) {
        if (subTemplate[key] !== null) {
            if (subTemplate[key].remove) {
                let filtered = [];

                if (Array.isArray(subTemplate[key].remove)) {
                    filtered = finalTemplate[key][subKey].filter((item, index) => {
                        return !subTemplate[key].remove.includes(item.xmlid.toUpperCase());
                    });
                } else {
                    filtered = finalTemplate[key][subKey].filter((item, index) => {
                        return subTemplate[key].remove !== item.xmlid.toUpperCase();
                    });
                }

                finalTemplate[key][subKey] = filtered;
            }

            if (subTemplate[key][subKey]) {
                if (Array.isArray(subTemplate[key][subKey])) {
                    for (let item of subTemplate[key][subKey]) {
                        if (Array.isArray(finalTemplate[key][subKey])) {
                            finalTemplate[key][subKey].push(item);
                        } else {
                            let list = [finalTemplate[key][subKey]];
                            list.push(item);

                            finalTemplate[key][subKey] = list;
                        }
                    }
                } else {
                    if (Array.isArray(finalTemplate[key][subKey])) {
                        finalTemplate[key][subKey].push(subTemplate[key][subKey]);
                    } else {
                        let list = [finalTemplate[key][subKey]];
                        list.push(subTemplate[key][subKey]);

                        finalTemplate[key][subKey] = list;
                    }
                }
            }
        }

        return finalTemplate;
    }
}

export let heroDesignerTemplate = new HeroDesignerTemplate();