import React from 'react';
import PropTypes from 'prop-types';
import {Icon} from 'native-base';
import {scale, verticalScale} from 'react-native-size-matters';
import {Animated} from '../Animated';
import {PARTIAL_DIE_PLUS_ONE} from '../../lib/DieRoller';
import {common} from '../../lib/Common';

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

export const Die = ({roll}) => {
    const dieIcon = getDieIconDetails(roll);

    return (
        <Animated
            animationProps={{
                from: {opacity: 0, translateY: -150},
                animate: {
                    opacity: 1,
                    translateY: 0,
                },
                duration: 3000,
                delay: common.getRandomNumber(0, 250),
            }}
        >
            <Icon solid type="FontAwesome5" name={dieIcon.iconName} style={{fontSize: verticalScale(20), color: dieIcon.color, paddingRight: scale(3.5)}} />
        </Animated>
    );
};

Die.propTypes = {
    roll: PropTypes.number.isRequired,
};
