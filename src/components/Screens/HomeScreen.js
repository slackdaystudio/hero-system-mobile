import React, { Component }  from 'react';
import { Platform, StyleSheet, ScrollView, View, ImageBackground, TouchableHighlight } from 'react-native';
import { Container, Content, Button, Text, Spinner, Card, CardItem, Body, Icon } from 'native-base';
import Header from '../Header/Header';
import Heading from '../Heading/Heading';
import { dieRoller } from '../../lib/DieRoller';
import { character } from '../../lib/Character';
import styles from '../../Styles';

export default class HomeScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            characterLoading: false
        };

        this.startLoad = this._startLoad.bind(this);
        this.endLoad = this._endLoad.bind(this);
    }

    _startLoad() {
        this.setState({characterLoading: true});
    }

    _endLoad() {
        this.setState({characterLoading: false});
    }

    _renderViewCharacterButton() {
        if (this.state.characterLoading) {
            return <Spinner color='#D0D1D3' />;
        }

        return (
            <Button style={styles.button} onPress={() => this.props.navigation.navigate('ViewCharacter')}>
                <Text uppercase={false} style={styles.buttonText}>View</Text>
            </Button>
        );
    }

	render() {
		return (
		  <Container style={styles.container}>
		    <ImageBackground source={require('../../../public/background.png')} style={{flex: 1}} imageStyle={{ resizeMode: 'cover' }}>
			    <Header navigation={this.props.navigation} />
                <Content style={styles.content}>
                    <Heading text='Character' />
                    <Text style={[styles.grey, {textAlign: 'center'}]}>Import characters from Hero Designer and take them with you when you&quot;re on the go.</Text>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            {this._renderViewCharacterButton()}
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => character.load(this.startLoad, this.endLoad)}>
                                <Text uppercase={false} style={styles.buttonText}>Load</Text>
                            </Button>
                        </View>
                    </View>
                    <Heading text='Rolls' />
                    <Text style={[styles.grey, {textAlign: 'center'}]}>Use these tools for rolling dice and doing common tasks within the Hero system.</Text>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('Skill')}>
                                <Text uppercase={false} style={styles.buttonText}>3d6</Text>
                            </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('Hit')}>
                                <Text uppercase={false} style={styles.buttonText}>Hit</Text>
                            </Button>
                        </View>
                    </View>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('Damage')}>
                                <Text uppercase={false} style={styles.buttonText}>Damage</Text>
                            </Button>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('FreeForm')}>
                                <Text uppercase={false} style={styles.buttonText}>Free Form</Text>
                            </Button>
                        </View>
                    </View>
                    <Heading text='Tools' />
                    <Text style={[styles.grey, {textAlign: 'center'}]}>Generate a random 5e character using the Heroic Empowerment Resource Organizer (H.E.R.O.) tool or use the cruncher to calculate power costs.</Text>
                    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-around'}}>
                        <View style={[styles.buttonContainer, {paddingBottom: 20}]}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('RandomCharacter')}>
                                <Text uppercase={false} style={styles.buttonText}>H.E.R.O.</Text>
                            </Button>
                        </View>
                        <View style={[styles.buttonContainer, {paddingBottom: 20}]}>
                            <Button style={styles.button} onPress={() => this.props.navigation.navigate('CostCruncher')}>
                                <Text uppercase={false} style={styles.buttonText}>Cruncher</Text>
                            </Button>
                        </View>
                    </View>
                    <Heading text='Library' />
                    <Text style={[styles.grey, {textAlign: 'center'}]}>A collection of documents to help new and old players alike.</Text>
                    <TouchableHighlight onPress={() => this.props.navigation.navigate('PdfViewer', {pdfName: 'Hero2Page.pdf'})}>
                        <Card style={{borderColor: '#D0D1D3'}}>
                            <CardItem style={{backgroundColor: '#375476'}}>
                                <Body>
                                    <Text style={[styles.boldGrey, {fontSize: 20, textDecorationLine: 'underline'}]}>HERO in 2 Pages</Text>
                                    <Text style={[styles.grey]}>Everything you need to know to play the HERO System in 2 pages</Text>
                                    <Text style={[styles.grey, {fontSize: 12, fontStyle: 'italic'}]}>
                                        <Text style={[styles.boldGrey, {fontSize: 12}]}>Authors: </Text>Bill Keyes, Narf T. Mouse, and Steven S. Long
                                    </Text>
                                </Body>
                            </CardItem>
                        </Card>
                    </TouchableHighlight>
                    <TouchableHighlight onPress={() => this.props.navigation.navigate('PdfViewer', {pdfName: 'Hero Survival Guide.pdf'})}>
                        <Card style={{borderColor: '#D0D1D3'}}>
                            <CardItem style={{backgroundColor: '#375476'}}>
                                <Body>
                                    <Text style={[styles.boldGrey, {fontSize: 20, textDecorationLine: 'underline'}]}>HERO Survival Guide</Text>
                                    <Text style={[styles.grey]}>This is a simple sheet offering some ideas on what to do in combat given Hero's vast options.</Text>
                                    <Text style={[styles.grey, {fontSize: 12, fontStyle: 'italic'}]}>
                                        <Text style={[styles.boldGrey, {fontSize: 12}]}>Author: </Text>Christopher R. Taylor
                                    </Text>
                                </Body>
                            </CardItem>
                        </Card>
                    </TouchableHighlight>
                    <View style={{paddingBottom: 20}} />
                </Content>
            </ImageBackground>
	      </Container>
		);
	}
}
