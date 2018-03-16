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
	
	rollToHit(cv, isAutofire, targetDcv) {
		let result = this._roll(3, TO_HIT);
		result.hitCv = 11 + parseInt(cv, 10) - result.total;
		result.cv = cv;
		result.isAutofire = isAutofire;
		result.targetDcv = targetDcv;

        if (isAutofire) {
            result.hits = 0;

            if (result.hitCv - targetDcv >= 0) {
                result.hits = Math.floor((result.hitCv - targetDcv) / 2) + 1;
            }
        }

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
		resultRoll.body = this._calculateBody(resultRoll);
		resultRoll.stun = this._calculateStun(resultRoll);
		resultRoll.knockback = this._calculateKnockback(resultRoll, damageForm.isTargetFlying, damageForm.isMartialManeuver);

		if (damageForm.isExplosion) {
		    resultRoll.rolls.sort((a, b) => a - b).reverse();
		    resultRoll.explosion = [{
		        distance: 0,
		        stun: resultRoll.stun,
		        body: resultRoll.body,
		        knockback: resultRoll.knockback
		    }];

            let newResultRoll = {...resultRoll};
            newResultRoll.rolls = resultRoll.rolls.slice();

		    this._buildExplosionTable(resultRoll, newResultRoll);
		}

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
			result = this.rollToHit(lastResult.cv, lastResult.isAutofire, lastResult.targetDcv);
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

	_calculateStun(resultRoll) {
		let stun = 0;
		
		if (resultRoll.rollType === KILLING_DAMAGE) {
			if (resultRoll.damageForm.useHitLocations) {
                stun = resultRoll.total * (resultRoll.hitLocationDetails.stunX + parseInt(resultRoll.stunMultiplier));
			} else {
			    if (resultRoll.stunModifier === undefined) {
                    resultRoll.stunModifier = 1;

                    if (resultRoll.damageForm.useFifthEdition) {
                        resultRoll.stunModifier = Math.floor(Math.random() * 6) + 1;
                        resultRoll.stunModifier--;

                        if (stunModifier === 0) {
                            resultRoll.stunModifier = 1;
                        }
                    } else {
                        resultRoll.stunModifier = Math.floor(Math.random() * 3) + 1;
                    }
			    }

                stun = resultRoll.total * (resultRoll.stunModifier + parseInt(resultRoll.stunMultiplier));
			}
		} else {
			stun = resultRoll.total
		}
		
		return stun;
	}
	
	_calculateBody(resultRoll) {
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
	    if (resultRoll.knockbackRollTotal === undefined) {
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

            resultRoll.knockbackRollTotal = this._roll(knockbackDice, KNOCKBACK).total;
	    }

		return (resultRoll.body - resultRoll.knockbackRollTotal) * 2;
	}

	_buildExplosionTable(resultRoll, newResultRoll) {
	    newResultRoll.rolls.shift();
	    newResultRoll.total = newResultRoll.rolls.reduce((a, b) => a + b, 0);
        newResultRoll.stun = this._calculateStun(newResultRoll);
        newResultRoll.body = this._calculateBody(newResultRoll);
        newResultRoll.knockback = this._calculateKnockback(newResultRoll);

	    resultRoll.explosion.push({
	        distance: (resultRoll.rolls.length - newResultRoll.rolls.length) * resultRoll.damageForm.fadeRate * 2,
            stun: newResultRoll.stun,
            body: newResultRoll.body,
            knockback: newResultRoll.knockback
	    });

	    if (newResultRoll.rolls.length >= 2) {
	        this._buildExplosionTable(resultRoll, newResultRoll);
	    }
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