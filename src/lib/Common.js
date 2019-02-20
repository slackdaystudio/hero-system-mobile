import { Dimensions, Platform, AsyncStorage, Alert } from 'react-native';
import { KILLING_DAMAGE, NORMAL_DAMAGE } from './DieRoller';

class Common {
    isIPad() {
	    let {height, width} = Dimensions.get('window');

	    if (Platform.OS === 'ios' && height / width <= 1.6) {
		    return true;
	    }

	    return false;
    }

    compare(first, second) {
        if (first === null || typeof first !== 'object' || second === null || typeof second !== 'object') {
            return false;
        }

        for (let prop in first) {
            if (!second.hasOwnProperty(prop)) {
                return false;
            }
        }

        return true;
    }

    isInt(value) {
        return Number(value) === value && value % 1 === 0;
    }

    isFloat(value) {
        return Number(value) === value && value % 1 !== 0;
    }

    async getAppSettings() {
        let settings = await AsyncStorage.getItem('appSettings');

        if (settings === null) {
            return {
                useFifthEdition: false
            };
        }

        return JSON.parse(settings);
    }

    initDamageForm(props = null) {
        if (props === null || props === undefined || props === '') {
            return {
                dice: 12,
                partialDie: 0,
                killingToggled: false,
                damageType: NORMAL_DAMAGE,
                stunMultiplier: 0,
                useHitLocations: false,
                isMartialManeuver: false,
                isTargetFlying: false,
                isTargetInZeroG: false,
                isTargetUnderwater: false,
                rollWithPunch: false,
                isUsingClinging: false,
                isExplosion: false,
                fadeRate: 1,
                useFifthEdition: false,
                tabsLocked: false
            };
        }

        return {
            dice: props.dice || 12,
            partialDie: props.partialDie || 0,
            killingToggled: props.killingToggled || false,
            damageType: props.damageType || NORMAL_DAMAGE,
            stunMultiplier: props.stunMultiplier || 0,
            useHitLocations: props.useHitLocations || false,
            isMartialManeuver: props.isMartialManeuver || false,
            isTargetFlying: props.isTargetFlying || false,
            isTargetInZeroG: props.isTargetInZeroG || false,
            isTargetUnderwater: props.isTargetUnderwater || false,
            rollWithPunch: props.rollWithPunch || false,
            isUsingClinging: props.isUsingClinging || false,
            isExplosion: props.isExplosion || false,
            fadeRate: props.fadeRate || 1,
            useFifthEdition: props.useFifthEdition || false,
            tabsLocked: props.tabsLocked || false,
            skipFormLoad: true
        };
    }

    initFreeFormForm(props = null) {
        if (props === null || props === undefined || props === '') {
            return {
                dice: 1,
                halfDice: 0,
                pips: 0
            };
        }

        return {
            dice: props.dice || 1,
            halfDice: props.halfDice || 0,
            pips: props.pips || 0
        };
    }
}

export let common = new Common();