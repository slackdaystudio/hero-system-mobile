import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Alert, View, ImageBackground } from 'react-native';
import { Container, Content, Button, Spinner, Text } from 'native-base';
import { verticalScale } from 'react-native-size-matters';
import { NavigationEvents } from 'react-navigation';
import Header, { EXIT_APP } from '../Header/Header';
import Heading from '../Heading/Heading';
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

class HomeScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        character: PropTypes.object,
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            BackHandler.exitApp();

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    _onViewPress() {
        let screen = 'ViewCharacter';

        if (character.isHeroDesignerCharacter(this.props.character)) {
            screen = 'ViewHeroDesignerCharacter';
        }

        this.props.navigation.navigate(screen, {from: 'Home'});
    }

    _renderCharacterButtons() {
        if (common.isEmptyObject(this.props.character)) {
            return (
                <View style={styles.buttonContainer}>
                    <Button style={styles.button}  onPress={() => this.props.navigation.navigate('Characters')}>
                        <Text uppercase={false} style={styles.buttonText}>Characters</Text>
                    </Button>
                </View>
            );
        }

        return (
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                <View style={styles.buttonContainer}>
                    <Button style={styles.button}  onPress={() => this._onViewPress()}>
                        <Text uppercase={false} style={styles.buttonText}>View</Text>
                    </Button>
                </View>
                <View style={styles.buttonContainer}>
                    <Button style={styles.button}  onPress={() => this.props.navigation.navigate('Characters')}>
                        <Text uppercase={false} style={styles.buttonText}>Characters</Text>
                    </Button>
                </View>
            </View>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <ImageBackground source={require('../../../public/background.png')} style={{flex: 1}} imageStyle={{ resizeMode: 'cover' }}>
                    <Header navigation={this.props.navigation} backScreen={EXIT_APP} />
                    <Content style={styles.content}>
                        <Heading text="Character" />
                        <Text style={[styles.grey, {textAlign: 'center'}]}>Import characters from Hero Designer and take them with you when you&apos;re on the go.</Text>
                        {this._renderCharacterButtons()}
                        <View style={{paddingBottom: verticalScale(20)}} />
                        <Heading text="Rolls" />
                        <Text style={[styles.grey, {textAlign: 'center'}]}>Use these tools for rolling dice and doing common tasks within the Hero system.</Text>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                            <View style={styles.buttonContainer}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('Skill')}>
                                    <Text uppercase={false} style={styles.buttonText}>3d6</Text>
                                </Button>
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('Hit')}>
                                    <Text uppercase={false} style={styles.buttonText}>Hit</Text>
                                </Button>
                            </View>
                        </View>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                            <View style={styles.buttonContainer}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('Damage')}>
                                    <Text uppercase={false} style={styles.buttonText}>Damage</Text>
                                </Button>
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('Effect')}>
                                    <Text uppercase={false} style={styles.buttonText}>Effect</Text>
                                </Button>
                            </View>
                        </View>
                        <View style={{paddingBottom: verticalScale(20)}} />
                        <Heading text="Tools" />
                        <Text style={[styles.grey, {textAlign: 'center'}]}>Generate a random 5e character using the Heroic Empowerment Resource Organizer (H.E.R.O.) tool or use the cruncher to calculate power costs.</Text>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                            <View style={[styles.buttonContainer, {paddingBottom: verticalScale(20)}]}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('RandomCharacter')}>
                                    <Text uppercase={false} style={styles.buttonText}>H.E.R.O.</Text>
                                </Button>
                            </View>
                            <View style={[styles.buttonContainer, {paddingBottom: verticalScale(20)}]}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('CostCruncher')}>
                                    <Text uppercase={false} style={styles.buttonText}>Cruncher</Text>
                                </Button>
                            </View>
                        </View>
                        <View style={{paddingBottom: verticalScale(20)}} />
                    </Content>
                </ImageBackground>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        character: state.character.character,
    };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
