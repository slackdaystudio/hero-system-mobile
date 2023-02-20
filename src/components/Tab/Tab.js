import React from 'react';
import PropTypes from 'prop-types';
import {Animated, Pressable, FlatList} from 'react-native';
import {Box, ScrollView, Spinner} from 'native-base';
import {verticalScale, scale} from 'react-native-size-matters';
import {Heading} from '../Heading/Heading';
export const RouteBuilder = (headingText, tab, showSpinner = false) => {
    if (showSpinner) {
        return (
            <>
                <Heading text={headingText} />
                <Spinner color={'#F3EDE9'} />
            </>
        );
    }

    return (
        <>
            <ScrollView contentContainerStyle={{flexGrow: 1}}>
                <Heading text={headingText} />
                <Box flex={1}>{tab}</Box>
            </ScrollView>
        </>
    );
};

export const Tab = ({navigationState}) => {
    const _renderItem = (item, _i) => {
        const color = navigationState.index === item.index ? '#F3EDE9' : 'rgba(193, 235, 255, 0.4)';

        return (
            <Box key={item.item.id} borderBottomWidth="3" borderColor={color} alignItems="center" cursor="pointer" paddingHorizontal={scale(10)}>
                <Pressable onPress={() => navigationState.setIndex(item.index)}>
                    <Animated.Text style={{color}}>{item.item.title}</Animated.Text>
                </Pressable>
            </Box>
        );
    };

    const data = navigationState.routes.map((route) => {
        return {
            id: route.key,
            title: route.title,
        };
    });

    return (
        <Box w="100%" alignSelf="center" alignItems="center" maxHeight={verticalScale(40)} backgroundColor={'#1b1d1f'}>
            <FlatList
                backgroundColor={'#1b1d1f'}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={true}
                legacyImplementation={false}
                data={data}
                renderItem={(item, i) => _renderItem(item, i)}
                keyExtractor={(item) => item.id}
                style={{backgroundColor: '#1b1d1f'}}
                contentContainerStyle={{alignSelf: 'center', justifyContent: 'space-around', backgroundColor: '#1b1d1f'}}
            />
        </Box>
    );
};

Tab.propTypes = {
    navigationState: PropTypes.object.isRequired,
};
