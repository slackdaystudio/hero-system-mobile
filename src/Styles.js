import { StyleSheet, Platform } from 'react-native';
import { ifIphoneX } from 'react-native-iphone-x-helper'

export default StyleSheet.create({
	container: {
		backgroundColor: '#375476',
        ...ifIphoneX({
            paddingTop: 50
        }, {
            paddingTop: (Platform.OS === 'ios' ? 20 : 0)
        })
	},
	content: {
		paddingTop: 0,
		paddingHorizontal: 10
	},
	heading: {
		fontSize: 26,
		fontWeight: 'bold',
		color: '#D0D1D3',
		paddingTop: 20
	},
	subHeading: {
		alignSelf: 'center',
		fontWeight: 'bold',
		textDecorationLine: 'underline',
		color: '#D0D1D3'
	},
	buttonContainer: {
		paddingVertical: 5
	},
	button: {
		backgroundColor: '#478f79',
		minWidth: 140,
		justifyContent: 'center',
		alignSelf: 'center'
	},
	buttonBig: {
		backgroundColor: '#478f79',
		minWidth: 300,
		justifyContent: 'center',
		alignSelf: 'center'
	},
	buttonText: {
		color: '#FFF'
	},
	grey: {
		color: '#D0D1D3'
	},
	boldGrey: {
		color: '#D0D1D3',
		fontWeight: 'bold'
	},
	tabInactive: {
		backgroundColor: '#3a557f'
	},
	tabActive: {
		backgroundColor: '#476ead'
	},
	tabBarUnderline: {
		backgroundColor: '#3da0ff'
	},
	tabContent: {
	    flex: 1,
		backgroundColor: '#375476'
	}
});
