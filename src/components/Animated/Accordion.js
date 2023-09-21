import React from 'react';
import PropTypes from 'prop-types';
import Collapsible from 'react-native-collapsible';
import {Animated} from './Animated';

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

export const Accordion = ({animationProps, children}) => {
    return (
        <Collapsible {...animationProps}>
            <Animated animationProps={{from: {opacity: 0, translateY: -10}, to: {opacity: 1, translateY: 0}, animate: {opacity: 1, translateY: 0}}}>
                {children}
            </Animated>
        </Collapsible>
    );
};

Accordion.propTypes = {
    animationProps: PropTypes.object.isRequired,
};
