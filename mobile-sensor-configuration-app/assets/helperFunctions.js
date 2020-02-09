export var Base64Binary = {
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // will return a Uint8Array type
    decodeArrayBuffer: function(input) {
        var bytes = (input.length/4) * 3;
        var ab = new ArrayBuffer(bytes);
        this.decode(input, ab);

        return ab;
    },

    removePaddingChars: function(input){
        var lkey = this._keyStr.indexOf(input[input.length - 1]);
        if(lkey === 64){
            return input.substring(0,input.length - 1);
        }
        return input;
    },

    decode: function (input, arrayBuffer) {
        //get last chars to see if are valid
        input = this.removePaddingChars(input);
        input = this.removePaddingChars(input);

        var bytes = parseInt((input.length / 4) * 3, 10);

        var uarray;
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        var j = 0;

        if (arrayBuffer)
            uarray = new Uint8Array(arrayBuffer);
        else
            uarray = new Uint8Array(bytes);

        //input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        for (i=0; i<bytes; i+=3) {
            //get the 3 octets in 4 ascii chars
            enc1 = this._keyStr.indexOf(input[j++]);
            enc2 = this._keyStr.indexOf(input[j++]);
            enc3 = this._keyStr.indexOf(input[j++]);
            enc4 = this._keyStr.indexOf(input[j++]);

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            uarray[i] = chr1;
            if (enc3 !== 64) uarray[i+1] = chr2;
            if (enc4 !== 64) uarray[i+2] = chr3;
        }

        return uarray;
    }
};

/**********************************************************************************************************************/


