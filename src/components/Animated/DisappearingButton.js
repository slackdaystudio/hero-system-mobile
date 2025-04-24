import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {useAnimationState} from 'moti';
import {useFocusEffect} from '@react-navigation/native';
import {Button} from '../Button/Button';
import {Animated} from '.';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

const DISABLED_OPACITY = 0.5;

const ENABLED_OPACITY = 1.0;

const DEFAULT_ANIMATION_PROPS = {
    from: {
        opacity: 0,
    },
    to: {
        opacity: 1,
    },
};

export const DisappearingButton = ({label, onPress, delay = 2000, animationProps = DEFAULT_ANIMATION_PROPS}) => {
    const [isDisabled, setIsDisabled] = useState(true);

    const animationState = useAnimationState(animationProps);

    const [opacity, setOpacity] = useState(DISABLED_OPACITY);

    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    useFocusEffect(
        useCallback(() => {
            setOpacity(DISABLED_OPACITY);
            setIsDisabled(true);

            animationState.transitionTo('from');

            const timeout = setTimeout(() => {
                if (animationState.current === 'from') {
                    animationState.transitionTo('to');

                    setOpacity(ENABLED_OPACITY);
                    setIsDisabled(false);
                }
            }, delay);

            return () => clearTimeout(timeout);
        }, [delay, animationState]),
    );

    const restart = () => {
        if (animationState.current === 'to') {
            setOpacity(DISABLED_OPACITY);
            setIsDisabled(true);

            animationState.transitionTo('from');
        }

        setTimeout(() => {
            if (animationState.current === 'from') {
                animationState.transitionTo('to');

                setOpacity(ENABLED_OPACITY);
                setIsDisabled(false);
            }
        }, delay);

        onPress();
    };

    return (
        <Animated animationProps={{state: animationState}}>
            {
                <View style={styles.buttonContainer}>
                    <Button label={label} disabled={isDisabled} style={[styles.button, {opacity: opacity}]} onPress={restart} />
                </View>
            }
        </Animated>
    );
};

DisappearingButton.propTypes = {
    animationProps: PropTypes.object,
    onPress: PropTypes.func.isRequired,
    delay: PropTypes.number,
};
