import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { Platform, View } from 'react-native';
import { Text, Icon, Item, Label } from 'native-base';
import { CalculatorInput as BaseCalculatorInput } from 'react-native-calculator'
import styles from '../../Styles';

export default class CalculatorInput extends Component {
    static propTypes = {
        itemKey: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        onAccept: PropTypes.func.isRequired,
        width: PropTypes.number,
        fontSize: PropTypes.number,
        labelFontSize: PropTypes.number,
        stackedLabel: PropTypes.bool,
        boldLabel: PropTypes.bool,
        iconPaddingTop: PropTypes.number,
    }

    _onAccept(value) {
        this.props.onAccept(this.props.itemKey, value);

        this.currentBodyPointsCalculator.calculatorModalToggle();
    }

    render() {
        return (
            <View style={{flex: 1, flexDirection: 'row', width: this.props.width}}>
                <Item>
                    <BaseCalculatorInput
                        ref={(ref) => this.currentBodyPointsCalculator = ref}
                        fieldContainerStyle={{borderBottomWidth: 0}}
                        fieldTextStyle={[styles.grey, {textAlign: 'left', alignSelf: 'baseline', paddingTop: Platform.OS === 'ios' ? 15 : 5}]}
                        value={this.props.value.toString()}
                        onAccept={(value) => this._onAccept(value)}
                        modalAnimationType='slide'
                        hasAcceptButton={true}
                        displayTextAlign='left'
                    />
                </Item>
                <Icon
                    type='FontAwesome'
                    name='calculator'
                    style={{fontSize: 20, color: '#14354d', alignSelf: 'center', paddingTop: this.props.iconPaddingTop}}
                    onPress={() => this.currentBodyPointsCalculator.calculatorModalToggle()}
                />
            </View>
        );
    }
}

CalculatorInput.defaultProps = {
    width: 110,
    fontSize: 12,
    labelFontSize: 10,
    stackedLabel: true,
    boldLabel: false,
    iconPaddingTop: 10,
};
