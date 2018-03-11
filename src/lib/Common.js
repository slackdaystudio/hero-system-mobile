import { Dimensions, Platform, AsyncStorage, Alert } from 'react-native';

class Common {
    isIPad() {
	    let {height, width} = Dimensions.get('window');

	    if (Platform.OS === 'ios' && height / width <= 1.6) {
		    return true;
	    }

	    return false;
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
}

export let common = new Common();