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
		paddingHorizontal: 5
	},
    heading: {
		fontSize: 32,
		color: '#D0D1D3',
		paddingTop: 10,
		alignSelf: 'center'
	},
	subHeading: {
		alignSelf: 'center',
		fontWeight: 'bold',
		textDecorationLine: 'underline',
		color: '#D0D1D3'
	},
	hdSubHeading: {
		fontSize: 22,
		fontWeight: 'bold',
		paddingTop: 10,
		color: '#D0D1D3',
		borderBottomColor: '#D0D1D3',
		borderBottomWidth: 2,
		width: '100%'
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
