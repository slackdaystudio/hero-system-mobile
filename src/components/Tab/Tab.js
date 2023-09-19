import React from 'react';
import PropTypes from 'prop-types';
import {ScrollView, View, Animated, Pressable, FlatList} from 'react-native';
import {Spinner} from 'native-base';
import {verticalScale, scale} from 'react-native-size-matters';
import Heading from '../Heading/Heading';

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
        <ScrollView contentContainerStyle={{flexGrow: 1, backgroundColor: '#1b1d1f'}}>
            <View flex={1}>{tab}</View>
        </ScrollView>
    );
};

export const Tab = ({navigationState}) => {
    const _renderItem = (item, _i) => {
        const color = navigationState.index === item.index ? '#F3EDE9' : 'rgba(193, 235, 255, 0.4)';
        const borderBottomWidth = navigationState.index === item.index ? 5 : 1;

        return (
            <View
                key={item.item.id}
                borderBottomWidth={borderBottomWidth}
                borderColor={color}
                alignItems="center"
                cursor="pointer"
                paddingHorizontal={scale(10)}
            >
                <Pressable onPress={() => navigationState.setIndex(item.index)} style={{minHeight: verticalScale(40), paddingTop: verticalScale(10)}}>
                    <Animated.Text style={{color, fontSize: verticalScale(12), lineHeight: verticalScale(15 * 1.35)}}>
                        {item.item.title.toUpperCase()}
                    </Animated.Text>
                </Pressable>
            </View>
        );
    };

    let routes = navigationState.routes;

    if (typeof routes === 'function') {
        routes = routes();
    }

    const data = routes.map((route) => {
        return {
            id: route.key,
            title: route.title,
        };
    });

    return (
        <View alignSelf="stretch" alignItems="center" backgroundColor="#1b1d1f">
            <FlatList
                backgroundColor={'#1b1d1f'}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={true}
                legacyImplementation={false}
                data={data}
                renderItem={(item, i) => _renderItem(item, i)}
                keyExtractor={(item) => item.id}
                style={{fontSize: verticalScale(30), backgroundColor: '#1b1d1f'}}
                contentContainerStyle={{
                    alignSelf: 'center',
                    justifyContent: 'space-around',
                    backgroundColor: '#1b1d1f',
                }}
            />
        </View>
    );
};

Tab.propTypes = {
    navigationState: PropTypes.object.isRequired,
};
