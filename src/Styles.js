import {ScaledSheet} from 'react-native-size-matters';

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

const AllColors = {
    base03: '#002b36',
    base02: '#073642',
    base01: '#586e75',
    base00: '#657b83',
    base0: '#839496',
    base1: '#93a1a1',
    base2: '#eee8d5',
    base3: '#fdf6e3',
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900',
    background: '#05232b',
    switchGutter: '#283134',
};

export const Colors = {
    background: AllColors.background,
    primary: AllColors.base03,
    secondary: AllColors.base00,
    tertiary: AllColors.base1,
    text: AllColors.base2,
    formControl: AllColors.base01,
    secondaryForm: AllColors.green,
    formAccent: AllColors.base1,
    characterFooter: AllColors.cyan,
    yellow: AllColors.yellow,
    red: AllColors.red,
    switchGutter: AllColors.switchGutter,
};

export default ScaledSheet.create({
    container: {
        backgroundColor: Colors.background,
    },
    content: {
        paddingTop: 0,
        paddingHorizontal: 0,
        backgroundColor: Colors.background,
    },
    heading: {
        fontSize: '16@vs',
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        fontVariant: 'small-caps',
        color: Colors.text,
        paddingVertical: '5@s',
        textAlign: 'center',
        backgroundColor: Colors.primary,
        width: '100%',
        height: '32@vs',
        borderColor: Colors.text,
        borderBottomWidth: 0.5,
        borderTopWidth: 0.5,
        letterSpacing: 6,
    },
    subHeading: {
        alignSelf: 'center',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: Colors.text,
    },
    hdSubHeading: {
        fontSize: '18@vs',
        fontWeight: 'bold',
        paddingTop: '10@vs',
        color: Colors.text,
        borderBottomColor: Colors.text,
        borderBottomWidth: '2@vs',
        width: '100%',
    },
    buttonContainer: {
        paddingVertical: '5@s',
        alignItems: 'center',
    },
    buttonBig: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '130@vs',
        height: '43@vs',
        backgroundColor: Colors.formControl,
        borderWidth: 0.5,
        borderColor: Colors.formControl,
        borderRadius: '10@vs',
    },
    buttonSmall: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '100@s',
        height: '43@vs',
        backgroundColor: Colors.formControl,
        borderWidth: 0.5,
        borderColor: Colors.formControl,
        borderRadius: '5@vs',
    },
    buttonTiny: {
        minWidth: '80@s',
        height: '28@vs',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: '14@vs',
        color: Colors.text,
        fontVariant: 'small-caps',
    },
    grey: {
        fontSize: '14@vs',
        color: Colors.text,
    },
    boldGrey: {
        fontSize: '14@vs',
        color: Colors.text,
        fontWeight: 'bold',
    },
    textInput: {
        borderWidth: 0.5,
        borderColor: Colors.formControl,
        backgroundColor: Colors.primary,
        color: Colors.text,
        fontSize: '14@vs',
        height: '30@vs',
        lineHeight: '15@vs',
        minWidth: '55@vs',
        textAlign: 'center',
        borderRadius: '10@vs',
    },
    textAreaInput: {
        color: Colors.text,
        borderWidth: 0.5,
        borderColor: Colors.formControl,
        backgroundColor: 'rgba(18, 18, 18, 0.3)',
        fontSize: '14@vs',
        textAlignVertical: 'top',
    },
    tabHeading: {
        backgroundColor: '#000',
    },
    activeTabStyle: {
        backgroundColor: '#000',
        color: '#000',
        fontSize: 999,
    },
    activeTextStyle: {
        backgroundColor: '#000',
        color: '#000',
    },
    tabStyle: {
        fontSize: '14@vs',
        color: Colors.background,
    },
    scrollableTab: {
        backgroundColor: '#000',
    },
    tabBarUnderline: {
        backgroundColor: Colors.text,
    },
    tabContent: {
        // backgroundColor: Colors.background,
    },
    card: {
        backgroundColor: Colors.primary,
    },
    cardItem: {
        backgroundColor: Colors.primary,
    },
    cardTitle: {
        fontSize: '16@vs',
        fontWeight: 'bold',
        color: Colors.primary,
    },
    modal: {
        flex: -1,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.formControl,
        flexDirection: 'column',
    },
    modalHeader: {
        fontSize: '20@vs',
        paddingLeft: '22@s',
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        color: Colors.text,
        paddingVertical: '5@vs',
        backgroundColor: '#121212',
        width: '100%',
        borderColor: Colors.formControl,
        borderBottomWidth: 1,
        borderTopWidth: 1,
    },
    modalContent: {
        flex: -1,
        backgroundColor: Colors.background,
        paddingHorizontal: '22@s',
        paddingTop: '10@vs',
        paddingBottom: '40@vs',
        justifyContent: 'center',
        alignItems: 'stretch',
    },
    autocompletesContainer: {
        paddingTop: 0,
        width: '100%',
    },
    autocompleteInputContainer: {
        display: 'flex',
        flexShrink: 0,
        flexGrow: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderWidth: 0,
        marginLeft: '-13@s',
    },
});
