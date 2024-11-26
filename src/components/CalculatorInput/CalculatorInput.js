import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Platform, View} from 'react-native';
import {CalculatorInput as BaseCalculatorInput} from 'react-native-calculator';
import {verticalScale} from 'react-native-size-matters';
import {Icon} from '../Icon/Icon';
import styles from '../../Styles';

// export const CalculatorInput = ({itemKey, value, onAccept, width = 90, iconPaddingTop = 15}) => {
//     const currentBodyPointsCalculator = React.useRef(null);

//     const _onAccept = (val) => {
//         onAccept(itemKey, val);
//         currentBodyPointsCalculator.current.calculatorModalToggle();
//     };

//     return (
//         <View style={{flex: 1, flexDirection: 'row', width: verticalScale(width)}}>
//             <View style={{flex: 1}}>
//                 <BaseCalculatorInput
//                     ref={(ref) => (currentBodyPointsCalculator.current = ref)}
//                     fieldContainerStyle={{borderBottomWidth: 0}}
//                     fieldTextStyle={[styles.grey, {textAlign: 'left', alignSelf: 'baseline'}]}
//                     value={value.toString()}
//                     onAccept={(val) => _onAccept(val)}
//                     modalAnimationType="slide"
//                     hasAcceptButton={true}
//                     displayTextAlign="left"
//                 />
//             </View>
//             <View style={{flex: 1}} flexDirection="row" alignItems="flex-start" marginTop={verticalScale(Platform.OS === 'ios' ? -8 : -5)}>
//                 <Icon
//                     name="calculator"
//                     size={verticalScale(18)}
//                     color="#14354d"
//                     style={{alignSelf: 'center', paddingTop: verticalScale(iconPaddingTop)}}
//                     onPress={() => currentBodyPointsCalculator.current.calculatorModalToggle()}
//                 />
//             </View>
//         </View>
//     );
// }

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
                </View>
                <View style={{flex: 1}} flexDirection="row" alignItems="flex-start" marginTop={verticalScale(Platform.OS === 'ios' ? -8 : -5)}>
                    <Icon
                        name="calculator"
                        size={verticalScale(18)}
                        color="#14354d"
                        style={{alignSelf: 'center', paddingTop: verticalScale(this.props.iconPaddingTop)}}
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
