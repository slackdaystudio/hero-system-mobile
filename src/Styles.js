import { StyleSheet, Platform } from 'react-native';
import { ifIphoneX } from 'react-native-iphone-x-helper'

export default StyleSheet.create({
	container: {
		backgroundColor: '#1b1d1f',
        ...ifIphoneX({
            paddingTop: 50
        }, {
            paddingTop: (Platform.OS === 'ios' ? 20 : 0)
        })
	},
	content: {
		paddingTop: 0,
		paddingHorizontal: 0
	},
    heading: {
		fontSize: 24,
		fontFamily: 'Arial, Roboto',
		fontWeight: 'bold',
		color: '#f0f0f0',
		paddingVertical: 5,
		textAlign: 'center',
		backgroundColor: '#121212',
		width: '100%',
		borderColor: '#303030',
		borderBottomWidth: 1,
		borderTopWidth: 1,
		textTransform: 'uppercase',
		letterSpacing: 8
	},
	subHeading: {
		alignSelf: 'center',
		fontWeight: 'bold',
		textDecorationLine: 'underline',
		color: '#f0f0f0'
	},
	hdSubHeading: {
		fontSize: 22,
		fontWeight: 'bold',
		paddingTop: 10,
		color: '#f0f0f0',
		borderBottomColor: '#f0f0f0',
		borderBottomWidth: 2,
		width: '100%'
	},
	buttonContainer: {
		paddingVertical: 5
	},
	button: {
		backgroundColor: '#14354d',
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
		color: '#f0f0f0'
	},
	grey: {
		color: '#f0f0f0'
	},
	boldGrey: {
		color: '#f0f0f0',
		fontWeight: 'bold'
	},
	tabInactive: {
		backgroundColor: '#000'
	},
	tabActive: {
		backgroundColor: '#000'
	},
	tabBarUnderline: {
		backgroundColor: '#f0f0f0'
	},
	tabContent: {
	    flex: 1,
		backgroundColor: '#1b1d1f'
	}
});
