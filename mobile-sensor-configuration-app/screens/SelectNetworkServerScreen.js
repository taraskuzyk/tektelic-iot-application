import React, {Component} from 'react';
import {Text, View, StyleSheet, TouchableWithoutFeedback, Alert, Button, Platform} from 'react-native';
import RadioForm, { RadioButton, RadioButtonInput, RadioButtonLabel } from 'react-native-simple-radio-button';
import {Icon} from "native-base";
import {Header} from "react-native-elements";

const radioProps = [
    {label: 'Actility', value: 0},
    {label: 'LORIOT', value: 0},
    {label: 'Orbiwise', value: 0},
    {label: 'Senet', value: 0},
    {label: 'The Things Network', value: 'TTN' },
    //{label: 'TEKTELIC - Vegas Demo', value: 'tektelic-demo-customer' },
    {label: 'TEKTELIC - North America', value: 0 },
    {label: 'TEKTELIC - Europe', value: 'TEKTELICEU' },
    //{label: 'TEKTELIC - Nemish Home', value: 'tektelic-nemish-home' },

];

export default class SelectNetworkServerScreen extends Component {

    state = {
        radioValue: 0,
        radioLabel: "",
    };

    render() {
        return(
        <View style={styles.container}>
            <Header
                centerComponent={
                    <Text style={{color: "#FFF", fontSize:18}}>Select Network Server</Text>
                }
                rightComponent={
                    <Icon
                        name={Platform.OS === 'ios'? "ios-arrow-round-forward" : "md-arrow-round-forward"}
                        onPress={()=> {
                            if (this.state.radioValue === 0)
                                Alert.alert("LoRaWAN error",
                                    "No LoRaWAN coverage for this Network Server in your location");
                            else
                                this.props.navigation.navigate('ScanScreen', {ns: this.state.radioValue});
                        }}
                        style={{color: "#FFF", marginRight: 10,}}
                    />
                }
            />
            <View style={{
                marginTop:20,
                marginLeft:20,
            }}>
                <RadioForm
                    style={{

                    }}
                    radio_props={radioProps}
                    initial={0}
                    onPress={(radioValue) => {this.setState({radioValue:radioValue})}}
                />
            </View>
        </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    listItem: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        width: '100%',
        marginTop: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    listText: {
        fontSize: 16,
    }
});