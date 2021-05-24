import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {Icon, Item} from 'native-base';
import {CalculatorInput as BaseCalculatorInput} from 'react-native-calculator';
import {verticalScale} from 'react-native-size-matters';
import styles from '../../Styles';

export default class CalculatorInput extends Component {
    static propTypes = {
        itemKey: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        onAccept: PropTypes.func.isRequired,
        width: PropTypes.number,
        iconPaddingTop: PropTypes.number,
    };

    _onAccept(value) {
        this.props.onAccept(this.props.itemKey, value);

        this.currentBodyPointsCalculator.calculatorModalToggle();
    }

    render() {
        return (
            <View style={{flex: 1, flexDirection: 'row', width: verticalScale(this.props.width)}}>
                <View style={{flex: 1}}>
                    <Item>
                        <BaseCalculatorInput
                            ref={(ref) => (this.currentBodyPointsCalculator = ref)}
                            fieldContainerStyle={{borderBottomWidth: 0}}
                            fieldTextStyle={[styles.grey, {textAlign: 'left', alignSelf: 'baseline'}]}
                            value={this.props.value.toString()}
                            onAccept={(value) => this._onAccept(value)}
                            modalAnimationType="slide"
                            hasAcceptButton={true}
                            displayTextAlign="left"
                        />
                    </Item>
                </View>
                <View style={{flex: 1}}>
                    <Icon
                        type="FontAwesome"
                        name="calculator"
                        style={{fontSize: verticalScale(18), color: '#14354d', alignSelf: 'center', paddingTop: verticalScale(this.props.iconPaddingTop)}}
                        onPress={() => this.currentBodyPointsCalculator.calculatorModalToggle()}
                    />
                </View>
            </View>
        );
    }
}

CalculatorInput.defaultProps = {
    width: 90,
    iconPaddingTop: 15,
};
