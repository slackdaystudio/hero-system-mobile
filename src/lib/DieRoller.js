class DieRoller {
	constructor() {
		this.validLastRollTypes = ['skillCheck', 'toHit', 'normalDamage', 'killingDamage'];
	}
	
	rollCheck() {
		return this._roll(3, 'skillCheck');
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
		
		if (partialDieType === 'plusOne') {
			resultRoll.total += 1;
		} else if (partialDieType === 'halfDie') {
			let halfDie = Math.floor(Math.random() * 3) + 1;
			
			resultRoll.total += halfDie;
			resultRoll.rolls.push(halfDie);
		}				
		//console.dir(resultRoll);
		return resultRoll;
	}
}

export let dieRoller = new DieRoller();