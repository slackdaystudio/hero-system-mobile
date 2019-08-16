import React, { Component }  from 'react';
import { View } from 'react-native';
import { Text } from 'native-base';

export default class CircleText extends Component {
    render() {
        const size = this.props.size;
        const fontSize = this.props.fontSize;
        const borderWidth = 1;
        let paddingRight = 5;

        return (
            <View style = {{
                alignItems:'center',
                justifyContent:'center',
                backgroundColor:'#000',
                borderColor: this.props.color,
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: borderWidth,
                borderColor: '#303030',
                marginTop: 2
            }}>
                <Text style = {{
                    textAlign: 'center',
                    alignSelf: 'center',
                    justifyContent: 'center',
                    fontSize: fontSize - 2 * borderWidth,
                    lineHeight: fontSize - (Platform.OS === 'ios' ? 2 * borderWidth : borderWidth),
                    paddingTop: 3,
                    fontWeight: 'bold',
                    color: '#F3EDE9'
                }}>
                    {this.props.title}
                </Text>
            </View>
        );
    }
}
