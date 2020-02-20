import React, { Component }  from 'react';
import PropTypes from 'prop-types'
import { StyleSheet, View, TouchableHighlight, Switch } from 'react-native';
import { Container, Content, Button, Text, Item, Input, Picker, Form, Label, Icon } from 'native-base';
import Modal from 'react-native-modal';
import { ScaledSheet, verticalScale } from 'react-native-size-matters';
import styles from '../../Styles';

export default class HostGameDialog extends Component {
    static propTypes = {
        visible: PropTypes.bool.isRequired,
        username: PropTypes.string,
        updateUsername: PropTypes.func.isRequired,
        onSave: PropTypes.func.isRequired,
        onClose: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            errorMessage: null
        }
    }

    _save() {
        if (this.props.username === null || this.props.username.length < 2) {
            this.setState({errorMessage: 'Please supply a username of at least 2 characters'});

            return;
        }

        this.setState({errorMessage: null}, () => {
            this.props.onSave();
        });
    }

    _close() {
        this.setState({errorMessage: null}, () => {
            this.props.onClose();
        });
    }

    _renderErrorMessage() {
        if (this.state.errorMessage === null) {
            return null;
        }

        return (
            <View style={localStyles.errorMessage}>
                <Text style={{color: '#bc1212', alignSelf: 'center'}}>{this.state.errorMessage}</Text>
            </View>
        );
    }

    render() {
        return (
            <Modal
                isVisible={this.props.visible}
                swipeDirection={'right'}
                onSwipeComplete={() => this.props.onClose()}
                onBackButtonPress={() => this.props.onClose()}
                onBackdropPress={() => this.props.onClose()}
            >
                <View style={styles.modal}>
                    <Text style={styles.modalHeader}>Host Game</Text>
                    <View style={styles.modalContent}>
                        {this._renderErrorMessage()}
                        <Text style={styles.grey}>Please supply a username.  Your username should be unique and will be shown to players.</Text>
                        <Form style={{paddingBottom: verticalScale(15)}}>
                            <Item inlineLabel style={{marginLeft: 0}}>
                                <Label style={styles.grey}>Username:</Label>
                                <Input
                                    style={styles.grey}
                                    maxLength={32}
                                    value={this.props.username}
                                    onChangeText={(value) => this.props.updateUsername(value)}
                                />
                            </Item>
                        </Form>
                        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: verticalScale(30)}}>
                            <Button style={styles.button} onPress={() => this._save()}>
                                <Text uppercase={false} style={styles.buttonText}>Start Game</Text>
                            </Button>
                            <Button style={styles.button} onPress={() => this._close()}>
                                <Text uppercase={false} style={styles.buttonText}>Cancel</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
}

const localStyles = ScaledSheet.create({
    errorMessage: {
        borderWidth: 1,
        borderRadius: 4,
        padding: '5@s',
        borderColor: '#bc1212',
        backgroundColor: '#e8b9b9',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        fontSize: '20@vs',
        lineHeight: '25@vs'
    },
});
