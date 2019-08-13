import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Text, List, ListItem, Left, Body } from 'native-base';
import styles from '../../Styles';

export default class General extends Component {
    static propTypes = {
        characterInfo: PropTypes.object.isRequired
    }

    render() {
        return (
            <View style={{paddingHorizontal: 5}}>
                <Text style={styles.hdSubHeading}>Character Information</Text>
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
                <Text style={styles.hdSubHeading}>Physical Appearance</Text>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Height:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.height}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Weight:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.weight}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Eye Color:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.eyeColor}</Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.boldGrey, {flex: 1}]}>Hair Color:</Text>
                    <Text style={[styles.grey, {flex: 3}]}>{this.props.characterInfo.hairColor}</Text>
                </View>
                <Text style={styles.hdSubHeading}>Background</Text>
                <Text style={styles.grey}>{this.props.characterInfo.background}</Text>
                <Text style={styles.hdSubHeading}>Personality</Text>
                <Text style={styles.grey}>{this.props.characterInfo.personality}</Text>
                <Text style={styles.hdSubHeading}>Quote</Text>
                <Text style={styles.grey}>{this.props.characterInfo.quote}</Text>
                <Text style={styles.hdSubHeading}>Powers/Tactics</Text>
                <Text style={styles.grey}>{this.props.characterInfo.tactics}</Text>
                <Text style={styles.hdSubHeading}>Campaign Use</Text>
                <Text style={styles.grey}>{this.props.characterInfo.campaignUse}</Text>
                <Text style={styles.hdSubHeading}>Appearance</Text>
                <Text style={styles.grey}>{this.props.characterInfo.appearance}</Text>
                <View style={{paddingBottom: 20}} />
            </View>
        );
    }
}
