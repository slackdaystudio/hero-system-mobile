import {createDrawerNavigator} from 'react-navigation-drawer';
import {scale} from 'react-native-size-matters';
import HomeScreen from './src/components/Screens/HomeScreen';
import CharactersScreen from './src/components/Screens/CharactersScreen';
import ViewCharacterScreen from './src/components/Screens/ViewCharacterScreen';
import ViewHeroDesignerCharacterScreen from './src/components/Screens/ViewHeroDesignerCharacterScreen';
import RandomCharacterScreen from './src/components/Screens/RandomCharacterScreen';
import ResultScreen from './src/components/Screens/ResultScreen';
import SkillScreen from './src/components/Screens/SkillScreen';
import HitScreen from './src/components/Screens/HitScreen';
import DamageScreen from './src/components/Screens/DamageScreen';
import EffectScreen from './src/components/Screens/EffectScreen';
import CostCruncherScreen from './src/components/Screens/CostCruncherScreen';
import StatisticsScreen from './src/components/Screens/StatisticsScreen';
import SettingsScreen from './src/components/Screens/SettingsScreen';
import Sidebar from './src/components/Sidebar/Sidebar';

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

const AppNavigator = createDrawerNavigator(
    {
        Home: {
            screen: HomeScreen,
        },
        Characters: {
            screen: CharactersScreen,
        },
        ViewCharacter: {
            screen: ViewCharacterScreen,
        },
        ViewHeroDesignerCharacter: {
            screen: ViewHeroDesignerCharacterScreen,
        },
        RandomCharacter: {
            screen: RandomCharacterScreen,
        },
        Result: {
            screen: ResultScreen,
        },
        Skill: {
            screen: SkillScreen,
        },
        Hit: {
            screen: HitScreen,
        },
        Damage: {
            screen: DamageScreen,
        },
        Effect: {
            screen: EffectScreen,
        },
        CostCruncher: {
            screen: CostCruncherScreen,
        },
        Statistics: {
            screen: StatisticsScreen,
        },
        Settings: {
            screen: SettingsScreen,
        },
    },
    {
        initialRouteName: 'Home',
        drawerPosition: 'right',
        contentComponent: Sidebar,
        drawerWidth: scale(210),
    },
);

export default AppNavigator;
