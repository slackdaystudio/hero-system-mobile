import archtypes from '../../public/templates/archtypes.json';
import specialFx from '../../public/templates/specialfx.json';
import skills from '../../public/templates/skills.json';
import disadvantages from '../../public/templates/disadvantages.json';

class RandomCharacter {	
	generate() {
		let archtype = this._getArchtype();

		return {
			archtype: archtype,
			gender: this._getGender(),
			specialFx: this._getSpecialFx(),
			powers: this._getPowers(archtype),
			skills: this._getSkills(),
			disadvantages: this._getDisadvantages()
		}
	}
	
	_getArchtype() {
		return archtypes.archtypes[Math.floor(Math.random() * archtypes.archtypes.length)];
	}
	
	_getGender() {
		return Math.random() < 0.5 ? 'Male' : 'Female';
	}
	
	_getSpecialFx() {
		return specialFx.effects[Math.floor(Math.random() * specialFx.effects.length)];
	}
	
	_getPowers(archtype) {
		return archtype.powersets[Math.floor(Math.random() * archtype.powersets.length)];
	}
	
	_getSkills() {
		return skills.skillsets[Math.floor(Math.random() * skills.skillsets.length)];
	}
	
	_getDisadvantages() {
		return disadvantages.disadvantagePackages[Math.floor(Math.random() * disadvantages.disadvantagePackages.length)];
	}
}

export let randomCharacter = new RandomCharacter();