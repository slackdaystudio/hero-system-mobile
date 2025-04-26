import React, {useState, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {ActivityIndicator, Platform, Text, View} from 'react-native';
import {CountUp} from 'use-count-up';
import {ScaledSheet, scale, verticalScale} from 'react-native-size-matters';
import {Header} from '../Header/Header';
import {VirtualizedList} from '../VirtualizedList/VirtualizedList';
import {Die, DisappearingButton} from '../Animated';
import {dieRoller, SKILL_CHECK, TO_HIT, NORMAL_DAMAGE, KILLING_DAMAGE, EFFECT, PARTIAL_DIE_PLUS_ONE} from '../../lib/DieRoller';
import {statistics} from '../../lib/Statistics';
import {common} from '../../lib/Common';
import {soundPlayer, DEFAULT_SOUND} from '../../lib/SoundPlayer';
import {useColorTheme} from '../../hooks/useColorTheme';

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

export const ResultScreen = ({route, navigation}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    const playSounds = useSelector((state) => state.settings.playSounds);

    const onlyDiceSounds = useSelector((state) => state.settings.onlyDiceSounds);

    const useFifthEdition = useSelector((state) => state.settings.useFifthEdition);

    const [result, setResult] = useState(route.params.result);

    useFocusEffect(
        useCallback(() => {
            if (route.params !== undefined && route.params.hasOwnProperty('result')) {
                setResult(route.params.result);

                playSoundClip();
            }
        }, [playSoundClip, route.params]),
    );

    const playSoundClip = useCallback(() => {
        if (!common.isEmptyObject(result) && playSounds) {
            const soundName = onlyDiceSounds ? DEFAULT_SOUND : result.sfx;

            soundPlayer.play(soundName);
        }
    }, [onlyDiceSounds, playSounds, result]);

    const reRoll = () => {
        setResult(dieRoller.rollAgain(result));

        playSoundClip();
    };

    const renderToHitInfo = (hitResult) => {
        if (hitResult.total === 3) {
            return <Text style={styles.grey}>You have critically hit your target</Text>;
        } else if (hitResult.total === 18) {
            return <Text style={styles.grey}>You have missed your target</Text>;
        }

        if (result.isAutofire) {
            if (hitResult.hits > 0) {
                return <Text style={styles.grey}>You can hit your target up to {hitResult.hits}x</Text>;
            } else {
                return <Text style={styles.grey}>You have missed your target with all of your shots</Text>;
            }
        }

        return <Text style={styles.grey}>You can hit a DCV/DMCV of {hitResult.hitCv} or less</Text>;
    };

    const renderHitLocation = () => {
        if (result.damageForm.useHitLocations) {
            let hitLocation = result.hitLocationDetails;

            if (result.rollType === NORMAL_DAMAGE) {
                return (
                    <Text style={styles.grey}>
                        {hitLocation.location} (NSTUN: x{hitLocation.nStun})
                    </Text>
                );
            } else if (result.rollType === KILLING_DAMAGE) {
                return (
                    <Text style={styles.grey}>
                        {hitLocation.location} (STUNx: x{hitLocation.stunX}, BODYx: x{hitLocation.bodyX})
                    </Text>
                );
            }
        }

        if (result.rollType === KILLING_DAMAGE) {
            return <Text style={styles.grey}>x{result.stunModifier}</Text>;
        }

        return <Text />;
    };

    const renderDamageInfo = (rollResult) => {
        if (rollResult.damageForm.isExplosion) {
            return (
                <View style={{paddingBottom: verticalScale(20)}}>
                    <View style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingVertical: scale(5)}}>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>Distance</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>STUN</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>BODY</Text>
                        </View>
                        <View style={{flex: 1, alignSelf: 'stretch'}}>
                            <Text style={[styles.boldGrey, {textDecorationLine: 'underline'}]}>KB</Text>
                        </View>
                    </View>
                    {rollResult.explosion.map((entry, index) => {
                        return (
                            <View key={'exp-' + index} style={{flex: 1, flexDirection: 'row', alignSelf: 'stretch', paddingTop: verticalScale(5)}}>
                                <View style={{flex: 1, alignSelf: 'flex-end'}}>
                                    <Text style={styles.grey}>{renderDistance(entry.distance, rollResult)}</Text>
                                </View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{renderStun(entry.stun)}</Text>
                                </View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{entry.body}</Text>
                                </View>
                                <View style={{flex: 1, alignSelf: 'stretch'}}>
                                    <Text style={styles.grey}>{renderKnockback(entry.knockback, rollResult)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            );
        }

        return (
            <View style={{paddingBottom: verticalScale(20)}}>
                {renderHitLocations()}
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Stun: </Text>
                    {renderStun(result.stun)}
                </View>
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Body: </Text>
                    <Text style={styles.grey}>{result.body}</Text>
                </View>
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Knockback: </Text>
                    {renderKnockback(result.knockback, result)}
                </View>
            </View>
        );
    };

    const renderHitLocations = () => {
        if (result.damageForm.useHitLocations) {
            return (
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Hit Location: </Text>
                    {renderHitLocation()}
                </View>
            );
        } else if (!result.damageForm.useHitLocations && result.rollType === KILLING_DAMAGE) {
            return (
                <View style={localStyles.lineContainer}>
                    <Text style={[styles.boldGrey, localStyles.alignStart]}>Stun Multiplier: </Text>
                    {renderHitLocation()}
                </View>
            );
        }

        return null;
    };

    const renderSkillCheckInfo = (rollResult) => {
        let overUnder = rollResult.threshold - rollResult.total;

        if (overUnder >= 0) {
            if (overUnder === 0) {
                return <Text style={styles.grey}>You made your check with no points to spare</Text>;
            }

            return <Text style={styles.grey}>You made your check by {overUnder} points</Text>;
        }

        return (
            <Text style={styles.grey}>
                You <Text style={{color: 'red'}}>failed</Text> your check by {overUnder * -1} points
            </Text>
        );
    };

    const renderEffectInfo = (rollResult) => {
        switch (rollResult.effectForm.effectType?.toUpperCase() || 'NONE') {
            case 'NONE':
                return null;
            case 'AID':
            case 'SUCCOR':
                return <Text style={styles.grey}>You have added {rollResult.total} AP to the target power/effect</Text>;
            case 'DISPEL':
                return <Text style={styles.grey}>You have dispelled {rollResult.total} AP</Text>;
            case 'DRAIN':
                return <Text style={styles.grey}>You have subtracted {rollResult.total} AP</Text>;
            case 'ENTANGLE':
                return <Text style={styles.grey}>Your entangle has a BODY of {dieRoller.countNormalDamageBody(rollResult)}</Text>;
            case 'FLASH':
            case 'MARTIAL_FLASH':
                return <Text style={styles.grey}>You flashed your target for {dieRoller.countNormalDamageBody(rollResult)} segments</Text>;
            case 'HEALING':
                return <Text style={styles.grey}>You healed your target for {rollResult.total} points</Text>;
            case 'LUCK':
                return (
                    <Text style={styles.grey}>
                        You have acquired {dieRoller.countLuck(rollResult)} points of <Text style={{color: 'green'}}>Luck</Text>
                    </Text>
                );
            case 'UNLUCK':
                return (
                    <Text style={styles.grey}>
                        You have acquired {dieRoller.countLuck(rollResult)} points of <Text style={{color: 'red'}}>Unluck</Text>
                    </Text>
                );
            default:
                return <Text style={styles.grey}>You have scored {rollResult.total} points on your effect</Text>;
        }
    };

    const renderAdditionalRollInfo = (rollResult) => {
        if (rollResult.rollType === TO_HIT) {
            return renderToHitInfo(rollResult);
        } else if (rollResult.rollType === NORMAL_DAMAGE || rollResult.rollType === KILLING_DAMAGE) {
            return renderDamageInfo(result);
        } else if (rollResult.rollType === SKILL_CHECK && rollResult.threshold !== -1) {
            return renderSkillCheckInfo(rollResult);
        } else if (rollResult.rollType === EFFECT) {
            return renderEffectInfo(result);
        }

        return null;
    };

    const renderDistance = (distance) => {
        let distanceText = '';

        if (useFifthEdition) {
            distanceText = distance / 2 + '"';
        } else {
            distanceText = distance + 'm';
        }

        return <Text style={styles.grey}>{distanceText}</Text>;
    };

    const renderStun = (stun) => {
        stun = stun < 0 ? 0 : stun;

        return <Text style={styles.grey}>{stun}</Text>;
    };

    const renderKnockback = (knockback) => {
        knockback = knockback < 0 ? 0 : knockback;
        let knockbackText = '';

        if (useFifthEdition) {
            knockbackText = knockback / 2 + '"';
        } else {
            knockbackText = knockback + 'm';
        }

        return <Text style={styles.grey}>{knockbackText}</Text>;
    };

    const getRollPercentageColor = (percentage) => {
        if (result.rollType === NORMAL_DAMAGE || result.rollType === KILLING_DAMAGE || result.rollType === EFFECT) {
            return percentage < 0.0 ? 'red' : 'green';
        }

        return percentage < 0.0 ? 'green' : 'red';
    };

    const renderDice = (rollResult) => {
        const percentage = statistics.getPercentage(rollResult);

        return (
            <View key={`roll-result-${Math.random()}`}>
                <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                    <View style={{flex: -1}}>
                        <Text style={[styles.grey, localStyles.rollResult]}>
                            <CountUp isCounting end={rollResult.total} key={rollResult.total} formatter={(val) => val.toFixed(0)} />
                        </Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text
                            style={{
                                color: getRollPercentageColor(percentage),
                                fontSize: verticalScale(30),
                                paddingBottom: Platform.OS === 'ios' ? 0 : verticalScale(13),
                            }}
                        >
                            <CountUp
                                isCounting
                                end={percentage}
                                key={percentage}
                                formatter={(val) => (val < 0.0 ? `${val.toFixed(1)}%` : `+${val.toFixed(1)}%`)}
                            />
                        </Text>
                    </View>
                </View>
                <View flexDirection="row" flexWrap="wrap" paddingBottom={verticalScale(5)}>
                    {rollResult.rolls.map((roll, i) => {
                        return (
                            <Die
                                key={`die-${Math.random()}`}
                                roll={roll}
                                partialDieType={rollResult.partialDieType}
                                isLast={i === rollResult.rolls.length - 1}
                            />
                        );
                    })}
                </View>
                <Text style={styles.grey}>
                    <Text style={styles.boldGrey}>Dice Rolled: </Text>
                    {rollResult.partialDieType > PARTIAL_DIE_PLUS_ONE ? `${rollResult.rolls.length - 1}+1` : rollResult.rolls.length}
                </Text>
                {rollResult.partialDieType > 0 ? (
                    <Text style={styles.grey}>
                        <Text style={styles.boldGrey}>Partial Die: </Text>
                        {dieRoller.getPartialDieName(rollResult.partialDieType)}
                    </Text>
                ) : null}
                {renderAdditionalRollInfo(rollResult)}
            </View>
        );
    };

    const renderRoll = () => {
        if (common.isEmptyObject(result)) {
            return <ActivityIndicator color="#D0D1D3" />;
        }

        if (result.hasOwnProperty('results')) {
            return result.results.map((r) => renderDice(r));
        }

        return renderDice(result);
    };

    return (
        <>
            <Header navigation={navigation} />
            <VirtualizedList>
                <Text style={styles.heading}>Roll Result</Text>
                <View justifyContent="center" paddingHorizontal={scale(10)}>
                    {renderRoll()}
                    <DisappearingButton label="Roll Again" onPress={reRoll} />
                </View>
            </VirtualizedList>
        </>
    );
};

const localStyles = ScaledSheet.create({
    rollResult: {
        fontSize: '80@vs',
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
