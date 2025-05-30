import React from 'react';
import {useSelector} from 'react-redux';
import {MotiView, useAnimationState} from 'moti';
import {getRandomNumber} from '../../../App';
import {ReduceMotion} from 'react-native-reanimated';

// Copyright (C) Slack Day Studio - All Rights Reserved
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

export const useSlideInLeft = () => {
    return useAnimationState({
        from: {
            opacity: 0,
            translateX: -100,
        },
        to: {
            opacity: 1,
            translateX: 0,
        },
        animate: {
            opacity: 1,
            translateX: 0,
        },
    });
};

export const useSlideInRight = () => {
    return useAnimationState({
        from: {
            opacity: 0,
            translateX: 100,
        },
        to: {
            opacity: 1,
            translateX: 0,
        },
        animate: {
            opacity: 1,
            translateX: 0,
        },
    });
};

export const useSlideInDown = () => {
    return useAnimationState({
        from: {
            opacity: 0,
            translateY: -100,
        },
        to: {
            opacity: 1,
            translateY: 0,
        },
        animate: {
            opacity: 1,
            translateY: 0,
        },
    });
};

export const useSlideInUp = () => {
    return useAnimationState({
        from: {
            opacity: 0,
            translateY: 100,
        },
        to: {
            opacity: 1,
            translateY: 0,
        },
        animate: {
            opacity: 1,
            translateY: 0,
        },
    });
};

export const useScaleInUp = () => {
    return useAnimationState({
        from: {
            scale: 0.1,
        },
        to: {
            scale: 1,
        },
        animate: {
            scale: 1,
        },
    });
};

export const useFlip = () => {
    const rotations = getRandomNumber(5, 20);

    return useAnimationState({
        from: {
            rotateX: `${180 * rotations}deg`,
        },
        animate: {
            rotateX: '0deg',
        },
        transition: {
            rotateX: {
                type: 'timing',
                duration: rotations * 50,
                dampingRatio: 0.5,
                stiffness: 100,
                overshootClamping: false,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 2,
                reduceMotion: ReduceMotion.System,
            },
        },
    });
};

export const Animated = ({animationProps, children}) => {
    const showAnimations = useSelector((state) => state.settings.showAnimations);

    if (showAnimations) {
        return <MotiView {...animationProps}>{children}</MotiView>;
    }

    return <>{children}</>;
};
