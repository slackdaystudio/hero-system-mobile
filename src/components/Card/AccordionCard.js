import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import {Card} from './Card';
import {Accordion} from '../Animated';
import styles, {Colors} from '../../Styles';
import {Icon} from '../Icon/Icon';

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

export const BulletedLabel = ({label, onTitlePress, showContent}) => {
    return (
        <TouchableOpacity onPress={onTitlePress}>
            <View flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">
                <Icon
                    size={verticalScale(14)}
                    name={showContent ? 'angle-down' : 'angle-right'}
                    style={{color: Colors.text}}
                    marginRight={scale(5)}
                    marginTop={3}
                />
                <Text style={styles.grey}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
};

export const AccordionCard = ({
    title,
    secondaryTitle,
    content,
    footerButtons,
    showContent,
    outsideBorderWidth = 0.25,
    headingBackgroundColor = false,
    onTitlePress,
}) => {
    const show = showContent === true;

    return (
        <Card
            borderWidth={outsideBorderWidth}
            showHorizontalLine={false}
            headingBackgroundColor={headingBackgroundColor}
            paddingTop={headingBackgroundColor ? verticalScale(5) : verticalScale(0)}
            heading={
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: scale(10),
                        paddingRight: scale(10),
                    }}
                >
                    <View style={{marginRight: verticalScale(10), width: 300}}>
                        <BulletedLabel label={title} onTitlePress={onTitlePress} showContent={showContent} />
                    </View>
                    <View marginLeft={verticalScale(10)} flexDirection="row">
                        {typeof secondaryTitle === 'string' ? (
                            <Text style={[styles.text, {lineHeight: verticalScale(15), fontSize: verticalScale(16)}]}>{secondaryTitle}</Text>
                        ) : (
                            <View paddingLeft={30}>{secondaryTitle}</View>
                        )}
                    </View>
                </View>
            }
            body={
                <Accordion animationProps={{collapsed: !show, duration: 500}}>
                    <View
                        flex={1}
                        marginTop={verticalScale(headingBackgroundColor ? 5 : 0)}
                        marginBottom={show ? verticalScale(10) : 0}
                        paddingHorizontal={scale(10)}
                    >
                        {content}
                    </View>
                    <View flex={1} flexDirection="row" alignSelf="center">
                        {footerButtons === undefined ? null : footerButtons}
                    </View>
                </Accordion>
            }
        />
    );
};
