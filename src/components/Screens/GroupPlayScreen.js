import '../../../shim'
import React, { Component, Fragment }  from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BackHandler, Alert, View, ScrollView } from 'react-native';
import { Container, Content, Button, Spinner, Text, Form, Item, Label, Input } from 'native-base';
import { scale, verticalScale } from 'react-native-size-matters';
import { NavigationEvents } from 'react-navigation';
import { NetworkInfo } from 'react-native-network-info';
import faker from 'faker';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { common } from '../../lib/Common';
import {
    GROUPPLAY_PORT,
    GROUPPLAY_CONNECT,
    GROUPPLAY_DISCONNECT,
    groupPlayServer,
    groupPlayClient,
    setGroupPlayServer,
    setGroupPlayClient
} from '../../../App';
import {
    MODE_CLIENT,
    MODE_SERVER,
    setMode,
    updateUsername,
    receiveMessage
} from '../../reducers/groupPlay';
import styles from '../../Styles';

var net = require('react-native-tcp');

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
        messages: PropTypes.array.isRequired,
        setMode: PropTypes.func.isRequired,
        updateUsername: PropTypes.func.isRequired,
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
            dialogVisible: false,
            title: '',
            message: '',
            onOk: () => {},
        };

        if (this.props.username === null) {
            this.props.updateUsername(faker.name.firstName());
        }

        this.scrollView = null;

        this.onStopGameDialogOk = this._onStopGameDialogOk.bind(this);
        this.onLeaveGameDialogOk = this._onLeaveGameDialogOk.bind(this);
        this.onDialogClose = this._onDialogClose.bind(this);
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
        this._leaveGame();

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
        this._stopGame();

        this.props.setMode(null);

        this._onDialogClose();
    }

    _onDialogClose() {
        this.setState({dialogVisible: false});
    }

    _joinGame(ip) {
        let client = net.createConnection(GROUPPLAY_PORT, ip, () => {
            this.props.receiveMessage(JSON.stringify({
                sender: 'Client',
                message: `Connected to ${ip}`
            }));

            client.write(JSON.stringify({
                sender: this.props.username,
                message: 'Let\'s do this!'
            }));
        });

        client.on('data', (data) => {
            this.props.receiveMessage(data);

            let json = JSON.parse(data);

            if (data.message === GROUPPLAY_DISCONNECT) {
                this._leaveGame();
            }
        });

        client.on('error', (error) => {
            this.props.receiveMessage(JSON.stringify({
                sender: 'Client',
                message: `${error}`
            }));
        });

        client.on('close', () => {
            this.props.receiveMessage(JSON.stringify({
                sender: 'Client',
                message: 'Connection has been closed by server'
            }));
        });

        client.on('end', (error) => {
            this.props.receiveMessage(JSON.stringify({
                sender: 'Client',
                message: `You have left the game session${error ? ` (${error})` : ''}`
            }));

            this.onLeaveGameDialogOk();
        });

        // client.setKeepAlive(true);

        this.props.setMode(MODE_CLIENT);

        setGroupPlayClient(client);
    }

    _hostGame() {
        NetworkInfo.getIPV4Address().then(ipv4Address => {
            const server = net.createServer((socket) => {
                socket.on('data', (data) => {
                    this.props.receiveMessage(data);
                });

                socket.on('error', (error) => {
                    this.props.receiveMessage(JSON.stringify({
                        sender: 'Server',
                        message: `${error}`
                    }));
                });

                socket.on('close', (error) => {
                    this.props.receiveMessage(JSON.stringify({
                        sender: 'Server',
                        message: `Your game session has ended by your GM${error ? ` (${error})` : ''}`
                    }));
                });

                this.props.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    message: 'A new connection has been created'
                }));

                socket.write(JSON.stringify({
                    sender: this.props.username,
                    message: 'Welcome to my game session!'
                }));
            }).listen(GROUPPLAY_PORT, () => {
                this.props.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    message: `Your game session has started ask your players to connect to ${ipv4Address}`
                }));
            });

            server.on('error', (error) => {
                this.props.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    message: `${error}`
                }));
            });

            server.on('close', () => {
                this.props.receiveMessage(JSON.stringify({
                    sender: 'Server',
                    message: 'Your game session has ended'
                }));
            });

            this.props.setMode(MODE_SERVER);

            setGroupPlayServer(server);
        });
    }

    _stopGame() {
        // groupPlayServer.getConnections((socket) => {
        //     socket.write(JSON.stringify({
        //         sender: 'Server',
        //         message: GROUPPLAY_DISCONNECT,
        //     }));
        // });

        groupPlayServer.close();

        setGroupPlayServer(null);
    }

    _leaveGame() {
        groupPlayClient.destroy();
    }

    _renderConnectionDetails() {
        if (this.props.mode === null) {
            return (
                <Fragment>
                    <Text style={[styles.grey, {alignSelf: 'center'}]}>You are not hosting or particpating in a game</Text>
                    <Form style={{alignSelf: 'center', width: scale(270), paddingBottom: verticalScale(15)}}>
                        <Item inlineLabel style={{marginLeft: 0}}>
                            <Label style={styles.grey}>Username:</Label>
                            <Input
                                style={styles.grey}
                                maxLength={32}
                                value={this.props.username}
                                onChangeText={(value) => this._updateUsername(value)}
                            />
                        </Item>
                    </Form>
                    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <View style={[styles.buttonContainer, {flex: 1}]}>
                            <Button block style={styles.button}  onPress={() => this._hostGame()}>
                                <Text uppercase={false}>Host Game</Text>
                            </Button>
                        </View>
                        <View style={[styles.buttonContainer, {flex: 1}]}>
                            <Button block style={styles.button}  onPress={() => this._joinGame('192.168.11.3')}>
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

    render() {
        return (
            <Container style={styles.container}>
                <NavigationEvents
                    onDidFocus={(payload) => this.onDidFocus()}
                    onDidBlur={(payload) => this.onDidBlur()}
                />
                <Header navigation={this.props.navigation} groupPlayMode={this.props.mode} backScreen={'Home'} />
                <Content style={styles.content}>
                    <Heading text='GroupPlay Status' />
                    {this._renderConnectionDetails()}
                    <Heading text='Messages' />
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
                </Content>
            </Container>
        );
    }
}

const mapStateToProps = state => {
    return {
        mode: state.groupPlay.mode,
        username: state.groupPlay.username,
        messages: state.groupPlay.messages,
    };
};

const mapDispatchToProps = {
    setMode,
    updateUsername,
    receiveMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayScreen);
