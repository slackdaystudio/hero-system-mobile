import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Platform, BackHandler, Alert, View, ScrollView } from 'react-native';
import { Container, Content, Button, Spinner, Text, Form, Item, Label, Input, Picker, Icon, Fab } from 'native-base';
import { scale, verticalScale } from 'react-native-size-matters';
import { NavigationEvents } from 'react-navigation';
import { NetworkInfo } from 'react-native-network-info';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import HostGameDialog from '../GroupPlayDialogs/HostGameDialog';
import JoinGameDialog from '../GroupPlayDialogs/JoinGameDialog';
import MessagePlayerDialog from '../GroupPlayDialogs/MessagePlayerDialog';
import { common } from '../../lib/Common';
import GroupPlayServer, { TYPE_GROUPPLAY_MESSAGE, PLAYER_OPTION_ALL } from '../../groupPlay/GroupPlayServer';
import GroupPlayClient from '../../groupPlay/GroupPlayClient';
import { setActive, setActivePlayer, receiveMessage } from '../../reducers/groupPlay';
import { groupPlayClient, groupPlayServer, setGroupPlayClient, setGroupPlayServer } from '../../../App';
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
        messages: PropTypes.array.isRequired,
        setActive: PropTypes.func.isRequired,
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
            username: '',
            ip: null,
            selectedUser: PLAYER_OPTION_ALL,
            sendMessageDialogVisible: false,
            messageRecipient: null,
            hostGameDialogVisible: false,
            joinGameDialogVisible: false,
            dialogVisible: false,
            title: '',
            message: '',
            onOk: () => {},
        };

        this.scrollView = null;

        this.updateUsername = this._updateUsername.bind(this);
        this.updateIp = this._updateIp.bind(this);
        this.onStopGameDialogOk = this._onStopGameDialogOk.bind(this);
        this.onLeaveGameDialogOk = this._onLeaveGameDialogOk.bind(this);
        this.onDialogClose = this._onDialogClose.bind(this);
        this.saveHostGameDetails = this._saveHostGameDetails.bind(this);
        this.closeHostGameDialog = this._closeHostGameDialog.bind(this);
        this.saveJoinGameDetails = this._saveJoinGameDetails.bind(this);
        this.closeJoinGameDialog = this._closeJoinGameDialog.bind(this);
        this.sendMessage = this._sendMessage.bind(this);
        this.closeSendMessageDialog = this._closeSendMessageDialog.bind(this);
        this.setActivePlayer = this._setActivePlayer.bind(this);
    }

    componentDidMount() {
        if (this.state.ip === null) {
            NetworkInfo.getIPV4Address().then(ipv4Address => {
                if (ipv4Address === null) {
                    common.toast('Unable to determine IP address');
                }

                let octets = ipv4Address.split('.').splice(0, 3);

                this.updateIp(`${octets.join('.')}.`);
            });
        }
    }

    _updateUsername(value) {
        this.setState({username: value});
    }

    _updateIp(ip) {
        this.setState({ip: ip});
    }

    _onMessageReceived() {
        this.scrollView.scrollToEnd({animated: true});
    }

    _closeSendMessageDialog() {
        this.setState({sendMessageDialogVisible: false});
    }

    _messageGm() {
        if (groupPlayClient !== null && groupPlayClient.gm !== null) {
            this.setState({sendMessageDialogVisible: true, messageRecipient: groupPlayClient.gm});
        }
    }

    _sendMessage(value) {
        this.setState({sendMessageDialogVisible: false}, () => {
            if (value.trim() !== '') {
                if (groupPlayServer !== null) {
                    groupPlayServer.sendMessage(value.trim(), this.state.selectedUser);
                } else if (groupPlayClient !== null) {
                    groupPlayClient.sendMessage(value.trim());
                }

                this.props.receiveMessage(JSON.stringify({
                    sender: 'You',
                    type: TYPE_GROUPPLAY_MESSAGE,
                    message: value
                }));
            }
        });
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
        groupPlayClient.leaveGame();

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
        groupPlayServer.stopGame(() => {
            this.props.setActive(false);
            this._onDialogClose();
        });
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
        setGroupPlayClient(new GroupPlayClient(this.state.ip, this.state.username, this.props.receiveMessage, this.props.setActive, this.props.setActivePlayer));
    }

    _hostGame() {
        setGroupPlayServer(new GroupPlayServer(this.state.username, this.props.receiveMessage, this.props.setActive));
    }

    _setActivePlayer(username) {
        this.setState({selectedUser: username}, () => {
            this.props.setActivePlayer(username);
            groupPlayServer.setActivePlayer(username);
        });
    }

    _renderConnectionDetails() {
        if (groupPlayServer === null && groupPlayClient === null) {
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
        } else if (groupPlayServer !== null) {
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
        } else if (groupPlayClient !== null) {
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

        for (const user of groupPlayServer.connectedUsers) {
            if (user.username !== null) {
                options.push(<Item label={user.username} key={user.id} value={user.username} />);
            }
        }

        options.unshift(<Item label={PLAYER_OPTION_ALL} key={PLAYER_OPTION_ALL} value={PLAYER_OPTION_ALL} />);

        return options;
    }

    _renderUserSelect() {
        if (groupPlayServer === null || groupPlayServer.connectedUsers.length === 0) {
            return null;
        }

        return (
            <Form style={{paddingHorizontal: scale(10), paddingBottom: verticalScale(10)}}>
                <Item inlineLabel style={{marginLeft: 0}}>
                    <Label style={styles.grey}>Active Player:</Label>
                    <Picker
                        style={{width: undefined, color: '#FFFFFF'}}
                        textStyle={{fontSize: verticalScale(16), color: '#FFFFFF'}}
                        placeholder={PLAYER_OPTION_ALL}
                        iosHeader="Select Player"
                        mode="dropdown"
                        selectedValue={this.state.selectedUser}
                        onValueChange={(value) => this.setActivePlayer(value)}
                    >
                        {this._renderUsernameOptions()}
                    </Picker>
                    <View style={{width: scale(5)}} />
                    <Button style={{backgroundColor: '#14354d'}} onPress={() => this.setState({sendMessageDialogVisible: true, messageRecipient: this.state.selectedUser})}>
                        <Icon type='FontAwesome' name="comment" style={{fontSize: verticalScale(18), color: 'white'}} />
                    </Button>
                </Item>
            </Form>
        )
    }

    _renderFab() {
        if (groupPlayClient !== null) {
            return (
                <Fab style={{backgroundColor: '#14354d'}} position='bottomRight' onPress={() => this._messageGm()}>
                    <Icon type='FontAwesome' name="comment" style={{fontSize: verticalScale(18), color: 'white'}} />
                </Fab>
            );
        }

        return null;
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
                    <Heading text='Game Status' />
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
                    <View style={{paddingBottom: verticalScale(60)}} />
                    {this._renderFab()}
                    <ConfirmationDialog
                        visible={this.state.dialogVisible}
                        title={this.state.title}
                        info={this.state.message}
                        onOk={this.state.onOk}
                        onClose={this.onDialogClose}
                    />
                    <HostGameDialog
                        visible={this.state.hostGameDialogVisible}
                        username={this.state.username}
                        updateUsername={this.updateUsername}
                        onSave={this.saveHostGameDetails}
                        onClose={this.closeHostGameDialog}
                    />
                    <JoinGameDialog
                        visible={this.state.joinGameDialogVisible}
                        username={this.state.username}
                        ip={this.state.ip}
                        updateUsername={this.updateUsername}
                        updateIp={this.updateIp}
                        onSave={this.saveJoinGameDetails}
                        onClose={this.closeJoinGameDialog}
                    />
                    <MessagePlayerDialog
                        visible={this.state.sendMessageDialogVisible}
                        recipient={this.state.messageRecipient}
                        onSend={this.sendMessage}
                        onClose={this.closeSendMessageDialog}
                    />
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        messages: state.groupPlay.messages,
    };
};

const mapDispatchToProps = {
    setActive,
    setActivePlayer,
    receiveMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayScreen);
