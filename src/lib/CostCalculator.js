import { Alert } from 'react-native';
import { modifierCalculator } from './ModifierCalculator';
import { common } from './Common';

class CostCalculator {
    getActiveCost(item, parent=undefined) {
        let modifiers = modifierCalculator.getItemTotalModifiers(item).concat(modifierCalculator.getItemTotalModifiers(parent));
        let advantages = modifiers.filter(m => m > 0) || [0];
        let activeCost = item.cost * (1 + advantages.reduce((a, b) => a + b, 0));

        return this.roundInPlayersFavor(activeCost);
    }

    getRealCost(item, parent=undefined) {
        let modifiers = modifierCalculator.getItemTotalModifiers(item).concat(modifierCalculator.getItemTotalModifiers(parent));
        let limitations = modifiers.filter(m => m < 0) || [0];
        let realCost = this.getActiveCost(item, parent) / (1 - limitations.reduce((a, b) => a + b, 0));

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
}

export let costCalculator = new CostCalculator();