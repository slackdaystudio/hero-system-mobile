import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { StyleSheet, Image, StatusBar, View } from 'react-native';
import { Container, Content, Text, List, ListItem } from 'native-base';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import { common } from '../../lib/Common';
import styles from '../../Styles';

// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class Sidebar extends Component {
	static propTypes = {
	    navigation: PropTypes.object.isRequired,
	    character: PropTypes.object,
	}

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
        backgroundColor: '#242424',
    },
});

const mapStateToProps = state => {
    return {
        character: state.character.character,
    };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
