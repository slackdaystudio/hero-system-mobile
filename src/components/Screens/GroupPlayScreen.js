import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Platform, BackHandler, Alert, View, ScrollView } from 'react-native';
import { Container, Content, Button, Spinner, Text, Form, Item, Label, Input, Picker } from 'native-base';
import { scale, verticalScale } from 'react-native-size-matters';
import { NavigationEvents } from 'react-navigation';
import { NetworkInfo } from 'react-native-network-info';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import HostGameDialog from '../GroupPlayDialogs/HostGameDialog';
import JoinGameDialog from '../GroupPlayDialogs/JoinGameDialog';
import { common } from '../../lib/Common';
import { leaveGame, stopGame } from '../../../App';
import { groupPlayServer, PLAYER_OPTION_ALL } from '../../groupPlay/GroupPlayServer';
import { groupPlayClient } from '../../groupPlay/GroupPlayClient';
import {
    MODE_CLIENT,
    MODE_SERVER,
    setMode,
    registerGroupPlaySocket,
    claimGroupPlaySocket,
    unregisterGroupPlayUser,
    updateUsername,
    updateIp,
    setActivePlayer,
    receiveMessage
} from '../../reducers/groupPlay';
import styles from '../../Styles';

// Copyright 2018-Present Philip J. Guinchard
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

