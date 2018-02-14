const SKILL_CHECK = 1;

const TO_HIT = 2;

const NORMAL_DAMAGE = 3;

const KILLING_DAMAGE = 4;
	
const PARTIAL_DIE_PLUS_ONE = 1;

const PARTIAL_DIE_HALF = 2;

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
	
	rollAgain(lastResult) {
		let result = null;
		
		if (lastResult.rollType === SKILL_CHECK) {
			result = this._roll(3, lastResult.rollType, lastResult.partialDieType);
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