export function decode_data(data, port) { //data - Array of bytes. Base64 to Array decoder for ECMAScript 6 is commented.
//You will need a different solution if you are using ECMAScript 5. An ES5 compatible decoder is on our road map.

    function extract_bytes(chunk, start_bit, end_bit) {
        var total_bits = end_bit - start_bit + 1;
        var total_bytes = total_bits % 8 === 0 ? to_uint(total_bits / 8) : to_uint(total_bits / 8) + 1;
        var offset_in_byte = start_bit % 8;
        var end_bit_chunk = total_bits % 8;

        var arr = new Array(total_bytes);


        for (var byte = 0; byte < total_bytes; ++byte) {
            var chunk_idx = to_uint(start_bit / 8) + byte;
            var lo = chunk[chunk_idx] >> offset_in_byte;
            var hi = 0;
            if (byte < total_bytes - 1) {
                hi = (chunk[chunk_idx + 1] & ((1 << offset_in_byte) - 1)) << (8 - offset_in_byte);
            } else if (end_bit_chunk !== 0) {
                // Truncate last bits
                lo = lo & ((1 << end_bit_chunk) - 1);
            }

            arr[byte] = hi | lo;
        }

        return arr;
    }

    function apply_data_type(bytes, data_type) {
        var output = 0;
        if (data_type === "unsigned") {
            for (var i = 0; i < bytes.length; ++i) {
                output = (to_uint(output << 8)) | bytes[i];
            }

            return output;
        }

        if (data_type === "signed") {
            for (var i = 0; i < bytes.length; ++i) {
                output = (output << 8) | bytes[i];
            }

            // Convert to signed, based on value size
            if (output > Math.pow(2, 8*bytes.length-1))
                output -= Math.pow(2, 8*bytes.length);


            return output;
        }

        if (data_type === "bool") {
            return !(bytes[0] === 0);
        }

        if (data_type === "hexstring") {
            return toHexString(bytes);
        }

        // Incorrect data type
        return null;
    }

    function decode_field(chunk, start_bit, end_bit, data_type) {
        var chunk_size = chunk.length;
        if (end_bit >= chunk_size * 8) {
            return null; // Error: exceeding boundaries of the chunk
        }

        if (end_bit < start_bit) {
            return null; // Error: invalid input
        }

        var arr = extract_bytes(chunk, start_bit, end_bit);
        return apply_data_type(arr, data_type);
    }

    let decoded_data = {};
    let decoder = [];


    if (port === 10) {
        decoder = [
            {
                key: [0x00, 0xFF],
                fn: function(arg) {
                    // Battery Voltage
                    decoded_data.battery_voltage = decode_field(arg, 0, 15, "signed")*0.01;
                    return 2;
                }
            },
            {
                key: [0x01, 0x00],
                fn: function(arg) {
                    // Digital input
                    decoded_data.digital_input = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x02, 0x00],
                fn: function(arg) {
                    // Light detected
                    decoded_data.light_detected = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x03, 0x67],
                fn: function(arg) {
                    // Temperature
                    decoded_data.temperature = decode_field(arg, 0, 15, "signed")*0.1;
                    return 2;
                }
            },
            {
                key: [0x04, 0x68],
                fn: function(arg) {
                    // Relative humidity
                    decoded_data.relative_humidity = decode_field(arg, 0, 7, "unsigned")*0.5;
                    return 1;
                }
            },
            {
                key: [0x05, 0x02],
                fn: function(arg) {
                    // Impact magnitude
                    decoded_data.impact_magnitude = decode_field(arg, 0, 15, "signed")*0.001;
                    return 2;
                }
            },
            {
                key: [0x06, 0x00],
                fn: function(arg) {
                    // Break-in
                    decoded_data.break_in = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x07, 0x71],
                fn: function(arg) {
                    //
                    decoded_data.acceleration_x = decode_field(arg, 0, 15, "signed")*0.001;
                    decoded_data.acceleration_y = decode_field(arg, 16, 31, "signed")*0.001;
                    decoded_data.acceleration_z = decode_field(arg, 32, 47, "signed")*0.001;
                    return 6;
                }
            },
            {
                key: [0x08, 0x04],
                fn: function(arg) {
                    // Input count
                    decoded_data.input_count = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x09, 0x00],
                fn: function(arg) {
                    // Moisture
                    decoded_data.moisture = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x0A, 0x00],
                fn: function(arg) {
                    // Motion
                    decoded_data.motion = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x0B, 0x67],
                fn: function(arg) {
                    // MCU temperature
                    decoded_data.mcu_temperature = decode_field(arg, 0, 15, "signed")*0.1;
                    return 2;
                }
            },
            {
                key: [0x0C, 0x00],
                fn: function(arg) {
                    // Impact alarm
                    decoded_data.impact_alarm = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x0D, 0x04],
                fn: function(arg) {
                    // Motion event count
                    decoded_data.motion_event_count = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
        ]
    }
    if (port === 100) {
        decoder = [
            {
                key: [0x00],
                fn: function(arg) {
                    // Device EUI
                    decoded_data.device_eui = decode_field(arg, 0, 63, "hexstring");
                    return 8;
                }
            },
            {
                key: [0x01],
                fn: function(arg) {
                    // App EUI
                    decoded_data.app_eui = decode_field(arg, 0, 63, "hexstring");
                    return 8;
                }
            },
            {
                key: [0x02],
                fn: function(arg) {
                    // App Key
                    decoded_data.app_key = decode_field(arg, 0, 127, "hexstring");
                    return 16;
                }
            },
            {
                key: [0x03],
                fn: function(arg) {
                    // Device Address
                    decoded_data.device_address = decode_field(arg, 0, 31, "hexstring");
                    return 4;
                }
            },
            {
                key: [0x04],
                fn: function(arg) {
                    // Network Session Key
                    decoded_data.network_session_key = decode_field(arg, 0, 127, "hexstring");
                    return 16;
                }
            },
            {
                key: [0x05],
                fn: function(arg) {
                    // AppSKey
                    decoded_data.app_session_key = decode_field(arg, 0, 127, "hexstring");
                    return 16;
                }
            },
            {
                key: [0x10],
                fn: function(arg) {
                    // Join Mode
                    decoded_data.loramac_otaa = decode_field(arg, 7, 7, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x11],
                fn: function(arg) {
                    // loramac_opts
                    decoded_data.loramac_confirm_mode = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.loramac_networks = decode_field(arg, 1, 1, "unsigned")*1;
                    decoded_data.loramac_duty_cycle = decode_field(arg, 2, 2, "unsigned")*1;
                    decoded_data.loramac_adr = decode_field(arg, 3, 3, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x12],
                fn: function(arg) {
                    // loramac_dr_tx_power
                    decoded_data.loramac_dr_number = decode_field(arg, 0, 3, "unsigned")*1;
                    decoded_data.loramac_tx_power = decode_field(arg, 8, 11, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x13],
                fn: function(arg) {
                    // loramac_rx2
                    decoded_data.loramac_rx2_frequency = decode_field(arg, 0, 31, "unsigned")*1;
                    decoded_data.loramac_rx2_dr = decode_field(arg, 32, 39, "unsigned")*1;
                    return 5;
                }
            },
            {
                key: [0x19],
                fn: function(arg) {
                    // Net ID MSB
                    decoded_data.loramac_net_id_msb = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x1A],
                fn: function(arg) {
                    // Net ID LSB
                    decoded_data.loramac_net_id_lsb = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x20],
                fn: function(arg) {
                    // Sets the core tick in seconds for periodic events
                    decoded_data.tick_seconds = decode_field(arg, 0, 31, "unsigned")*1;
                    return 4;
                }
            },
            {
                key: [0x21],
                fn: function(arg) {
                    // Ticks between Battery reports
                    decoded_data.tick_battery = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x22],
                fn: function(arg) {
                    // Ticks per Temperature report
                    decoded_data.tick_temperature = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x23],
                fn: function(arg) {
                    // Ticks per Humidity report
                    decoded_data.tick_relative_humidity = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x24],
                fn: function(arg) {
                    // Ticks per Digital Input report
                    decoded_data.tick_digital_input = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x25],
                fn: function(arg) {
                    // Ticks per Light report
                    decoded_data.tick_light = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x26],
                fn: function(arg) {
                    // Ticks per Accelerometer report
                    decoded_data.tick_acceleration = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x27],
                fn: function(arg) {
                    // Ticks per MCU Temperature report
                    decoded_data.tick_mcu_temperature = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x28],
                fn: function(arg) {
                    // Ticks per PIR report
                    decoded_data.tick_pir = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x2A],
                fn: function(arg) {
                    // reed_switch_mode
                    decoded_data.reed_switch_rising_edge = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.reed_switch_falling_edge = decode_field(arg, 1, 1, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x2B],
                fn: function(arg) {
                    // Count Threshold
                    decoded_data.reed_switch_count_threshold = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x2C],
                fn: function(arg) {
                    // reed_switch_value_to_tx
                    decoded_data.reed_switch_report_state = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.reed_switch_report_count = decode_field(arg, 1, 1, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x2D],
                fn: function(arg) {
                    // external_connector_mode
                    decoded_data.external_connector_rising_edge = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.external_connector_falling_edge = decode_field(arg, 1, 1, "unsigned")*1;
                    decoded_data.external_connector_functionality = decode_field(arg, 7, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x2E],
                fn: function(arg) {
                    // Number of triggers for event transmission
                    decoded_data.external_connector_count_threshold = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x2F],
                fn: function(arg) {
                    // external_connector_values_to_tx
                    decoded_data.external_connector_report_state = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.external_connector_report_count = decode_field(arg, 1, 1, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x30],
                fn: function(arg) {
                    // Break-In Threshold (10 milli-g)
                    decoded_data.accelerometer_break_in_threshold = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x31],
                fn: function(arg) {
                    // Impact threshold (10 milli-g)
                    decoded_data.accelerometer_impact_threshold = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x32],
                fn: function(arg) {
                    // accelerometer_values_to_transmit
                    decoded_data.accelerometer_report_alarm = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.accelerometer_report_magnitude = decode_field(arg, 1, 1, "unsigned")*1;
                    decoded_data.accelerometer_report_full_precision = decode_field(arg, 2, 2, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x33],
                fn: function(arg) {
                    // Seconds to wait before reporting impacts again
                    decoded_data.accelerometer_impact_grace_period = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x34],
                fn: function(arg) {
                    // accelerometer_mode
                    decoded_data.accelerometer_break_in_threshold_enable = decode_field(arg, 0, 15, "unsigned")*1;
                    decoded_data.accelerometer_impact_threshold_enable = decode_field(arg, 0, 15, "unsigned")*1;
                    decoded_data.accelerometer_enable = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x35],
                fn: function(arg) {
                    // Transducer sample rate
                    decoded_data.accelerometer_sample_rate = decode_field(arg, 0, 2, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x39],
                fn: function(arg) {
                    // Sample rate of Temperature/RH in seconds in Idle State
                    decoded_data.temperature_relative_humidity_sample_period_idle = decode_field(arg, 0, 31, "unsigned")*1;
                    return 4;
                }
            },
            {
                key: [0x3A],
                fn: function(arg) {
                    // Sample rate of Temperature/RH in seconds in Active State
                    decoded_data.temperature_relative_humidity_sample_period_active = decode_field(arg, 0, 31, "unsigned")*1;
                    return 4;
                }
            },
            {
                key: [0x3B],
                fn: function(arg) {
                    // temp_thresholds
                    decoded_data.temperature_low_threshold = decode_field(arg, 0, 7, "signed")*1;
                    decoded_data.temperature_high_threshold = decode_field(arg, 8, 15, "signed")*1;
                    return 2;
                }
            },
            {
                key: [0x3C],
                fn: function(arg) {
                    // Temperature threshold enable
                    decoded_data.temperature_threshold_enable = decode_field(arg, 0, 0, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x3D],
                fn: function(arg) {
                    // rh_thresholds
                    decoded_data.relative_humidity_low_threshold = decode_field(arg, 0, 7, "unsigned")*1;
                    decoded_data.relative_humidity_high_threshold = decode_field(arg, 8, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x3E],
                fn: function(arg) {
                    // Humidity threshold enable
                    decoded_data.relative_humidity_threshold_enable = decode_field(arg, 0, 0, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x40],
                fn: function(arg) {
                    // Sample rate of MCU Temperature in seconds in Idle State
                    decoded_data.mcu_temperature_sample_period_idle = decode_field(arg, 0, 31, "unsigned")*1;
                    return 4;
                }
            },
            {
                key: [0x41],
                fn: function(arg) {
                    // Sample rate of MCU Temperature in seconds in Active State
                    decoded_data.mcu_temperature_sample_period_active = decode_field(arg, 0, 31, "unsigned")*1;
                    return 4;
                }
            },
            {
                key: [0x42],
                fn: function(arg) {
                    // mcu_temp_threshold
                    decoded_data.mcu_temperature_high_threshold = decode_field(arg, 0, 7, "signed")*1;
                    decoded_data.mcu_temparature_low_threshold = decode_field(arg, 8, 15, "signed")*1;
                    return 2;
                }
            },
            {
                key: [0x43],
                fn: function(arg) {
                    // MCU temperature threshold
                    decoded_data.mcu_temp_threshold_enable = decode_field(arg, 0, 0, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x47],
                fn: function(arg) {
                    // Light Sample period
                    decoded_data.light_sample_period = decode_field(arg, 0, 31, "unsigned")*1;
                    return 4;
                }
            },
            {
                key: [0x48],
                fn: function(arg) {
                    // Light Threshold
                    decoded_data.light_threshold = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x50],
                fn: function(arg) {
                    // PIR Grace period
                    decoded_data.pir_grace_period = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x51],
                fn: function(arg) {
                    // PIR events before motion is detected
                    decoded_data.pir_threshold = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x52],
                fn: function(arg) {
                    // Period to count PIR events over
                    decoded_data.pir_threshold_period = decode_field(arg, 0, 15, "unsigned")*1;
                    return 2;
                }
            },
            {
                key: [0x53],
                fn: function(arg) {
                    // pir_mode
                    decoded_data.pir_motion_state = decode_field(arg, 0, 0, "unsigned")*1;
                    decoded_data.pir_motion_count = decode_field(arg, 1, 1, "unsigned")*1;
                    decoded_data.pir_event_enable = decode_field(arg, 6, 6, "unsigned")*1;
                    decoded_data.pir_sensor_enable = decode_field(arg, 7, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x5A],
                fn: function(arg) {
                    // Moisture sample period
                    decoded_data.moisture_sample_period = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x5B],
                fn: function(arg) {
                    // Moisture detection threshold
                    decoded_data.moisture_threshold = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x5C],
                fn: function(arg) {
                    // Moisture sensing
                    decoded_data.moisture_enable = decode_field(arg, 0, 0, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x5D],
                fn: function(arg) {
                    // "Dry" calibration
                    decoded_data.moisture_dry = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
            {
                key: [0x71],
                fn: function(arg) {
                    // Firmware version
                    decoded_data.app_major_version = decode_field(arg, 0, 7, "unsigned")*1;
                    decoded_data.app_minor_version = decode_field(arg, 8, 15, "unsigned")*1;
                    decoded_data.app_revision = decode_field(arg, 16, 23, "unsigned")*1;
                    decoded_data.loramac_major_version = decode_field(arg, 24, 31, "unsigned")*1;
                    decoded_data.loramac_minor_version = decode_field(arg, 32, 39, "unsigned")*1;
                    decoded_data.loramac_revision = decode_field(arg, 40, 47, "unsigned")*1;
                    decoded_data.region = decode_field(arg, 48, 55, "unsigned")*1;
                    return 7;
                }
            },
            {
                key: [0x72],
                fn: function(arg) {
                    // Factory reset
                    decoded_data.configuration_factory_reset = decode_field(arg, 0, 7, "unsigned")*1;
                    return 1;
                }
            },
        ]
    }

    decoded_data['raw'] = JSON.stringify(byteToArray(data));
    decoded_data['port'] = port;

    for (var bytes_left = data.length; bytes_left > 0; ) {
        var found = false;
        for (var i = 0; i < decoder.length; i++) {
            var item = decoder[i];
            var key = item.key;
            var keylen = key.length;
            var header = data.slice(0, keylen);
            // Header in the data matches to what we expect
            if (is_equal(header, key)) {
                var f = item.fn;
                var consumed = f(data.slice(keylen, data.length)) + keylen;
                bytes_left -= consumed;
                data = data.slice(consumed, data.length);
                found = true;
                break;
            }
        }
        if (found) {
            continue;
        }
        // No header located, abort
        return decoded_data;
    }

    return decoded_data;
}

// Converts value to unsigned
function to_uint(x) {
    return x >>> 0;
}

export function ArrayToBase64(arrayBuffer) {
    let base64 = '';
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    const bytes = new Uint8Array(arrayBuffer);
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    let a, b, c, d;
    let chunk;

    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63;               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder === 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3)   << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder === 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
}

// Checks if two arrays are equal
function is_equal(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (var i = 0 ; i !== arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function byteToArray(byteArray) {
    let arr = [];
    for(var i = 0; i < byteArray.length; i++) {
        arr.push(byteArray[i]);
    }

    return arr;
}

function toHexString(byteArray) {
    var arr = [];
    for (var i = 0; i < byteArray.length; ++i) {
        arr.push(('0' + (byteArray[i] & 0xFF).toString(16)).slice(-2));
    }
    return arr.join('');
}

export function encode_data(data, port) {
    var ret = [];

    if (port === 100) {
        check_encode("device_eui",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x00 ])
            }
        );
        check_encode("app_eui",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x01 ])
            }
        );
        check_encode("app_key",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x02 ])
            }
        );
        check_encode("device_address",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x03 ])
            }
        );
        check_encode("network_session_key",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x04 ])
            }
        );
        check_encode("app_session_key",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x05 ])
            }
        );
        check_encode("loramac_otaa",
            function(value) {
                var converted = [0x10 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x10 ])
            }
        );
        check_encode("loramac_opts",
            function(value) {
                var converted = [0x11 | 0x80,
                    ((value.loramac_confirm_mode & 0x1) << 0) |
                    ((value.loramac_networks & 0x1) << 1) |
                    ((value.loramac_duty_cycle & 0x1) << 2) |
                    ((value.loramac_adr & 0x1) << 3),
                    0x00 ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x11 ])
            }
        );
        check_encode("loramac_dr_tx_power",
            function(value) {
                var converted = [0x12 | 0x80,
                    ((value.loramac_dr_number & 0xf) << 0),
                    ((value.loramac_tx_power & 0xf) << 0) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x12 ])
            }
        );
        check_encode("loramac_rx2",
            function(value) {
                var converted = [0x13 | 0x80,
                    (value.loramac_rx2_frequency >> 24) & 0xff,(value.loramac_rx2_frequency >> 16) & 0xff, (value.loramac_rx2_frequency >> 8) & 0xff, value.loramac_rx2_frequency & 0xff,
                    value.loramac_rx2_dr & 0xff ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x13 ])
            }
        );
        check_encode("loramac_net_id_msb",
            function(value) {
                var converted = [0x19 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x19 ])
            }
        );
        check_encode("loramac_net_id_lsb",
            function(value) {
                var converted = [0x1A | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x1A ])
            }
        );
        check_encode("tick_seconds",
            function(value) {
                var converted = [0x20 | 0x80,
                    (value >> 24) & 0xff,(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x20 ])
            }
        );
        check_encode("tick_battery",
            function(value) {
                var converted = [0x21 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x21 ])
            }
        );
        check_encode("tick_temperature",
            function(value) {
                var converted = [0x22 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x22 ])
            }
        );
        check_encode("tick_relative_humidity",
            function(value) {
                var converted = [0x23 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x23 ])
            }
        );
        check_encode("tick_digital_input",
            function(value) {
                var converted = [0x24 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x24 ])
            }
        );
        check_encode("tick_light",
            function(value) {
                var converted = [0x25 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x25 ])
            }
        );
        check_encode("tick_acceleration",
            function(value) {
                var converted = [0x26 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x26 ])
            }
        );
        check_encode("tick_mcu_temperature",
            function(value) {
                var converted = [0x27 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x27 ])
            }
        );
        check_encode("tick_pir",
            function(value) {
                var converted = [0x28 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x28 ])
            }
        );
        check_encode("reed_switch_mode",
            function(value) {
                var converted = [0x2A | 0x80,
                    ((value.reed_switch_rising_edge & 0x1) << 0) |
                    ((value.reed_switch_falling_edge & 0x1) << 1) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x2A ])
            }
        );
        check_encode("reed_switch_count_threshold",
            function(value) {
                var converted = [0x2B | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x2B ])
            }
        );
        check_encode("reed_switch_value_to_tx",
            function(value) {
                var converted = [0x2C | 0x80,
                    ((value.reed_switch_report_state & 0x1) << 0) |
                    ((value.reed_switch_report_count & 0x1) << 1) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x2C ])
            }
        );
        check_encode("external_connector_mode",
            function(value) {
                var converted = [0x2D | 0x80,
                    ((value.external_connector_rising_edge & 0x1) << 0) |
                    ((value.external_connector_falling_edge & 0x1) << 1) |
                    ((value.external_connector_functionality & 0x1) << 7) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x2D ])
            }
        );
        check_encode("external_connector_count_threshold",
            function(value) {
                var converted = [0x2E | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x2E ])
            }
        );
        check_encode("external_connector_values_to_tx",
            function(value) {
                var converted = [0x2F | 0x80,
                    ((value.external_connector_report_state & 0x1) << 0) |
                    ((value.external_connector_report_count & 0x1) << 1) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x2F ])
            }
        );
        check_encode("accelerometer_break_in_threshold",
            function(value) {
                var converted = [0x30 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x30 ])
            }
        );
        check_encode("accelerometer_impact_threshold",
            function(value) {
                var converted = [0x31 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x31 ])
            }
        );
        check_encode("accelerometer_values_to_transmit",
            function(value) {
                var converted = [0x32 | 0x80,
                    ((value.accelerometer_report_alarm & 0x1) << 0) |
                    ((value.accelerometer_report_magnitude & 0x1) << 1) |
                    ((value.accelerometer_report_full_precision & 0x1) << 2) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x32 ])
            }
        );
        check_encode("accelerometer_impact_grace_period",
            function(value) {
                var converted = [0x33 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x33 ])
            }
        );
        check_encode("accelerometer_mode",
            function(value) {
                var converted = [0x34 | 0x80,
                    ((value.accelerometer_break_in_threshold_enable & 0x1) << 0) |
                    ((value.accelerometer_impact_threshold_enable & 0x1) << 1) |
                    ((value.accelerometer_enable & 0x1) << 7) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x34 ])
            }
        );
        check_encode("accelerometer_sample_rate",
            function(value) {
                var converted = [0x35 | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x35 ])
            }
        );
        check_encode("temperature_relative_humidity_sample_period_idle",
            function(value) {
                var converted = [0x39 | 0x80,
                    (value >> 24) & 0xff,(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x39 ])
            }
        );
        check_encode("temperature_relative_humidity_sample_period_active",
            function(value) {
                var converted = [0x3A | 0x80,
                    (value >> 24) & 0xff,(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x3A ])
            }
        );
        check_encode("temp_thresholds",
            function(value) {
                var converted = [0x3B | 0x80,
                    value.temperature_low_threshold & 0xff,
                    value.temperature_high_threshold & 0xff ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x3B ])
            }
        );
        check_encode("temperature_threshold_enable",
            function(value) {
                var converted = [0x3C | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x3C ])
            }
        );
        check_encode("rh_thresholds",
            function(value) {
                var converted = [0x3D | 0x80,
                    value.relative_humidity_low_threshold & 0xff,
                    value.relative_humidity_high_threshold & 0xff ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x3D ])
            }
        );
        check_encode("relative_humidity_threshold_enable",
            function(value) {
                var converted = [0x3E | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x3E ])
            }
        );
        check_encode("mcu_temperature_sample_period_idle",
            function(value) {
                var converted = [0x40 | 0x80,
                    (value >> 24) & 0xff,(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x40 ])
            }
        );
        check_encode("mcu_temperature_sample_period_active",
            function(value) {
                var converted = [0x41 | 0x80,
                    (value >> 24) & 0xff,(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x41 ])
            }
        );
        check_encode("mcu_temp_threshold",
            function(value) {
                var converted = [0x42 | 0x80,
                    value.mcu_temperature_high_threshold & 0xff,
                    value.mcu_temparature_low_threshold & 0xff ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x42 ])
            }
        );
        check_encode("mcu_temp_threshold_enable",
            function(value) {
                var converted = [0x43 | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x43 ])
            }
        );
        check_encode("light_sample_period",
            function(value) {
                var converted = [0x47 | 0x80,
                    (value >> 24) & 0xff,(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x47 ])
            }
        );
        check_encode("light_threshold",
            function(value) {
                var converted = [0x48 | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x48 ])
            }
        );
        check_encode("pir_grace_period",
            function(value) {
                var converted = [0x50 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x50 ])
            }
        );
        check_encode("pir_threshold",
            function(value) {
                var converted = [0x51 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x51 ])
            }
        );
        check_encode("pir_threshold_period",
            function(value) {
                var converted = [0x52 | 0x80,
                    (value >> 8) & 0xff, value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x52 ])
            }
        );
        check_encode("pir_mode",
            function(value) {
                var converted = [0x53 | 0x80,
                    ((value.pir_motion_state & 0x1) << 0) |
                    ((value.pir_motion_count & 0x1) << 1) |
                    ((value.pir_event_enable & 0x1) << 6) |
                    ((value.pir_sensor_enable & 0x1) << 7) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x53 ])
            }
        );
        check_encode("moisture_sample_period",
            function(value) {
                var converted = [0x5A | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x5A ])
            }
        );
        check_encode("moisture_threshold",
            function(value) {
                var converted = [0x5B | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x5B ])
            }
        );
        check_encode("moisture_enable",
            function(value) {
                var converted = [0x5C | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x5C ])
            }
        );
        check_encode("moisture_dry",
            function(value) {
                var converted = [0x5D | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x5D ])
            }
        );
        check_encode("write_to_flash",
            function(value) {
                var converted = [0x70 | 0x80,
                    ((value.app_configuration & 0x1) << 5) |
                    ((value.lora_configuration & 0x1) << 6),
                    ((value.restart_sensor & 0x1) << 0) ];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x70 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("firmware_version",
            function(value) {
            },
            function() {
                ret = ret.concat(ret, [ 0x71 ])
            }
        );
        check_encode("configuration_factory_reset",
            function(value) {
                var converted = [0x72 | 0x80,
                    value & 0xff];
                ret = ret.concat(converted);
            },
            function() {
                ret = ret.concat([ 0x72 ])
            }
        );
    }

    function check_encode(prop_name, do_write, do_read)
    {
        if (data.hasOwnProperty(prop_name)) {
            var obj = data[prop_name];
            if (obj.hasOwnProperty("write")) {
                var value = obj.write;
                do_write(value);
            }

            if (obj.hasOwnProperty("read") && obj.read === true) {
                do_read();
            }
        }
    }
    return ret;
}

export function formatDate(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
}



/**********************************************************************************************************************/