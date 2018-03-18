import React, { Component }  from 'react';
import { StyleSheet, View, Dimensions, Alert } from 'react-native';
import { Container, Content } from 'native-base';
import Pdf from 'react-native-pdf';
import Header from '../Header/Header';
import styles from '../../Styles';

export default class SkillScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
		    pdfName: props.navigation.state.params.pdfName
		};
	}

	render() {
		return (
			<Container style={styles.container}>
				<Header navigation={this.props.navigation} />
                <View style={{flex: 1, justifyContent: 'flex-start', alignItems: 'center', marginTop: 25}}>
                    <Pdf
                        source={{uri:'bundle-assets://' + this.state.pdfName}}
                        onError={(error)=>{
                            Alert.alert('Error: ' + error);
                        }}
                        style={{flex:1, width: Dimensions.get('window').width}}/>
                </View>
            </Container>
		);
	}
}