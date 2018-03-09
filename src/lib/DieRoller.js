import { Alert } from 'react-native';
import { common } from './Common';

export const SKILL_CHECK = 1;

export const TO_HIT = 2;

export const NORMAL_DAMAGE = 3;

export const KILLING_DAMAGE = 4;
	
export const FREE_FORM = 5;

export const HIT_LOCATIONS = 6;

export const KNOCKBACK = 7;

export const PARTIAL_DIE_PLUS_ONE = 1;

export const PARTIAL_DIE_HALF = 2;

class DieRoller {
	constructor() {
		this.validLastRollTypes = [
			SKILL_CHECK, 
			TO_HIT, 
			NORMAL_DAMAGE, 
			KILLING_DAMAGE,
			FREE_FORM
		];
	}
	
	rollCheck(threshold = null) {
	    let regex = /^([0-9]+\-|[0-9]+\-\s\/\s[0-9]+\-)$/;
	    let result = this._roll(3, SKILL_CHECK);
	    result.threshold = -1;

	    if (threshold !== null && regex.test(threshold)) {
	        let rollThreshold = threshold;

	        if (threshold.indexOf('/') !== -1) {
                rollThreshold = threshold.split(' / ')[1];
	        }

            result.threshold = rollThreshold.slice(0, -1);
	    }

		return result;
	}
	
	rollToHit(cv) {
		let result = this._roll(3, TO_HIT);
		result.hitCv = 11 + parseInt(cv, 10) - result.total;
		result.cv = cv;

		return result;
	}
	
	rollDamage(damageForm) {
		let resultRoll = this._roll(damageForm.dice, damageForm.damageType, damageForm.partialDie);
		let hitLocationRoll = damageForm.useHitLocations ? this._roll(3, HIT_LOCATIONS).total : 10;
		resultRoll.damageForm = damageForm;
		
		if (damageForm.damageType === KILLING_DAMAGE) {
			resultRoll.stunMultiplier = damageForm.stunMultiplier;
		}				
	
		resultRoll.hitLocationDetails = this._getHitLocationModifiers(hitLocationRoll);
		resultRoll.body = this._calcualteBody(resultRoll);
		resultRoll.stun = this._calcualteStun(resultRoll);
		resultRoll.knockback = this._calculateKnockback(resultRoll, damageForm.isTargetFlying, damageForm.isMartialManeuver);

		return resultRoll;
	}
	
	freeFormRoll(dice, halfDice, pips) {
		let resultRoll = {
			rollType: FREE_FORM,
			total: pips,
			rolls: [],
			dice: dice,
			halfDice: halfDice,
			pips: pips
		};
		let roll = 0;
		
		for (let i = 0; i < dice; i++) {
			roll = Math.floor(Math.random() * 6) + 1;
			
			resultRoll.total += roll;
			resultRoll.rolls.push(roll);
		}
		
		for (let i = 0; i < halfDice; i++) {
			roll = Math.floor(Math.random() * 3) + 1;
			
			resultRoll.total += roll;
			resultRoll.rolls.push(roll);
		}
		
		return resultRoll;	
	}
	
	rollAgain(lastResult) {
		let result = null;
		
		if (lastResult.rollType === SKILL_CHECK) {
			result = this.rollCheck(lastResult.threshold + '-');
		} else if (lastResult.rollType === TO_HIT) {
			result = this.rollToHit(lastResult.cv, lastResult.rollType, lastResult.partialDieType);
		} else if (lastResult.rollType === NORMAL_DAMAGE || lastResult.rollType === KILLING_DAMAGE) {
			result = this.rollDamage(lastResult.damageForm);
		} else if (lastResult.rollType === FREE_FORM) {
			result = this.freeFormRoll(lastResult.dice, lastResult.halfDice, lastResult.pips);
		}
		
		return result;
	}
	
