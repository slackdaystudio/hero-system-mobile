import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Alert, View, ImageBackground } from 'react-native';
import { Container, Content, Button, Spinner, Text } from 'native-base';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import { character } from '../../lib/Character';
import { common } from '../../lib/Common';
import styles from '../../Styles';
import { initializeApplicationSettings } from '../../reducers/settings';
import { initializeStatistics } from '../../reducers/statistics';
import { initializeCharacter, initializeShowSecondary, setCharacter, setShowSecondary } from '../../reducers/character';
import { initializeRandomHero } from '../../reducers/randomHero';
import { initializeCombatDetails, setCombatDetails } from '../../reducers/combat';
import { initializeSounds } from '../../reducers/sounds';

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
        initializeSounds: PropTypes.func.isRequired,
        initializeApplicationSettings: PropTypes.func.isRequired,
        initializeStatistics: PropTypes.func.isRequired,
        initializeCharacter: PropTypes.func.isRequired,
        initializeRandomHero: PropTypes.func.isRequired,
        initializeCombatDetails: PropTypes.func.isRequired,
        setShowSecondary: PropTypes.func.isRequired,
        setCharacter: PropTypes.func.isRequired,
        setCombatDetails: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            characterLoading: false,
        };

        this.startLoad = this._startLoad.bind(this);
        this.endLoad = this._endLoad.bind(this);
        this.onLoadPress = this._onLoadPress.bind(this);
    }

    async componentDidMount() {
        try {
            await this.props.initializeSounds();
            await this.props.initializeApplicationSettings();
            await this.props.initializeStatistics();
            await this.props.initializeCharacter();
            await this.props.initializeShowSecondary();
            await this.props.initializeRandomHero();
            await this.props.initializeCombatDetails(this.props.character);
        } catch (error) {
            common.toast(error.message);
        }
    }

    _startLoad() {
        this.setState({characterLoading: true});
    }

    _endLoad() {
        this.setState({characterLoading: false});
    }

    _loadCharacter() {
        character.load(this.startLoad, this.endLoad).then(char => {
            if (char === null || char === undefined) {
                return;
            }

            this.props.setCharacter(char);
            this.props.setShowSecondary(true);
            this.props.setCombatDetails(char);
        });
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

    _renderViewCharacterButton() {
        if (this.state.characterLoading) {
            return <Spinner color="#D0D1D3" />;
        }

        return (
            <Button style={styles.button} onPress={() => this.onLoadPress()}>
                <Text uppercase={false} style={styles.buttonText}>View</Text>
            </Button>
        );
    }

    render() {
        return (
            <Container style={styles.container}>
                <ImageBackground source={require('../../../public/background.png')} style={{flex: 1}} imageStyle={{ resizeMode: 'cover' }}>
                    <Header navigation={this.props.navigation} />
                    <Content style={styles.content}>
                        <Heading text="Character" />
                        <Text style={[styles.grey, {textAlign: 'center'}]}>Import characters from Hero Designer and take them with you when you&apos;re on the go.</Text>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                            <View style={styles.buttonContainer}>
                                {this._renderViewCharacterButton()}
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button style={styles.button}  onPress={() => this._loadCharacter()}>
                                    <Text uppercase={false} style={styles.buttonText}>Load</Text>
                                </Button>
                            </View>
                        </View>
                        <View style={{paddingBottom: 20}} />
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
                        <View style={{paddingBottom: 20}} />
                        <Heading text="Tools" />
                        <Text style={[styles.grey, {textAlign: 'center'}]}>Generate a random 5e character using the Heroic Empowerment Resource Organizer (H.E.R.O.) tool or use the cruncher to calculate power costs.</Text>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                            <View style={[styles.buttonContainer, {paddingBottom: 20}]}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('RandomCharacter')}>
                                    <Text uppercase={false} style={styles.buttonText}>H.E.R.O.</Text>
                                </Button>
                            </View>
                            <View style={[styles.buttonContainer, {paddingBottom: 20}]}>
                                <Button style={styles.button}  onPress={() => this.props.navigation.navigate('CostCruncher')}>
                                    <Text uppercase={false} style={styles.buttonText}>Cruncher</Text>
                                </Button>
                            </View>
                        </View>
                        <View style={{paddingBottom: 20}} />
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

const mapDispatchToProps = {
    initializeSounds,
    initializeApplicationSettings,
    initializeStatistics,
    initializeCharacter,
    initializeShowSecondary,
    initializeCombatDetails,
    initializeRandomHero,
    setCharacter,
    setShowSecondary,
    setCombatDetails,
};

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
