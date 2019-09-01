import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Text, List, ListItem, Left, Body } from 'native-base';
import Heading from '../Heading/Heading';
import { common } from '../../lib/Common';
import styles from '../../Styles';

export default class General extends Component {
    static propTypes = {
        characterInfo: PropTypes.object.isRequired
    }

    render() {
        return (
            <View style={{paddingHorizontal: 5}}>
                <Heading text='Information' />
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Name:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.characterName}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Aliases:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.alternateIdentities}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Player:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.playerName}</Text>
                </View>
                <View style={{paddingBottom: 20}} />
                <Heading text='Traits' />
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Height:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{common.toCm(this.props.characterInfo.height)} cm</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Weight:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{common.toKg(this.props.characterInfo.weight)} kg</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Eye Color:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.eyeColor}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Hair Color:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.hairColor}</Text>
                </View>
                <View style={{paddingBottom: 20}} />
                <Heading text='Background' />
                <Text style={styles.grey}>{this.props.characterInfo.background}</Text>
                <View style={{paddingBottom: 20}} />
                <Heading text='personality' />
                <Text style={styles.grey}>{this.props.characterInfo.personality}</Text>
                <View style={{paddingBottom: 20}} />
                <Heading text='Quote' />
                <Text style={styles.grey}>{this.props.characterInfo.quote}</Text>
                <View style={{paddingBottom: 20}} />
                <Heading text='Tactics' />
                <Text style={styles.grey}>{this.props.characterInfo.tactics}</Text>
                <View style={{paddingBottom: 20}} />
                <Heading text='Campaign Use' />
                <Text style={styles.grey}>{this.props.characterInfo.campaignUse}</Text>
                <View style={{paddingBottom: 20}} />
                <Heading text='Appearance' />
                <Text style={styles.grey}>{this.props.characterInfo.appearance}</Text>
                <View style={{paddingBottom: 20}} />
            </View>
        );
    }
}
