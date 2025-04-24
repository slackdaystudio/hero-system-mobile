import React, {useRef, useState} from 'react';
import {View, Text, ScrollView} from 'react-native';
import Modal from 'react-native-modal';
import {verticalScale} from 'react-native-size-matters';
import {Button} from '../Button/Button';
import {useSelector} from 'react-redux';
import {useColorTheme} from '../../hooks/useColorTheme';

export const ConfirmationDialog = ({visible, title, info, onOk, onClose}) => {
    const scheme = useSelector((state) => state.settings.colorScheme);

    const {styles} = useColorTheme(scheme);

    // eslint-disable-next-line no-unused-vars
    const [_scrollOffset, setScrollOffset] = useState(0);

    const scrollViewRef = useRef();

    const _handleOnScroll = (event) => {
        setScrollOffset(event.nativeEvent.contentOffset.y);
    };

    const _handleScrollTo = (p) => {
        if (scrollViewRef) {
            scrollViewRef.scrollTo(p);
        }
    };

    const _renderOkButton = () => {
        if (typeof onOk === 'function') {
            return (
                <View style={styles.buttonContainer}>
                    <Button label={title} style={styles.button} onPress={() => onOk()} />
                </View>
            );
        }

        return null;
    };

    return (
        <Modal isVisible={visible} onBackButtonPress={() => onClose()} onBackdropPress={() => onClose()} scrollTo={_handleScrollTo} scrollOffsetMax={300 - 200}>
            <View style={styles.modal}>
                <Text style={styles.modalHeader}>{title}</Text>
                <View style={[styles.modalContent, {minHeight: verticalScale(170)}]}>
                    <ScrollView ref={scrollViewRef.current} onScroll={_handleOnScroll} scrollEventThrottle={16}>
                        <Text style={styles.grey}>{info}</Text>
                    </ScrollView>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        {_renderOkButton()}
                        <View style={styles.buttonContainer}>
                            <Button label={onOk === null ? 'OK' : 'Cancel'} style={styles.button} onPress={() => onClose()} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