	_roll(dice, rollType, partialDieType) {
		let resultRoll = {
			rollType: rollType,
			total: 0,
			rolls: [],
			partialDieType: partialDieType || null
		};
		let roll = 0;

		for (let i = 0; i < dice; i++) {
			roll = Math.floor(Math.random() * 6) + 1;
			
			resultRoll.total += roll;
			resultRoll.rolls.push(roll);
		}
		
		if (partialDieType === PARTIAL_DIE_PLUS_ONE) {
			resultRoll.total += 1;
		} else if (partialDieType === PARTIAL_DIE_HALF) {
			let halfDie = Math.floor(Math.random() * 3) + 1;
			
			resultRoll.total += halfDie;
			resultRoll.rolls.push(halfDie);
		}				
		
		return resultRoll;
	}

	_calcualteStun(resultRoll) {
		let stun = 0;
		
		if (resultRoll.rollType === KILLING_DAMAGE) {
			if (resultRoll.damageForm.useHitLocations) {
                stun = resultRoll.total * (resultRoll.hitLocationDetails.stunX + parseInt(resultRoll.stunMultiplier));
			} else {
                let stunModifier = 1;

                if (resultRoll.damageForm.useFifthEdition) {
                    stunModifier = Math.floor(Math.random() * 6) + 1;
                    stunModifier--;

                    if (stunModifier === 0) {
                        stunModifier = 1;
                    }
                } else {
                    stunModifier = Math.floor(Math.random() * 3) + 1;
                }

                stun = resultRoll.total * (stunModifier + parseInt(resultRoll.stunMultiplier));
			}
		} else {
			stun = resultRoll.total
		}
		
		return stun;
	}
	
	_calcualteBody(resultRoll) {
		let body = 0;
	
		if (resultRoll.rollType === NORMAL_DAMAGE) {
			for (let roll of resultRoll.rolls) {
				if (roll >= 2 && roll <= 5) {
					body += 1;
				} else if (roll === 6) {
					body += 2;
				}
			}
		} else if (resultRoll.rollType === KILLING_DAMAGE) {
			body += resultRoll.total;
		}
						
		return body;
	}
	
	_calculateKnockback(resultRoll, isTargetFlying, isMartialManeuver) {
		let knockbackDice = 2;
		
		if (isMartialManeuver) {
			knockbackDice++;
		}
		
		if (isTargetFlying) {
			knockbackDice--;
		}
		
		if (resultRoll.rollType === KILLING_DAMAGE) {
			knockbackDice++;
		}
		
		return (resultRoll.body - this._roll(knockbackDice, KNOCKBACK).total) * 2;
	}
	
	_getHitLocationModifiers(hitLocationRoll) {				
		if (hitLocationRoll >= 3 && hitLocationRoll <= 5) {
			return {
				location: 'Head',
				stunX: 5,
				nStun: 2,
				bodyX: 2
			};
		} else if (hitLocationRoll == 6) {
			return {
				location: 'Hands',
				stunX: 1,
				nStun: 0.5,
				bodyX: 0.5
			};
		} else if (hitLocationRoll >= 7 && hitLocationRoll <= 8) {
			return {
				location: 'Arms',
				stunX: 2,
				nStun: 0.5,
				bodyX: 0.5
			};
		} else if (hitLocationRoll == 9) {
			return {
				location: 'Shoulders',
				stunX: 3,
				nStun: 1,
				bodyX: 1
			};
		} else if (hitLocationRoll >= 10 && hitLocationRoll <= 11) {
			return {
				location: 'Chest',
				stunX: 3,
				nStun: 1,
				bodyX: 1
			};
		} else if (hitLocationRoll == 12) {
			return {
				location: 'Stomach',
				stunX: 4,
				nStun: 1.5,
				bodyX: 1
			};
		} else if (hitLocationRoll == 13) {
			return {
				location: 'Vitals',
				stunX: 4,
				nStun: 1.5,
				bodyX: 2
			};
		} else if (hitLocationRoll == 14) {
			return {
				location: 'Thighs',
				stunX: 2,
				nStun: 1,
				bodyX: 1
			};
		} else if (hitLocationRoll >= 15 && hitLocationRoll <= 16) {
			return {
				location: 'Legs',
				stunX: 2,
				nStun: 0.5,
				bodyX: 0.5
			};
		} else {
			return {
				location: 'Feet',
				stunX: 1,
				nStun: 0.5,
				bodyX: 0.5
			};
		}
	}
}

export let dieRoller = new DieRoller();