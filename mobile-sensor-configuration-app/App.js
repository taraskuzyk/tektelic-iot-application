import React, { Component } from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import ScanScreen from './screens/ScanScreen.js';
import WelcomeScreen from './screens/WelcomeScreen.js';
import SelectNetworkServerScreen from './screens/SelectNetworkServerScreen.js';
import SettingsScreen from './screens/SettingsScreen.js';
import {StyleSheet, View} from 'react-native';


console.disableYellowBox = true;


const AppNavigator = createStackNavigator(
    {
        WelcomeScreen: {
            screen: WelcomeScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        SelectNetworkServerScreen: {
            screen: SelectNetworkServerScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        ScanScreen: {
            screen: ScanScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        SettingsScreen: {
            screen: SettingsScreen,
            navigationOptions: {
                headerShown: false
            }
        },
    },
    {

    }
);

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#29ABDB',
    },
});



