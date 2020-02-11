import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, StyleSheet, View, Image, Alert } from 'react-native';
import { Container, Content, Button, Text } from 'native-base';
import RNShake from 'react-native-shake';
import AnimateNumber from 'react-native-animate-number';
import { NavigationEvents } from 'react-navigation';
import { ScaledSheet, scale, verticalScale } from 'react-native-size-matters';
import Header from '../Header/Header';
import { dieRoller, SKILL_CHECK, TO_HIT, NORMAL_DAMAGE, KILLING_DAMAGE, EFFECT } from '../../lib/DieRoller';
import { statistics } from '../../lib/Statistics';
import { soundPlayer, DEFAULT_SOUND } from '../../lib/SoundPlayer';
import styles from '../../Styles';
import { addStatistics } from '../../reducers/statistics';

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

class ResultScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        addStatistics: PropTypes.func.isRequired,
        useFifthEdition: PropTypes.bool.isRequired,
        playSounds: PropTypes.bool.isRequired,
        onlyDiceSounds: PropTypes.bool.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            result: props.navigation.state.params.result,
        };

        this.reRoll = this._reRoll.bind(this);
    }

    onDidFocus() {
        this.setState({result: this.props.navigation.state.params.result}, () => {
            this._playSoundClip();
            this._updateStatistics();
        });

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate(this._getBackScreen());

            return true;
        });

        RNShake.addEventListener('ShakeEvent', () => {
            this.reRoll();
        });
    }

    onDidBlur() {
        soundPlayer.stop(this.state.result.sfx);

        this.backHandler.remove();

        RNShake.removeEventListener('ShakeEvent');

        this.props.navigation.state.params = null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.result !== this.state.result) {
            this._playSoundClip();
        }
    }

    _getBackScreen() {
        let backScreen = 'Home';

        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.hasOwnProperty('from')) {
            backScreen = this.props.navigation.state.params.from;
        }

        return backScreen;
    }

    _playSoundClip() {
        if (this.props.playSounds) {
            let soundName = this.props.onlyDiceSounds ? DEFAULT_SOUND : this.state.result.sfx;

            soundPlayer.play(soundName);
        }
    }

    _updateStatistics() {
        if (this.state.result.hasOwnProperty('results')) {
            for (let i = 0; i < this.state.result.results.length; i++) {
                this.props.addStatistics(this.state.result.results[i]);
            }
        } else {
            this.props.addStatistics(this.state.result);
        }
    }

    _reRoll() {
        this.setState({result: dieRoller.rollAgain(this.state.result)}, () => {
            this._updateStatistics();
        });
    }

    _renderToHitInfo(result) {
        if (result.total === 3) {
            return <Text style={styles.grey}>You have critically hit your target</Text>;
        } else if (result.total === 18) {
            return <Text style={styles.grey}>You have missed your target</Text>;
        }

        if (result.isAutofire) {
            if (result.hits > 0) {
                return <Text style={styles.grey}>You can hit your target up to {result.hits}x</Text>;
            } else {
                return <Text style={styles.grey}>You have missed your target with all of your shots</Text>;
            }
        }

        return <Text style={styles.grey}>You can hit a DCV/DMCV of {result.hitCv} or less</Text>;
    }

    _renderHitLocation() {
        if (this.state.result.damageForm.useHitLocations) {
            let hitLocation = this.state.result.hitLocationDetails;

            if (this.state.result.rollType === NORMAL_DAMAGE) {
                return (
                    <Text style={styles.grey}>
                        {hitLocation.location} (NSTUN: x{hitLocation.nStun})
                    </Text>
                );
            } else if (this.state.result.rollType === KILLING_DAMAGE) {
                return (
                    <Text style={styles.grey}>
                        {hitLocation.location} (STUNx: x{hitLocation.stunX}, BODYx: x{hitLocation.bodyX})
                    </Text>
                );
            }
        }

        if (this.state.result.rollType === KILLING_DAMAGE) {
            return <Text style={styles.grey}>x{this.state.result.stunModifier}</Text>;
        }

        return <Text />;
    }

    _renderDamageInfo(result) {
        if (result.damageForm.isExplosion) {
            return (
                <View style={{paddingBottom: verticalScale(20)}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: scale(5)}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Distance</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>STUN</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>BODY</Text></View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>KB</Text></View>
                    </View>
                    {result.explosion.map((entry, index) => {
                        return (
                            <View key={'exp-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: verticalScale(5)}}>
                                <View style={{flex: 1, alignSelf: 'flex-end'}}><Text style={styles.grey}>{this._renderDistance(entry.distance, result)}</Text></View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this._renderStun(entry.stun)}</Text></View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{entry.body}</Text></View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}><Text style={styles.grey}>{this._renderKnockback(entry.knockback, result)}</Text></View>
                            </View>
                        );
                    })}
                </View>
            );
        }

        return (
            <View style={{paddingBottom: verticalScale(20)}}>
                {this._renderHitLocations()}
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Stun: </Text>
                    {this._renderStun(result.stun)}
                </View>
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Body: </Text>
                    <Text style={styles.grey}>{result.body}</Text>
                </View>
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Knockback: </Text>
                    {this._renderKnockback(result.knockback, result)}
                </View>
            </View>
        );
    }

    _renderHitLocations() {
        if (this.state.result.damageForm.useHitLocations) {
            return (
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Hit Location: </Text>
                    {this._renderHitLocation()}
                </View>
            );
        } else if (!this.state.result.damageForm.useHitLocations && this.state.result.rollType === KILLING_DAMAGE) {
            return (
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Stun Multiplier: </Text>
                    {this._renderHitLocation()}
                </View>
            );
        }

        return null;
    }

    _renderSkillCheckInfo(result) {
        let overUnder = result.threshold - result.total;

        if (overUnder >= 0) {
            if (overUnder === 0) {
                return (
                    <Text style={styles.grey}>You made your check with no points to spare</Text>
                );
            }

            return (
                <Text style={styles.grey}>You made your check by {overUnder} points</Text>
            );
        }

        return (
            <Text style={styles.grey}>You <Text style={{color: 'red'}}>failed</Text> your check by {overUnder * -1} points</Text>
        );
    }

    _renderEffectInfo(result) {
        switch (result.type.toUpperCase()) {
            case 'NONE':
                return null;
            case 'AID':
                return <Text style={styles.grey}>You have added {result.total} AP to the target power/effect</Text>;
            case 'DISPEL':
                return <Text style={styles.grey}>You have dispelled {result.total} AP</Text>;
            case 'ENTANGLE':
                return <Text style={styles.grey}>Your entangle has a BODY of {dieRoller.countNormalDamageBody(result)}</Text>;
            case 'FLASH':
            case 'MARTIAL_FLASH':
                return <Text style={styles.grey}>You flashed your target for {dieRoller.countNormalDamageBody(result)} segments</Text>;
            case 'HEALING':
                return <Text style={styles.grey}>You healed your target for {result.total} points</Text>;
            case 'LUCK':
                return <Text style={styles.grey}>You have acquired {dieRoller.countLuck(result)} points of <Text style={{color: 'green'}}>Luck</Text></Text>;
            case 'UNLUCK':
                return <Text style={styles.grey}>You have acquired {dieRoller.countLuck(result)} points of <Text style={{color: 'red'}}>Unluck</Text></Text>;
            default:
                return <Text style={styles.grey}>You have scored {result.total} points on your effect</Text>;
        }
    }

    _renderAdditionalRollInfo(result) {
        if (result.rollType === TO_HIT) {
            return this._renderToHitInfo(result);
        } else if (result.rollType === NORMAL_DAMAGE || result.rollType === KILLING_DAMAGE) {
            return this._renderDamageInfo(result);
        } else if (result.rollType === SKILL_CHECK && result.threshold !== -1) {
            return this._renderSkillCheckInfo(result);
        } else if (result.rollType === EFFECT) {
            return this._renderEffectInfo(result);
        }

        return null;
    }

    _renderDistance(distance, result) {
        let distanceText = '';

        if (this.props.useFifthEdition) {
            distanceText = distance / 2 + '"';
        } else {
            distanceText = distance + 'm';
        }

        return <Text style={styles.grey}>{distanceText}</Text>;
    }

    _renderStun(stun) {
        stun = stun < 0 ? 0 : stun;

        return <Text style={styles.grey}>{stun}</Text>;
    }

    _renderKnockback(knockback, result) {
        knockback = knockback < 0 ? 0 : knockback;
        let knockbackText = '';

        if (this.props.useFifthEdition) {
            knockbackText = knockback / 2 + '"';
        } else {
            knockbackText = knockback + 'm';
        }

        return <Text style={styles.grey}>{knockbackText}</Text>;
    }

    _getRollPercentageColor(percentage) {
        if (this.state.result.rollType === NORMAL_DAMAGE || this.state.result.rollType === KILLING_DAMAGE || this.state.result.rollType === EFFECT) {
            return percentage < 0.0 ? 'red' : 'green';
        }

        return percentage < 0.0 ? 'green' : 'red';
    }

    _renderRoll() {
        if (this.state.result.hasOwnProperty('results')) {
            return this.state.result.results.map((result, index) => {
                let percentage = statistics.getPercentage(result);

                return (
                    <View key={'roll-result-' + index}>
                        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                            <View style={{flex: 1}}>
                                <Text style={[styles.grey, localStyles.rollResult, {alignSelf: 'flex-end'}]}>
                                    <AnimateNumber value={result.total} formatter={(val) => val.toFixed(0)} interval={1} />
                                </Text>
                            </View>
                            <View style={{flex: 1, paddingTop: verticalScale(50)}}>
                                <Text style={{color: this._getRollPercentageColor(percentage), fontSize: 40}}>
                                    <AnimateNumber value={percentage} formatter={(val) => val < 0.0 ? `${val.toFixed(1)}%` : `+${val.toFixed(1)}%`} />
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Dice Rolled: </Text>{result.rolls.length} ({result.rolls.join(', ')})
                        </Text>
                        <Text style={styles.grey}>
                            <Text style={styles.boldGrey}>Partial Die: </Text>{dieRoller.getPartialDieName(result.partialDieType)}
                        </Text>
                        {this._renderAdditionalRollInfo(result)}
                    </View>
                );
            });
        }

        let percentage = statistics.getPercentage(this.state.result);

        return (
            <View>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <View style={{flex: 1}}>
                        <Text style={[styles.grey, localStyles.rollResult, {alignSelf: 'flex-end'}]}>
                            <AnimateNumber value={this.state.result.total} formatter={(val) => val.toFixed(0)} />
                        </Text>
                    </View>
                    <View style={{flex: 1, paddingTop: verticalScale(50)}}>
                        <Text style={{color: this._getRollPercentageColor(percentage), fontSize: 40}}>
                            <AnimateNumber value={percentage} formatter={(val) => val < 0.0 ? `${val.toFixed(1)}%` : `+${val.toFixed(1)}%`} />
                        </Text>
                    </View>
                </View>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Dice Rolled: </Text>{this.state.result.rolls.length} ({this.state.result.rolls.join(', ')})
                </Text>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Partial Die: </Text>{dieRoller.getPartialDieName(this.state.result.partialDieType)}
                </Text>
                {this._renderAdditionalRollInfo(this.state.result)}
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
                <Header navigation={this.props.navigation} backScreen={this._getBackScreen()} />
                <Content style={styles.content}>
                    <Text style={styles.heading}>Roll Result</Text>
                    <View>
                        {this._renderRoll()}
                        <View style={styles.buttonContainer}>
                            <Button block style={styles.button}  onPress={this.reRoll}>
                                <Text uppercase={false}>Roll Again</Text>
                            </Button>
                        </View>
                    </View>
                </Content>
            </Container>
        );
    }
}

const localStyles = ScaledSheet.create({
    rollResult: {
        fontSize: '100@vs',
        fontWeight: 'bold',
    },
    lineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    alignStart: {
        alignSelf: 'flex-start',
    },
});

const mapStateToProps = state => {
    return {
        useFifthEdition: state.settings.useFifthEdition,
        playSounds: state.settings.playSounds,
        onlyDiceSounds: state.settings.onlyDiceSounds,
    }
};

const mapDispatchToProps = {
    addStatistics,
};

export default connect(mapStateToProps, mapDispatchToProps)(ResultScreen);
