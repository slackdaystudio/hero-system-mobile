import { StyleSheet, Platform } from 'react-native';
import { ifIphoneX } from 'react-native-iphone-x-helper';

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

export default StyleSheet.create({
    container: {
        backgroundColor: '#1b1d1f',
        ...ifIphoneX({
            paddingTop: 50,
        }, {
            paddingTop: (Platform.OS === 'ios' ? 20 : 0),
        }),
    },
    content: {
        paddingTop: 0,
        paddingHorizontal: 0,
    },
    heading: {
        fontSize: 24,
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        color: '#F3EDE9',
        paddingVertical: 5,
        textAlign: 'center',
        backgroundColor: '#121212',
        width: '100%',
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
        fontSize: 22,
        fontWeight: 'bold',
        paddingTop: 10,
        color: '#F3EDE9',
        borderBottomColor: '#F3EDE9',
        borderBottomWidth: 2,
        width: '100%',
    },
    buttonContainer: {
        paddingVertical: 5,
    },
    button: {
        backgroundColor: '#14354d',
        minWidth: 140,
        justifyContent: 'center',
        alignSelf: 'center',
    },
    buttonBig: {
        backgroundColor: '#14354d',
        minWidth: 300,
        justifyContent: 'center',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#e8e8e8',
    },
    grey: {
        color: '#e8e8e8',
    },
    boldGrey: {
        color: '#e8e8e8',
        fontWeight: 'bold',
    },
    tabInactive: {
        backgroundColor: '#000',
    },
    tabActive: {
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
        backgroundColor: '#0e0e0f',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e8e8e8',
        backgroundColor: '#121212',
    },
});
