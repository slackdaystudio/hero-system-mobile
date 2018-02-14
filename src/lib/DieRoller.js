export const SKILL_CHECK = 1;

export const TO_HIT = 2;

export const NORMAL_DAMAGE = 3;

export const KILLING_DAMAGE = 4;
	
export const PARTIAL_DIE_PLUS_ONE = 1;

export const PARTIAL_DIE_HALF = 2;

class DieRoller {
	constructor() {
		this.validLastRollTypes = [
			SKILL_CHECK, 
			TO_HIT, 
			NORMAL_DAMAGE, 
			KILLING_DAMAGE
		];
	}
	
	rollCheck() {
		return this._roll(3, SKILL_CHECK);
	}
	
	rollToHit(cv) {
		let result = this._roll(3, TO_HIT);
		result.hitCv = 11 + parseInt(cv, 10) - result.total;
		result.cv = cv;

		return result;
	}
	
	rollAgain(lastResult) {
		let result = null;
		
		if (lastResult.rollType === SKILL_CHECK) {
			result = this._roll(3, lastResult.rollType, lastResult.partialDieType);
		} else if (lastResult.rollType === TO_HIT) {
			result = this.rollToHit(lastResult.cv, lastResult.rollType, lastResult.partialDieType);
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
		lastRollType = this.validLastRollTypes.indexOf(rollType) !== -1 ? rollType : lastRollType;
		
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
		//console.dir(resultRoll);
		return resultRoll;
	}
}

export let dieRoller = new DieRoller();