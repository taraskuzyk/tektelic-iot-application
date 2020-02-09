import React, {Component} from 'react';
import {Text, View, StyleSheet, Button, Image, AsyncStorage} from 'react-native';

export default class WelcomeScreen extends Component {

    static navigationOptions = {
        headerShown: false,
    };

    async componentDidMount(){
        try {
            const previousStateString = await AsyncStorage.getItem('savedState');
            const previousState = JSON.parse(previousStateString);
            if (previousState.sensor) {
                this.props.navigation.navigate('SettingsScreen', {sensor: previousState.sensor, ns: previousState.ns})
            }
        } catch (error) {

        }
    }

    render() {
        return (

            <View style={styles.container}>
                <View style={{
                    backgroundColor:'#29ABDB',
                    padding: 50,
                }}>
                    <Image
                        style={{height:100}}
                        source={require("../assets/teklogo.png")}
                        resizeMode='contain'
                    />
                </View>
                <Text style={{marginTop:50}}>Welcome to TEKTELIC sensor app!</Text>

                <View
                style = {{
                    marginTop:20,
                    textColor:'white',
                    }}>
                    <Button
                        onPress={()=>{this.props.navigation.navigate('SelectNetworkServerScreen')}}
                        title="Get started"
                        style={{
                            backgroundColor:'#29ABDB'
                        }}

                    />
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#EEE',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        flexDirection: 'row',
    },
});