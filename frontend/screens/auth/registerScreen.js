import React from 'react';
import { StatusBar, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from "react";
import { useNavigation } from '@react-navigation/native';
import UserComm from '../../api_comm/user';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';

const Register = () => {
    const navigation = useNavigation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [email, setEmail] = useState("");

    // State to track focus of inputs
    const [isUsernameFocused, setUsernameFocused] = useState(false);
    const [isPasswordFocused, setPasswordFocused] = useState(false);
    const [isRepeatPasswordFocused, setRepeatPasswordFocused] = useState(false);
    const [isEmailFocused, setEmailFocused] = useState(false);

    const registerAction = async () => {
        try {
            const userComm = new UserComm();
            const response = await userComm.register(username, password, repeatPassword, email);
            Alert.alert(response.message);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                Alert.alert('Registration failed', error.response.data.message);
            } else {
                Alert.alert('Registration failed', 'An error occurred during registration');
            }
        }
    }

    return (
        <SafeAreaView style={styles.backgroundStyle}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.textWrapper}>
                        <View style={styles.rowContainer}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <FontAwesomeIcon 
                                    icon={faChevronLeft} 
                                    style={[styles.iconStyle]} 
                                />
                            </TouchableOpacity>

                            <Text style={styles.topText}>Register</Text>
                        </View>

                        <TextInput
                            placeholder="Username"
                            placeholderTextColor='#CFD1D2'
                            value={username}
                            onChangeText={(text) => setUsername(text)}
                            onFocus={() => setUsernameFocused(true)}
                            onBlur={() => setUsernameFocused(false)}
                            style={[styles.input, { borderColor: isUsernameFocused ? '#49CBEB' : '#F4F5F6' }]}
                            autoCapitalize='none'
                        />

                        <TextInput
                            placeholder="Password"
                            placeholderTextColor='#CFD1D2'
                            value={password}
                            onChangeText={(text) => setPassword(text)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            keyboardType="visible-password"
                            secureTextEntry
                            style={[styles.input, { borderColor: isPasswordFocused ? '#49CBEB' : '#F4F5F6' }]}
                            autoCapitalize='none'
                        />

                        <TextInput
                            placeholder="Repeat password"
                            placeholderTextColor='#CFD1D2'
                            value={repeatPassword}
                            onChangeText={(text) => setRepeatPassword(text)}
                            onFocus={() => setRepeatPasswordFocused(true)}
                            onBlur={() => setRepeatPasswordFocused(false)}
                            keyboardType="visible-password"
                            secureTextEntry
                            style={[styles.input, { borderColor: isRepeatPasswordFocused ? '#49CBEB' : '#F4F5F6' }]}
                            autoCapitalize='none'
                        />

                        <TextInput
                            placeholder="Email"
                            placeholderTextColor='#CFD1D2'
                            value={email}
                            onChangeText={(text) => setEmail(text)}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            style={[styles.input, { borderColor: isEmailFocused ? '#49CBEB' : '#F4F5F6' }]}
                            autoCapitalize='none'
                        />

                        <TouchableOpacity
                            onPress={registerAction}
                            style={styles.registerButton}
                        >
                            <Text style={styles.registerButtonText}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    backgroundStyle: {
        flex: 1,
        backgroundColor: '#fff'
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrapper: {
        width: '100%',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12
    },
    iconStyle: {
        color: '#000',
        padding: 14,
        marginRight: 8,
    },
    topText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#111',
        textAlign: 'left'
    },
    input: {
        backgroundColor: '#f4f5f6',
        fontSize: 16,
        color: '#000',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderWidth: 2,
        borderRadius: 25
    },
    registerButton: {
        backgroundColor: '#49CBEB',
        marginHorizontal: 16,
        marginTop: 24,
        padding: 14,
        borderRadius: 25
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        color: '#fff'
    },
});

export default Register;
