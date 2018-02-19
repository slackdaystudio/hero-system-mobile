import React, { Component }  from 'react';
import { AsyncStorage, View } from 'react-native';
import { Container, Content, Text } from 'native-base';
import Header from '../Header/Header';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class StatisticsScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            stats: null
        }
    }

    async componentDidMount() {
        let stats = await AsyncStorage.getItem('statistics');

        this.setState({
            stats: stats
        })
    }

	render() {
		return (
		  <Container style={styles.container}>
			<Header navigation={this.props.navigation} />
	        <Content style={styles.content}>
	            <Text style={styles.grey}>{JSON.stringify(this.state.stats)}</Text>
	        </Content>
	      </Container>
		);
	}
}