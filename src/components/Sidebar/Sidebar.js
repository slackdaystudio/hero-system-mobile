import React, { Component } from "react";
import { connect } from 'react-redux';
import { StyleSheet, Image, StatusBar, View } from "react-native";
import { Container, Content, Text, List, ListItem } from "native-base";
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import { common } from '../../lib/Common';
import styles from '../../Styles';

class Sidebar extends Component {
  _onLoadPress() {
      if (common.isEmptyObject(this.props.character)) {
        common.toast('Please load a character first');
      } else {
        let screen = 'ViewCharacter';

        if (character.isHeroDesignerCharacter(this.props.character)) {
            screen = 'ViewHeroDesignerCharacter';
        }

        this.props.navigation.navigate(screen);
      }
    }

  render() {
    return (
      <Container style={localStyles.container}>
        <Content>
          <List>
        	<ListItem onPress={() => this.props.navigation.navigate('Home')}>
				<View>
					<Image source={require('../../../public/hero_mobile_logo.png')} />
				</View>
	      	</ListItem>
          	<ListItem onPress={() => this._onLoadPress()}>
	      		<Text style={styles.grey}>View Character</Text>
	      	</ListItem>
          	<ListItem itemDivider style={{backgroundColor: '#242424'}} />
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
	      	<ListItem itemDivider style={{backgroundColor: '#242424'}} />
            <ListItem onPress={() => this.props.navigation.navigate('RandomCharacter')}>
                <Text style={styles.grey}>H.E.R.O.</Text>
            </ListItem>
            <ListItem onPress={() => this.props.navigation.navigate('CostCruncher')}>
                <Text style={styles.grey}>Cruncher</Text>
            </ListItem>
	      	<ListItem itemDivider style={{backgroundColor: '#242424'}} />
	      	<ListItem onPress={() => this.props.navigation.navigate('Statistics')}>
	      		<Text style={styles.grey}>Statistics</Text>
	      	</ListItem>
	      	<ListItem itemDivider style={{backgroundColor: '#242424'}} />
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
		backgroundColor: '#242424'
	}
});

const mapStateToProps = state => {
    return {
        character: state.character.character
    };
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
