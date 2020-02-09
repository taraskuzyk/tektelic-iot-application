import React from 'react'
import { StyleSheet, View, Platform, Text, Switch, Alert, TouchableOpacity, AsyncStorage, ScrollView } from 'react-native'
import { Divider } from 'react-native-elements'
import { Icon, Picker } from "native-base"
import { Header } from "react-native-elements"
import { encode_data, decode_data, formatDate, Base64Binary, ArrayToBase64 } from "../assets/helperFunctions.js"


const io = require('socket.io-client');
const DEFAULT_REPORTING_FREQUENCY = 60;

export default class SettingsScreen extends React.Component {


    constructor(props){
        super(props);

        this.state = {
            updateSettings: false,
            colorFlip: false,
            tick_seconds: DEFAULT_REPORTING_FREQUENCY,
            tick_battery: false,
            tick_temperature: false,
            tick_relative_humidity: false,
            tick_digital_input: false,
            moisture_enable: false,
            impact_alarm_enable: false,
            tick_pir: false,

            sensor: this.props.navigation.getParam('sensor'),
            //sensor: {devEUI: ""},
            ns: this.props.navigation.getParam('ns'),
            //ns: "12",

            battery_voltage: "",
            digital_input: "",
            moisture: "",
            temperature: "",
            relative_humidity: "",
            impact_alarm: "",
            acceleration: "",
            time: "",
        };


        this.socket = io('https://tek-test-app.ngrok.io', {
            transports: ['websocket'],
        });


        this.socket.emit('info', {
            devEUI: this.state.sensor.devEUI,
            ns: this.state.ns,
        });

        this.socket.on('uplink', (uplink)=> {

            let data = decode_data(Base64Binary.decode(uplink.payload), uplink.port);

            this.setState({colorFlip: !this.state.colorFlip});

            this.setState({time: formatDate(new Date())});

            if (data.hasOwnProperty('battery_voltage')) {
                this.setState({battery_voltage: data.battery_voltage.toFixed(1)});
            }
            if (data.hasOwnProperty('temperature')) {
                this.setState({temperature: data.temperature.toFixed(1)});
            }
            if (data.hasOwnProperty('moisture')) {
                this.setState({moisture: data.moisture.toFixed(1)});
            } else {
                this.setState({moisture: 0})
            }
            if (data.hasOwnProperty('relative_humidity')) {
                this.setState({relative_humidity: data.relative_humidity.toFixed(1)});
            }
            if (data.hasOwnProperty('digital_input')) {
                this.setState({digital_input: data.digital_input});
            }
            if (data.hasOwnProperty('impact_alarm')) {
                let acceleration = data.impact_magnitude*9.8;
                this.setState({acceleration: acceleration.toFixed()});
            } else {
                this.setState({impact_alarm: 0});
            }
        });
    }

    async componentDidMount() {
        try {
            const previousString = await AsyncStorage.getItem('savedState');
            const previousState = JSON.parse(previousString);
            let devEUI;
            if (this.props.navigation.getParam('sensor')) {
                devEUI = this.props.navigation.getParam('sensor').devEUI;
            }
            if (devEUI === previousState.sensor.devEUI)
                this.setState(JSON.parse(value));

        } catch (error) {

        }
    }

