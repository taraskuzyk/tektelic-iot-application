import React, { Component } from 'react';
import {
    Alert,
    Dimensions,
    LayoutAnimation,
    Text,
    View,
    StyleSheet,
    Platform
} from 'react-native';

import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import {Icon} from "native-base";
import {Header} from "react-native-elements";

export default class ScanScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            hasCameraPermission: null,
            isSensorOnboarded: false,
            isAlertUp: false,
            isOnFirstRender: true,
            ns: this.props.navigation.getParam('ns'),
        };
    }

    componentDidMount() {
        this._requestCameraPermission();
    }

    _requestCameraPermission = async () => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermission: status === 'granted',
        });
    };

    _handleBarCodeRead = result => {

        if(!this.state.isAlertUp) {
            this.setState({isAlertUp: true});
            LayoutAnimation.spring();

            const temp = result.data.split(':');
            const sensor = {
                devEUI: temp[3],
                appEUI: temp[2],
                orderCode: temp[4]
            };
            Alert.alert(
                'On-board this sensor?',
                'DevEUI: ' + sensor.devEUI + '\n' +
                'AppEUI: ' + sensor.appEUI + '\n' +
                'OrderCode: ' + sensor.orderCode,
                [
                    {
                        text: 'Yes',
                        onPress: async () => {
                            //connectSensorToApplication(sensor, application);
                            this.setState({isSensorOnboarded: true});
                            this.props.navigation.navigate('SettingsScreen', {sensor: sensor, ns: this.state.ns});
                            //Alert.alert(this.state.ns);
                            this.setState({isAlertUp: false});
                        },
                    },
                    {
                        text: 'No', onPress: () => {
                            this.setState({isAlertUp: false});
                        }
                    },
                ],
                {cancellable: false}
            );

        }
    };



    render() {
        this.props.navigation.addListener(
            'willFocus',
            () => {
                this.setState({isSensorOnboarded: false})
            }
        );
        // https://stackoverflow.com/questions/48497358/reactjs-maximum-update-depth-exceeded-error
        // this is why isOnFirstRender is needed!
        if (this.props.navigation.getParam('isSensorDeleted') && this.state.isOnFirstRender)
            this.setState({isSensorOnboarded: false, isOnFirstRender: false});
        //after Deleting the sensor, set the isSensorOnboarded === false
        return (
            <View style={styles.container}>
                <Header
                    leftComponent={
                        <Icon
                            name={Platform.OS === 'ios'? "ios-arrow-round-back" : "md-arrow-round-back"}
                            onPress={()=>{this.props.navigation.goBack()}}
                            style={{color: "#FFF", marginLeft: 10}}
                        />

                    }
                    centerComponent={
                        <Text style={{color: "#FFF", fontSize:18}}>Scan Your Sensor</Text>
                    }

                />
                {
                    this.state.hasCameraPermission === null ?
                        <Text>Requesting for camera permission</Text>
                        :
                        this.state.hasCameraPermission === false ?
                            <Text style={{ color: '#fff' }}>Couldn't access camera. Try going back to the previous step.</Text>
                            :
                            (this.state.isSensorOnboarded) === false ?
                                <BarCodeScanner onBarCodeScanned={this._handleBarCodeRead} style={{
                                    height: Dimensions.get('window').height,
                                    width: Dimensions.get('window').width,
                                }}
                                />
                                :
                                <Text style={{color:'#FFF'}}>{"An error has occured. Please press the arrow button."}</Text>
                }

            </View>

        );
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#000',
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
    url: {
        flex: 1,
    },
    urlText: {
        color: '#fff',
        fontSize: 20,
    },
    cancelButton: {
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
    },
});

/*async function connectSensorToApplication(sensor, application) {

    let content = JSON.stringify({
        "altitude": 0,
        "app_id": application.id,
        "attributes": {
            "key": "",
            "value": ""
        },
        "description": 'Smart Room Sensor - ' + sensor.orderCode,
        "dev_id": sensor.orderCode,
        "latitude": 52.375,
        "longitude": 4.887,
        "lorawan_device": {
            "activation_constraints": "local",
            "app_eui": application.eui,
            "app_id": application.id,
            "app_key": "01020304050607080102030405060709",
            "app_s_key": "01020304050607080102030405060709",
            "dev_addr": "01020304",
            "dev_eui": sensor.devEUI,
            "dev_id": sensor.orderCode,
            "disable_f_cnt_check": false,
            "f_cnt_down": 0,
            "f_cnt_up": 0,
            "last_seen": 0,
            "nwk_s_key": "01020304050607080102030405060709",
            "uses32_bit_f_cnt": true
        }
    });

    fetch('http://' + application.region + '.thethings.network:8084/applications/'+application.id+'/devices', {
        method: 'PUT',
        headers: {
            'Authorization': 'Key ' + application.key,
            'Content-Type': 'application/json',
            'Content-Length': content.length,
        },
        body: content,
    });
    Alert.alert(content);
}*/
