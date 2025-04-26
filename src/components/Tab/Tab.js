import React from 'react';
import {ActivityIndicator, ScrollView, View, Animated, Pressable, FlatList} from 'react-native';
import {verticalScale, scale} from 'react-native-size-matters';
import {Heading} from '../Heading/Heading';
import {common} from '../../lib/Common';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

export const RouteBuilder = (headingText, tab, Colors, showSpinner = false) => {
    if (showSpinner) {
        return (
            <>
                <Heading text={headingText} />
                <ActivityIndicator color={Colors.text} />
            </>
        );
    }

    if (common.isEmptyObject(tab)) {
        return <View flex={0} flexGrow={1} />;
    }

    return (
        <ScrollView contentContainerStyle={{flexBasis: 'auto', flexGrow: 1, backgroundColor: Colors.background}}>
            <View flex={1}>{tab}</View>
        </ScrollView>
    );
};

export const Tab = ({navigationState}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {Colors} = useColorTheme(scheme);

    const _renderItem = (item, _i) => {
        const color = navigationState.index === item.index ? Colors.text : Colors.lighText;
        const borderBottomWidth = navigationState.index === item.index ? 5 : 1;

        return (
            <View
                key={item.item.id}
                borderBottomWidth={borderBottomWidth}
                borderColor={color}
                alignSelf="center"
                cursor="pointer"
                paddingHorizontal={scale(10)}
            >
                <Pressable onPress={() => navigationState.setIndex(item.index)} style={{minHeight: verticalScale(40), paddingTop: verticalScale(10)}}>
                    <Animated.Text
                        style={{color, fontVariant: 'small-caps', fontFamily: 'Roboto', fontSize: verticalScale(12), lineHeight: verticalScale(15 * 1.35)}}
                    >
                        {item.item.title}
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
        <View alignItems="center" backgroundColor={Colors.background}>
            <FlatList
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={true}
                legacyImplementation={false}
                data={data}
                renderItem={(item, i) => _renderItem(item, i)}
                keyExtractor={(item) => item.id}
                style={{backgroundColor: Colors.background, maxHeight: verticalScale(45)}}
                contentContainerStyle={{
                    alignSelf: 'center',
                    justifyContent: 'space-around',
                }}
            />
        </View>
    );
};
