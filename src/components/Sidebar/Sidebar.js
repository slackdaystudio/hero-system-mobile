import React, { Component } from "react";
import { StyleSheet, Image, StatusBar, View } from "react-native";
import { Container, Content, Text, List, ListItem } from "native-base";
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class Sidebar extends Component {
  render() {
    return (
      <Container style={localStyles.container}>
        <Content>
          <List>
        	<ListItem onPress={() => this.props.navigation.navigate('Home')}>
				<View>
					<Image source={require('../../../public/hero_logo.png')} />
				</View>
	      	</ListItem>
          	<ListItem onPress={() => this.props.navigation.navigate('ViewCharacter')}>
	      		<Text style={styles.grey}>View Character</Text>
	      	</ListItem>
          	<ListItem itemDivider style={{backgroundColor: '#000'}} />
          	<ListItem onPress={() => this.props.navigation.navigate('Skill')}>
	      		<Text style={styles.grey}>3D6</Text>
	      	</ListItem> 
          	<ListItem onPress={() => this.props.navigation.navigate('Hit')}>
	      		<Text style={styles.grey}>Hit</Text>
	      	</ListItem>	      	
          	<ListItem onPress={() => this.props.navigation.navigate('Damage')}>
	      		<Text style={styles.grey}>Damage</Text>
	      	</ListItem>
          	<ListItem onPress={() => this.props.navigation.navigate('FreeForm')}>
	      		<Text style={styles.grey}>Free Form</Text>
	      	</ListItem>
	      	<ListItem itemDivider style={{backgroundColor: '#000'}} />
            <ListItem onPress={() => this.props.navigation.navigate('RandomCharacter')}>
                <Text style={styles.grey}>H.E.R.O.</Text>
            </ListItem>
            <ListItem onPress={() => this.props.navigation.navigate('CostCruncher')}>
                <Text style={styles.grey}>Cruncher</Text>
            </ListItem>
	      	<ListItem itemDivider style={{backgroundColor: '#000'}} />
	      	<ListItem onPress={() => this.props.navigation.navigate('Statistics')}>
	      		<Text style={styles.grey}>Statistics</Text>
	      	</ListItem>
	      	<ListItem itemDivider style={{backgroundColor: '#000'}} />
	      	<ListItem onPress={() => this.props.navigation.navigate('Settings')}>
	      		<Text style={styles.grey}>Settings</Text>
	      	</ListItem>	
          </List>
        </Content>
      </Container>
    );
  }
}

const localStyles = StyleSheet.create({
	container: {
		backgroundColor: '#000'
	}
});