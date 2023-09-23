import React from 'react';
import PropTypes from 'prop-types';
import {View, Text} from 'react-native';
import {verticalScale} from 'react-native-size-matters';
import {Card} from './Card';
import {Accordion} from '../Animated';
import {styles} from '../../Styles';

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

export const AccordionCard = ({title, secondaryTitle, content, footerButtons, showContent}) => {
    return (
        <Card
            heading={
                <View style={{flex: 1, flexDirection: 'row', alignSelf: 'center', justifyContent: 'space-between'}}>
                    <View>{title}</View>
                    <View>
                        {typeof secondaryTitle === 'string' ? (
                            <Text style={[styles.text, {lineHeight: verticalScale(50), fontSize: verticalScale(16)}]}>{secondaryTitle}</Text>
                        ) : (
                            <>{secondaryTitle}</>
                        )}
                    </View>
                </View>
            }
            body={
                <Accordion animationProps={{collapsed: !showContent, duration: 500}}>
                    <View flex={1} marginBottom={showContent ? verticalScale(10) : 0}>
                        {content}
                    </View>
                </Accordion>
            }
            footer={footerButtons === undefined ? null : footerButtons}
        />
    );
};

AccordionCard.propTypes = {
    title: PropTypes.object.isRequired,
    secondaryTitle: PropTypes.object.isRequired,
    content: PropTypes.object,
    footerButtons: PropTypes.object,
    showContent: PropTypes.bool,
};

AccordionCard.defaultProps = {
    showContent: false,
};
