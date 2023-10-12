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

export default ScaledSheet.create({
    container: {
        backgroundColor: '#1b1d1f',
    },
    content: {
        paddingTop: 0,
        paddingHorizontal: 0,
        backgroundColor: '#1b1d1f',
    },
    heading: {
        fontSize: '20@vs',
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        color: '#F3EDE9',
        paddingVertical: '5@s',
        textAlign: 'center',
        backgroundColor: '#121212',
        width: '100%',
        height: '37@vs',
        borderColor: '#303030',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        textTransform: 'uppercase',
        letterSpacing: 8,
    },
    subHeading: {
        alignSelf: 'center',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: '#F3EDE9',
    },
    hdSubHeading: {
        fontSize: '18@vs',
        fontWeight: 'bold',
        paddingTop: '10@vs',
        color: '#F3EDE9',
        borderBottomColor: '#F3EDE9',
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
        backgroundColor: '#14354d',
        borderWidth: 0.5,
        borderColor: '#1f547a',
        borderRadius: '5@vs',
    },
    buttonSmall: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '100@s',
        height: '43@vs',
        backgroundColor: '#14354d',
        borderWidth: 0.5,
        borderColor: '#1f547a',
        borderRadius: '5@vs',
    },
    buttonTiny: {
        minWidth: '80@s',
        height: '28@vs',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: '14@vs',
        color: '#e8e8e8',
        textTransform: 'uppercase',
    },
    grey: {
        fontSize: '14@vs',
        color: '#e8e8e8',
    },
    boldGrey: {
        fontSize: '14@vs',
        color: '#e8e8e8',
        fontWeight: 'bold',
    },
    textInput: {
        borderWidth: 0.5,
        borderColor: '#303030',
        backgroundColor: 'rgba(18, 18, 18, 0.3)',
        color: '#e8e8e8',
        fontSize: '14@vs',
        height: '40@vs',
        lineHeight: '15@vs',
        minWidth: '75@vs',
        textAlign: 'center',
    },
    textAreaInput: {
        color: '#e8e8e8',
        borderWidth: 0.5,
        borderColor: '#303030',
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
        color: '#e8e8e8',
    },
    scrollableTab: {
        backgroundColor: '#000',
    },
    tabBarUnderline: {
        backgroundColor: '#F3EDE9',
    },
    tabContent: {
        flex: 1,
        backgroundColor: '#1b1d1f',
    },
    card: {
        backgroundColor: '#1b1d1f',
    },
    cardItem: {
        backgroundColor: '#1b1d1f',
    },
    cardTitle: {
        fontSize: '16@vs',
        fontWeight: 'bold',
        color: '#e8e8e8',
    },
    modal: {
        flex: -1,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#303030',
        flexDirection: 'column',
    },
    modalHeader: {
        fontSize: '20@vs',
        paddingLeft: '22@s',
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        color: '#F3EDE9',
        paddingVertical: '5@vs',
        backgroundColor: '#121212',
        width: '100%',
        borderColor: '#303030',
        borderBottomWidth: 1,
        borderTopWidth: 1,
    },
    modalContent: {
        flex: -1,
        backgroundColor: '#1b1d1f',
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
