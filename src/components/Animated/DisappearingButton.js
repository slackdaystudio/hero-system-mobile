import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import {Text, View} from 'react-native';
import {Button} from 'native-base';
import {useAnimationState} from 'moti';
import {useFocusEffect} from '@react-navigation/native';
import {Animated} from '.';
import styles from '../../Styles';

const DISABLED_OPACITY = 0.5;

const ENABLED_OPACITY = 1.0;

export const DisappearingButton = ({label, onPress, delay, animationProps}) => {
    const [isDisabled, setIsDisabled] = useState(true);

    const animationState = useAnimationState(animationProps);

    const [opacity, setOpacity] = useState(DISABLED_OPACITY);

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
                    <Button block disabled={isDisabled} style={[styles.button, {opacity: opacity}]} onPress={restart}>
                        <Text style={[styles.grey, {opacity: opacity}]} uppercase={false}>
                            {label}
                        </Text>
                    </Button>
                </View>
            }
        </Animated>
    );
};

DisappearingButton.propTypes = {
    animationProps: PropTypes.object.isRequired,
    onPress: PropTypes.func.isRequired,
    delay: PropTypes.number,
};

DisappearingButton.defaultProps = {
    animationProps: {
        from: {
            opacity: 0,
        },
        to: {
            opacity: 1,
        },
    },
    delay: 2000,
};
