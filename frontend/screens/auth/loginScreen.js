import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UserComm from '../../api_comm/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createSocket } from '../util/socket';
// import dotenv from 'dotenv';
import {IP, PORT} from '@env';

const Login = () => {
    const navigation = useNavigation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // State to track focus of inputs
    const [isUsernameFocused, setUsernameFocused] = useState(false);
    const [isPasswordFocused, setPasswordFocused] = useState(false);

    // dotenv.config();

    const loginAction = async (username, password) => {
        try {
            const userComm = new UserComm();
            const response = await userComm.login(username, password);
    
            if (response.message === 'Login successful') {
                await AsyncStorage.setItem('userData', JSON.stringify(response.user));
                await AsyncStorage.setItem('navId', '2');
    
                // Connect to WebSocket server after successful login
                const socket = createSocket('http://' + IP + ':' + PORT);

                socket.on('connect', () => {
                    console.log('User connected (frontend). Socket ID:', socket.id);
                    socket.emit('userLogin', username);
                });
    
                navigation.replace('Chats');
            } else {
                Alert.alert('Login failed', response.message);
            }
        } catch (error) {
            const errorMessage = error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : 'An error occurred during login';
            
            Alert.alert('Login failed', errorMessage);
        }
    };    

    return (
        <SafeAreaView style={styles.backgroundStyle}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.textWrapper}>
                        <Text style={styles.topText}>
                            Login
                        </Text>

                        <TextInput
                            placeholder="Username"
                            placeholderTextColor='#C4C5C6'
                            value={username}
                            onChangeText={(text) => setUsername(text)}
                            onFocus={() => setUsernameFocused(true)}
                            onBlur={() => setUsernameFocused(false)}
                            style={[styles.input, { borderColor: isUsernameFocused ? '#49CBEB' : '#F4F5F6' }]}
                            autoCapitalize='none'
                        />

                        <TextInput
                            placeholder="Password"
                            placeholderTextColor='#C4C5C6'
                            value={password}
                            onChangeText={(text) => setPassword(text)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            keyboardType="visible-password"
                            secureTextEntry
                            style={[styles.input, { borderColor: isPasswordFocused ? '#49CBEB' : '#F4F5F6' }]}
                            autoCapitalize='none'
                        />
                    </View>

                    {/* <TouchableOpacity>
                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                    </TouchableOpacity> */}

                    <View style={styles.textWrapper}>
                        <TouchableOpacity
                            onPress={() => loginAction(username, password)}
                            style={styles.loginButton}
                        >
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>

                        <Text style={styles.orText}>
                            or
                        </Text>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.registerButton}
                        >
                            <Text style={styles.registerButtonText}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>    
        </SafeAreaView>
    )
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
    topText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#000',
        textAlign: 'left',
        marginHorizontal: 16,
        marginBottom: 12
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
    forgotPassword: {
        fontSize: 16,
        fontWeight: '700',
        color: '#49CBEB',
        marginHorizontal: 16,
        marginTop: 24
    },
    loginButton: {
        backgroundColor: '#49CBEB',
        marginHorizontal: 16,
        marginTop: 24,
        padding: 14,
        borderRadius: 25
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        color: '#fff'
    },
    registerButton: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderRadius: 25,
        borderColor: '#49CBEB',
        borderWidth: 2
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        color: '#49CBEB',
    },
    orText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 12
    }
});

export default Login;
