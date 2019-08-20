import { Alert } from 'react-native';
import { modifierCalculator } from './ModifierCalculator';
import { common } from './Common';
import { SKILL_ENHANCERS } from './HeroDesignerCharacter';

class CostCalculator {
    getActiveCost(item, parent=undefined) {
        let modifiers = modifierCalculator.getItemTotalModifiers(item).concat(modifierCalculator.getItemTotalModifiers(parent));
        let advantages = modifiers.filter(m => m > 0) || [0];
        let activeCost = this._calculateCost(item) * (1 + advantages.reduce((a, b) => a + b, 0));

        return this.roundInPlayersFavor(activeCost);
    }

    getRealCost(item, parent=undefined) {
        let modifiers = modifierCalculator.getItemTotalModifiers(item).concat(modifierCalculator.getItemTotalModifiers(parent));
        let limitations = modifiers.filter(m => m < 0) || [0];
        let realCost = this.getActiveCost(item, parent) / (1 - limitations.reduce((a, b) => a + b, 0));

        if (parent !== undefined && SKILL_ENHANCERS.includes(parent.xmlId.toUpperCase())) {
            realCost = realCost - 1 === 0 ? 1 : realCost - 1;
        }

        return this.roundInPlayersFavor(realCost);
    }

    roundInPlayersFavor(toBeRounded) {
        let rounded = toBeRounded;

        if (common.isFloat(toBeRounded)) {
            if ((toBeRounded % 1).toFixed(1) === '0.5') {
                rounded = Math.trunc(toBeRounded);
            } else {
                rounded = Math.round(toBeRounded);
            }
        }

        return rounded;
    }

    _calculateCost(item) {
        switch (item.type) {
            case 'skill':
                return this._calculateSkillCost(item);
            default:
                // Do nothing
        }

        return 0;
    }

    _calculateSkillCost(skill) {
        let cost = 0;

        if (skill.proficiency) {
            cost = 2;
        } else if (skill.familiarity || skill.everyman) {
            cost = skill.familiarity ? 1 : 0;
        } else {
            let basecost = 0;
            let skillLevelCost = 0;

            if (Array.isArray(skill.template.characteristicChoice.item)) {
                for (let item of skill.template.characteristicChoice.item) {
                    if (item.characteristic.toLowerCase() === skill.characteristic.toLowerCase()) {
                        basecost = item.basecost;
                        skillLevelCost = item.lvlcost;
                    }
                }
            } else {
                basecost = skill.template.characteristicChoice.item.basecost;
                skillLevelCost = skill.template.characteristicChoice.item.lvlcost;
            }

            cost = basecost + (skill.levels * skillLevelCost);
        }

        return cost;
    }
}

export let costCalculator = new CostCalculator();