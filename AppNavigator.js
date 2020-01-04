import React, { Component }  from 'react';
import { createDrawerNavigator } from 'react-navigation-drawer';
import HomeScreen from './src/components/Screens/HomeScreen';
import ViewCharacterScreen from './src/components/Screens/ViewCharacterScreen';
import ViewHeroDesignerCharacterScreen from './src/components/Screens/ViewHeroDesignerCharacterScreen';
import RandomCharacterScreen from './src/components/Screens/RandomCharacterScreen';
import ResultScreen from './src/components/Screens/ResultScreen';
import SkillScreen from './src/components/Screens/SkillScreen';
import HitScreen from './src/components/Screens/HitScreen';
import DamageScreen from './src/components/Screens/DamageScreen';
import FreeFormScreen from './src/components/Screens/FreeFormScreen';
import CostCruncherScreen from './src/components/Screens/CostCruncherScreen';
import StatisticsScreen from './src/components/Screens/StatisticsScreen';
import SettingsScreen from './src/components/Screens/SettingsScreen';
import Sidebar from './src/components/Sidebar/Sidebar';

const AppNavigator = createDrawerNavigator({
    Home: {
        screen: HomeScreen,
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
    FreeForm: {
        screen: FreeFormScreen,
    },
    CostCruncher: {
        screen: CostCruncherScreen,
    },
    Statistics: {
        screen: StatisticsScreen,
    },
    Settings: {
        screen: SettingsScreen
    }
}, {
    initialRouteName: 'Home',
    drawerPosition: 'right',
    contentComponent: Sidebar,
    drawerWidth: 250
});

export default AppNavigator;