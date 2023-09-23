import React from 'react';
import PropTypes from 'prop-types';
import {Icon} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
import {PARTIAL_DIE_PLUS_ONE} from '../../lib/DieRoller';
import {getRandomNumber} from '../../../App';
import {MotiView, useAnimationState} from 'moti';
import {useSelector} from 'react-redux';

const getDieIconDetails = (face, partialDieType, isLast) => {
    let color = partialDieType > PARTIAL_DIE_PLUS_ONE && isLast ? '#f2de00' : '#ffffff';
    let iconName = null;

    switch (parseInt(face, 10)) {
        case 2:
            iconName = 'dice-two';
            break;
        case 3:
            iconName = 'dice-three';
            break;
        case 4:
            iconName = 'dice-four';
            break;
        case 5:
            iconName = 'dice-five';
            break;
        case 6:
            iconName = 'dice-six';
            break;
        default:
            iconName = 'dice-one';
    }

    return {
        iconName,
        color,
    };
};

export const Die = ({roll, partialDieType, isLast}) => {
    const showAnimations = useSelector((state) => state.settings.showAnimations);
    const dieIcon = getDieIconDetails(roll, partialDieType, isLast);
    const dieState = useAnimationState({
        from: {translateY: verticalScale(-200)},
        to: {
            translateY: 0,
        },
    });

    const getDie = () => {
        return <Icon solid type="FontAwesome5" name={dieIcon.iconName} style={{fontSize: verticalScale(20), color: dieIcon.color, paddingRight: scale(3.5)}} />;
    };

    if (showAnimations) {
        return (
            <MotiView
                transition={{
                    duration: 3000,
                    delay: getRandomNumber(0, 250, 1, false),
                }}
                state={dieState}
            >
                {getDie()}
            </MotiView>
        );
    } else {
        return getDie();
    }
};

Die.propTypes = {
    roll: PropTypes.number.isRequired,
    partialDieType: PropTypes.number.isRequired,
    isLast: PropTypes.bool.isRequired,
};