    render() {

        const settingsValue = {
            fontSize: 16,
            color: this.state.colorFlip ? '#AA2222' : '#999',
            marginRight: 10

        };

        return (
            <ScrollView style={{backgroundColor: '#EEE',flex: 1}}>

                <Header
                    leftComponent={
                        <Icon
                            name={Platform.OS === 'ios'? "ios-close-circle" : "md-close-circle"}
                            style={{color: "#FFF", marginLeft: 10}}
                            onPress={()=> {
                                Alert.alert('WARNING!', 'Do you want delete this sensor?',
                                    [
                                        {
                                            text: 'Yes',
                                            onPress: async () => {

                                                this.setState({});
                                                //this.saveState();
                                                try {
                                                    await AsyncStorage.setItem('savedState', '');
                                                } catch (error) {
                                                    Alert.alert('Something went wrong', error.toString())
                                                }

                                                this.props.navigation.navigate('ScanScreen')
                                            },
                                        },
                                        { text: 'No', onPress: () => {} },
                                    ],
                                    { cancellable: false });
                            }}
                        />
                    }
                    centerComponent={
                        <Text style={{color: "#FFF", fontSize:18}}>Sensor Settings</Text>
                    }
                />

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Reporting Frequency</Text>
                    <Picker
                        selectedValue={this.state.tick_seconds}
                        style={{ height: 50, width: 200}}
                        onValueChange={(itemValue, itemIndex) =>
                            this.setState({tick_seconds: itemValue})
                        }>
                        <Picker.Item label={getReportingFrequencyString(60)} value={60} />
                        <Picker.Item label={getReportingFrequencyString(300)} value={300} />
                        <Picker.Item label={getReportingFrequencyString(900)} value={900} />
                        <Picker.Item label={getReportingFrequencyString(3600)} value={3600} />
                        <Picker.Item label={getReportingFrequencyString(14400)} value={14400} />
                        <Picker.Item label={getReportingFrequencyString(43200)} value={43200} />
                        <Picker.Item label={getReportingFrequencyString(86400)} value={86400} />
                    </Picker>
                </View>

                <Divider style={{backgroundColor: "#000", height: 1, width: "40%", marginVertical: 20, alignSelf: "center"}}/>

                <Text style={styles.settingsTitle}>Which values would you like to report?</Text>

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Battery Level</Text>
                    {this.state.tick_battery && this.state.battery_voltage!== "" ?
                        <Text style={settingsValue}>{(this.state.battery_voltage)} V</Text>
                        :
                        <Text></Text>
                    }
                    <Switch
                        value={this.state.tick_battery}
                        onValueChange ={(tick_battery)=>{
                            this.setState({tick_battery});
                            this.setState({updateSettings: true})
                        }}
                    />
                </View>

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Temperature</Text>
                    {this.state.tick_temperature!==false && this.state.temperature!== "" ?
                        <Text style={settingsValue}>{(this.state.temperature)} C</Text>
                        :
                        <Text></Text>
                    }

                    <Switch
                        value={this.state.tick_temperature}
                        onValueChange ={(tick_temperature)=>{
                            this.setState({tick_temperature});
                            this.setState({updateSettings: true})
                        }}
                    />
                </View>

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Humidity</Text>
                    {this.state.tick_relative_humidity!==false && this.state.relative_humidity!== "" ?
                        <Text style={settingsValue}>{(this.state.relative_humidity)} %</Text>
                        :
                        <Text></Text>
                    }

                    <Switch
                        value={this.state.tick_relative_humidity}
                        onValueChange ={(tick_relative_humidity)=>{
                            this.setState({tick_relative_humidity});
                            this.setState({updateSettings: true})
                        }}
                    />
                </View>

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Open & Close</Text>
                    {this.state.tick_digital_input!==false && this.state.digital_input!== "" ?
                        <Text style={{
                            fontSize: 16,
                            color: this.state.digital_input ? '#AA2222' : '#999',
                            marginRight: 10
                        }}>{(this.state.digital_input ? 'Open' : 'Close')}</Text>
                        :
                        <Text></Text>
                    }
                    <Switch
                        value={this.state.tick_digital_input}
                        onValueChange ={(tick_digital_input)=>{
                            this.setState({tick_digital_input});
                            this.setState({updateSettings: true});
                        }}
                    />
                </View>

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Leak detection</Text>
                    {this.state.moisture_enable!==false && this.state.moisture !== "" ?
                        <Text style={{
                            fontSize: 16,
                            color: this.state.moisture ? '#AA2222' : '#999',
                            marginRight: 10
                        }}>{(this.state.moisture ? 'Wet' : 'Dry')}</Text>
                        :
                        <Text></Text>
                    }

                    <Switch
                        value={this.state.moisture_enable}
                        onValueChange ={(moisture_enable)=>{
                            this.setState({moisture_enable});
                            this.setState({updateSettings: true})
                        }}
                    />
                </View>

                {/*<View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Acceleration</Text>
                    {this.state.impact_alarm_enable!==false && this.state.impact_alarm !== "" ?
                        <Text style={{
                            fontSize: 16,
                            color: this.state.impact_alarm ? '#AA2222' : '#999',
                            marginRight: 10
                        }}>{(this.state.impact_alarm ? this.state.acceleration+ 'm / s²' : 'No movement')}</Text>
                        :
                        <Text></Text>
                    }

                    <Switch
                        value={this.state.impact_alarm_enable}
                        onValueChange ={(impact_alarm_enable)=>{
                            this.setState({impact_alarm_enable});
                            this.setState({updateSettings: true})
                        }}
                    />
                </View>*/}

                <View style={styles.settingsItem}>
                    <Text style={styles.settingsTitle}>Last update received on</Text>
                    <Text style={settingsValue}>{this.state.time}</Text>

                </View>

                <TouchableOpacity style={{
                    backgroundColor: '#FFF',
                    flex: 0,
                    marginTop:20,
                    marginBottom:20,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
                      onPress={()=> {
                          const data= {
                              tick_seconds: {write: this.state.tick_seconds},
                              tick_battery: {write: this.state.tick_battery ? 1 : 0},
                              tick_temperature: {write: this.state.tick_temperature ? 1 : 0},
                              tick_relative_humidity: {write: this.state.tick_relative_humidity ? 1 : 0},
                              tick_digital_input: {write: this.state.tick_digital_input ? 1 : 0},
                              moisture_enable: {write: this.state.moisture_enable ? 0xff : 0},
                              moisture_sample_period: {write: 1},

                              accelerometer_values_to_transmit: {
                                  accelerometer_report_alarm: {write: this.state.impact_alarm_enable ? 1 : 0},
                                  accelerometer_report_magnitude: {write: this.state.impact_alarm_enable ? 1 : 0},
                              },
                              accelerometer_mode: {
                                  accelerometer_impact_threshold_enable: {wrote: this.state.impact_alarm_enable ? 1 : 0},
                                  accelerometer_enable: {wrote: this.state.impact_alarm_enable ? 1 : 0}
                              },
                              accelerometer_impact_threshold: {wrote: this.state.impact_alarm_enable ? 250 : 0},

                              tick_acceleration: {write: this.state.tick_acceleration ? 1 : 0},
                              //tick_pir: {write: this.state.tick_pir ? 1 : 0}
                          };
                          const downlink = {
                              devEUI: this.state.sensor.devEUI,
                              port: "100",
                              data: ArrayToBase64((encode_data(data, 100)))
                          };
                          //Alert.alert('Alert', JSON.stringify(data,null,2));
                          this.socket.emit("downlink", downlink);
                          this.setState({updateSettings: false});
                      }}>
                    <Text></Text>
                    <Text style={{
                        color: this.state.updateSettings ? '#29ABDB' : 'black',
                        marginLeft: 20,
                        fontSize: 20}}>Save Changes</Text>
                    <Icon
                        name={Platform.OS === 'ios'? "ios-save" : "md-save"}
                        style={{color: "#29ABDB", marginRight: 10}}
                    />
                </TouchableOpacity>
                
            </ScrollView>
        );
    }

    async componentWillUnmount(){
        try {
            await AsyncStorage.setItem('savedState', JSON.stringify(this.state));
        } catch (error) {
            Alert.alert('Something went wrong', error.toString())
        }
        this.socket.disconnect();
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsItem: {
        backgroundColor: '#FFF',
        flex: 0,
        marginTop:20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    settingsTitle: {
        fontSize: 16,
        marginLeft: 10
    },
    dataValue: {
    },
    settingsValue: {
        fontSize: 16,
        color: "#999",
        marginRight: 10
    },
});

/**********************************************************************************************************************/

function getReportingFrequencyString(seconds){
    if (seconds === 60)
        return "1 minute";
    if (seconds === 300)
        return "5 minutes";
    if (seconds === 900)
        return "15 minutes";
    if (seconds === 3600)
        return "1 hour";
    if (seconds === 14400)
        return "4 hours";
    if (seconds === 43200)
        return "12 hours";
    if (seconds === 86400)
        return "24 hours";
}