class GroupPlayScreen extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
        mode: PropTypes.number,
        username: PropTypes.string,
        ip: PropTypes.string,
        activePlayer: PropTypes.string.isRequired,
        messages: PropTypes.array.isRequired,
        setMode: PropTypes.func.isRequired,
        registerGroupPlaySocket: PropTypes.func.isRequired,
        claimGroupPlaySocket: PropTypes.func.isRequired,
        unregisterGroupPlayUser: PropTypes.func.isRequired,
        updateUsername: PropTypes.func.isRequired,
        updateIp: PropTypes.func.isRequired,
        setActivePlayer: PropTypes.func.isRequired,
        receiveMessage: PropTypes.func.isRequired,
    }

    onDidFocus() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.navigate('Home');

            return true;
        });
    }

    onDidBlur() {
        this.backHandler.remove();
    }

    constructor(props) {
        super(props);

        this.state = {
            selectedUser: PLAYER_OPTION_ALL,
            hostGameDialogVisible: false,
            joinGameDialogVisible: false,
            dialogVisible: false,
            title: '',
            message: '',
            onOk: () => {},
        };

        this.scrollView = null;

        this.onStopGameDialogOk = this._onStopGameDialogOk.bind(this);
        this.onLeaveGameDialogOk = this._onLeaveGameDialogOk.bind(this);
        this.onDialogClose = this._onDialogClose.bind(this);
        this.saveHostGameDetails = this._saveHostGameDetails.bind(this);
        this.closeHostGameDialog = this._closeHostGameDialog.bind(this);
        this.saveJoinGameDetails = this._saveJoinGameDetails.bind(this);
        this.closeJoinGameDialog = this._closeJoinGameDialog.bind(this);
    }

    componentDidMount() {
        if (this.props.ip === null) {
            NetworkInfo.getIPV4Address().then(ipv4Address => {
                if (ipv4Address === null) {
                    common.toast('Unable to determine IP address');
                }

                let octets = ipv4Address.split('.').splice(0, 3);

                this.props.updateIp(`${octets.join('.')}.`);
            });
        }
    }

    _updateUsername(value) {
        this.props.updateUsername(value);
    }

    _onMessageReceived() {
        this.scrollView.scrollToEnd({animated: true});
    }

    _onLeaveGameDialogOpen() {
        this.setState({
            dialogVisible: true,
            title: 'Leave Game?',
            message: `Are you certain you want to leave this game session?\n\nYou may reconnect later if you like.`,
            onOk: this.onLeaveGameDialogOk,
        });
    }

    _onLeaveGameDialogOk() {
        leaveGame(this.props.username, this.props.setMode);

        this.props.setMode(null);

        this._onDialogClose();
    }

    _onStopGameDialogOpen() {
        this.setState({
            dialogVisible: true,
            title: 'End Game?',
            message: `Are you certain you want to end this game session?\n\nThis will end the game for all connected users.`,
            onOk: this.onStopGameDialogOk,
        });
    }

    _onStopGameDialogOk() {
        stopGame(this.props.username, this.props.connectedUsers, this.props.unregisterGroupPlayUser, this.props.setMode, this.props.receiveMessage);

        this.props.setMode(null);

        this._onDialogClose();
    }

    _onDialogClose() {
        this.setState({dialogVisible: false});
    }

    _saveHostGameDetails() {
        this.setState({hostGameDialogVisible: false}, () => {
            this._hostGame();
        });
    }

    _closeHostGameDialog() {
        this.setState({hostGameDialogVisible: false});
    }

    _saveJoinGameDetails() {
        this.setState({joinGameDialogVisible: false}, () => {
            this._joinGame();
        });
    }

    _closeJoinGameDialog() {
        this.setState({joinGameDialogVisible: false});
    }

    _joinGame() {
        groupPlayClient.create(
            this.props.receiveMessage,
            this.props.username,
            this.props.ip,
            this.props.setActivePlayer,
            this.props.setMode
        );

        this.props.setMode(MODE_CLIENT);
    }

    _hostGame() {
        groupPlayServer.create(
            this.props.registerGroupPlaySocket,
            this.props.claimGroupPlaySocket,
            this.props.receiveMessage,
            this.props.unregisterGroupPlayUser,
            this.props.activePlayer,
            this.props.username
        );

        this.props.setMode(MODE_SERVER);
    }

    _setActivePlayer(username) {
        this.setState({selectedUser: username}, () => {
            groupPlayServer.setActivePlayer(username, this.props.username, this.props.connectedUsers);
        })
    }

    _renderConnectionDetails() {
        if (this.props.mode === null) {
            return (
                <Fragment>
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>You are not hosting or particpating in a game</Text>
                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <View style={[styles.buttonContainer, {flex: 1}]}>
                            <Button block style={styles.button}  onPress={() => this.setState({hostGameDialogVisible: true})}>
                                <Text uppercase={false}>Host Game</Text>
                            </Button>
                        </View>
                        <View style={[styles.buttonContainer, {flex: 1}]}>
                            <Button block style={styles.button}  onPress={() => this.setState({joinGameDialogVisible: true})}>
                                <Text uppercase={false}>Join Game</Text>
                            </Button>
                        </View>
                    </View>
                </Fragment>
            );
        } else if (this.props.mode === MODE_SERVER) {
            return (
                <Fragment>
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>You are currently hosting a game session.</Text>
                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <View style={[styles.buttonContainer, {flex: 1}]}>
                            <Button block style={styles.button}  onPress={() => this._onStopGameDialogOpen()}>
                                <Text uppercase={false}>Stop Game</Text>
                            </Button>
                        </View>
                    </View>
                </Fragment>
            );
        } else if (this.props.mode === MODE_CLIENT) {
            return (
                <Fragment>
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>You are currently participating in a game session.</Text>
                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <View style={[styles.buttonContainer, {flex: 1}]}>
                            <Button block style={styles.button}  onPress={() => this._onLeaveGameDialogOpen()}>
                                <Text uppercase={false}>Leave Game</Text>
                            </Button>
                        </View>
                    </View>
                </Fragment>
            );
        }
    }

    _renderUsernameOptions() {
        let options = [];

        for (const user of this.props.connectedUsers) {
            if (user.username !== null) {
                options.push(<Item label={user.username} key={user.username} value={user.username} />);
            }
        }

        options.unshift(<Item label={PLAYER_OPTION_ALL} key={PLAYER_OPTION_ALL} value={PLAYER_OPTION_ALL} />);

        return options;
    }

    _renderUserSelect() {
        if (this.props.connectedUsers.length === 0) {
            return null;
        }

        return (
            <Form>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>Active Player:</Label>
                    <Picker
                        style={{width: undefined, color: '#FFFFFF'}}
                        textStyle={{fontSize: verticalScale(16), color: '#FFFFFF'}}
                        placeholder={PLAYER_OPTION_ALL}
                        iosHeader="Select Player"
                        mode="dropdown"
                        selectedValue={this.state.selectedUser}
                        onValueChange={(value) => this._setActivePlayer(value)}
                    >
                        {this._renderUsernameOptions()}
                    </Picker>
                </Item>
            </Form>
        )
    }

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} backScreen={'Home'} />
                <Content style={styles.content}>
                    <Heading text='GroupPlay Status' />
                    {this._renderConnectionDetails()}
                    <Heading text='Messages' />
                    {this._renderUserSelect()}
                    <View style={{paddingHorizontal: scale(5), height: verticalScale(350)}}>
                        <ScrollView
                            ref={ref => this.scrollView = ref}
                            onContentSizeChange={(contentWidth, contentHeight) => this._onMessageReceived()}
                            style={{borderWidth: 1, borderColor: '#303030', backgroundColor: '#000'}}
                        >
                            {this.props.messages.map((message, index) => {
                                return (
                                    <Text key={`msg-${index}`} style={styles.grey}>
                                        <Text style={styles.boldGrey}>{message.sender}: </Text>{message.message}
                                    </Text>
                                );
                            })}
                            <View style={{paddingBottom: verticalScale(5)}} />
                        </ScrollView>
                    </View>
                    <View style={{paddingBottom: verticalScale(20)}} />
                    <ConfirmationDialog
                        visible={this.state.dialogVisible}
                        title={this.state.title}
                        info={this.state.message}
                        onOk={this.state.onOk}
                        onClose={this.onDialogClose}
                    />
                    <HostGameDialog
                        visible={this.state.hostGameDialogVisible}
                        username={this.props.username}
                        updateUsername={this.props.updateUsername}
                        onSave={this.saveHostGameDetails}
                        onClose={this.closeHostGameDialog}
                    />
                    <JoinGameDialog
                        visible={this.state.joinGameDialogVisible}
                        username={this.props.username}
                        ip={this.props.ip}
                        updateUsername={this.props.updateUsername}
                        updateIp={this.props.updateIp}
                        onSave={this.saveJoinGameDetails}
                        onClose={this.closeJoinGameDialog}
                    />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        mode: state.groupPlay.mode,
        username: state.groupPlay.username,
        ip: state.groupPlay.ip,
        activePlayer: state.groupPlay.activePlayer,
        messages: state.groupPlay.messages,
        connectedUsers: state.groupPlay.connectedUsers,
    };
};

const mapDispatchToProps = {
    setMode,
    registerGroupPlaySocket,
    claimGroupPlaySocket,
    unregisterGroupPlayUser,
    updateUsername,
    updateIp,
    setActivePlayer,
    receiveMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayScreen);
