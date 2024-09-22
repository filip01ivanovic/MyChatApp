import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './util/navigation';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserComm from '../api_comm/user';
// import * as ImagePicker from 'expo-image-picker'; // Uncomment if using Expo ImagePicker
import { getSocket, disconnectSocket } from './util/socket';
import {IP, PORT} from '@env';

const Profile = () => {
    const navigation = useNavigation();

    const [profilePhoto, setProfilePhoto] = useState('https://via.placeholder.com/50');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    const userComm = new UserComm();
    const socket = getSocket();

    const defaultProfilePhoto = { uri: 'http://' + IP + ':' + PORT + '/files/profile_photos/default_profile_photo.jpg' };
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const { username, email, profilePhoto } = JSON.parse(userData);
                    setUsername(username);
                    setEmail(email);
                    setProfilePhoto(profilePhoto);
                    const defaultProfilePhotoPath = 'http://' + IP + ':' + PORT + '/files/profile_photos';
                    const profilePhotoPath = `${defaultProfilePhotoPath}/${profilePhoto}`;
                    setProfilePhoto({ uri: profilePhotoPath });
                }
            } catch (error) {
                console.error('Error fetching user data', error);
            }
        };

        fetchUserData();
    }, []);

    const saveData = async (key, value) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error saving data', error);
        }
    };

    const handleProfilePhotoUpdate = async () => {
        // Example using ImagePicker (Expo library)
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setProfilePhoto(result.uri);
        }
    };

    // const handleUsernameUpdate = async () => {
    //     try {
    //         // Fetch user data from AsyncStorage
    //         const userData = await AsyncStorage.getItem('userData');
    //         if (!userData) {
    //             Alert.alert('Error', 'No user data found');
    //             return;
    //         }
    
    //         const { username: oldUsername, email, profilePhoto } = JSON.parse(userData);
    
    //         // Update username
    //         const response = await userComm.updateUsername(oldUsername, username); // oldUsername, newUsername
    //         Alert.alert('Success', 'Username updated successfully');
    
    //         // Update AsyncStorage with new username
    //         const updatedUserData = JSON.stringify({ username, email, profilePhoto });
    //         await AsyncStorage.setItem('userData', updatedUserData);
    //     } catch (error) {
    //         const errorMessage = error.response?.data?.message || 'Failed to update username';
    //         Alert.alert('Error', errorMessage);
    //     }
    // };

    const handleEmailUpdate = async () => {
        try {
            const response = await userComm.updateEmail(username, email);
            Alert.alert('Success', 'Email updated successfully');
            // Update AsyncStorage
            await saveData('userData', JSON.stringify({ username, email, profilePhoto }));
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update email';
            Alert.alert('Error', errorMessage);
        }
    };

    const handlePasswordUpdate = async () => {
        if (newPassword !== repeatPassword) {
            Alert.alert('Error', 'New password and repeated password do not match.');
            return;
        }

        try {
            const response = await userComm.changePassword(username, oldPassword, newPassword, repeatPassword);
            Alert.alert('Success', 'Password updated successfully');
            setOldPassword('');
            setNewPassword('');
            setRepeatPassword('');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update password. Please check your old password.';
            Alert.alert('Error', errorMessage);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userData');

            // logoutuser from backend
            socket.emit('userLogout', username);

            // Disconnect the socket
            disconnectSocket();

            navigation.replace('Login');
        } catch (error) {
            console.error('Error during logout', error);
            Alert.alert('An error occurred during logout. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.backgroundStyle}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.textWrapper}>
                    <Text style={styles.topText}>Profile</Text>
                    <View style={styles.divider} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                    
                    <TouchableOpacity onPress={handleProfilePhotoUpdate} style={styles.photoContainer}>
                        <Image source={profilePhoto} style={styles.profilePhoto} />
                        <Text style={styles.updateText}>Update Profile Photo</Text>
                    </TouchableOpacity>

                    <Text style={styles.labelAbove}>Username:</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Username"
                        placeholderTextColor="#C4C5C6"
                        editable={false}
                    />
                    {/* <TouchableOpacity onPress={handleUsernameUpdate} style={styles.button}>
                        <Text style={styles.buttonText}>Update Username</Text>
                    </TouchableOpacity> */}

                    <Text style={styles.labelAbove}>Email:</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        keyboardType="email-address"
                        placeholderTextColor="#C4C5C6"
                    />
                    <TouchableOpacity onPress={handleEmailUpdate} style={styles.button}>
                        <Text style={styles.buttonText}>Update Email</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.labelAbove}>Password:</Text>
                    <TextInput
                        style={styles.input}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Old Password"
                        secureTextEntry
                        placeholderTextColor="#C4C5C6"
                    />
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New Password"
                        secureTextEntry
                        placeholderTextColor="#C4C5C6"
                    />
                    <TextInput
                        style={styles.input}
                        value={repeatPassword}
                        onChangeText={setRepeatPassword}
                        placeholder="Repeat New Password"
                        secureTextEntry
                        placeholderTextColor="#C4C5C6"
                    />
                    <TouchableOpacity onPress={handlePasswordUpdate} style={styles.button}>
                        <Text style={styles.buttonText}>Update Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.navContainer}>
            <Navigation />
        </View>
    </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    backgroundStyle: {
        flex: 1,
        backgroundColor: '#FFF'
    },
    scrollContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    container: {
        alignItems: 'center',
        width: '100%',
    },
    navContainer: {
        paddingBottom: 0,
    },
    textWrapper: {
        width: '100%',
    },
    topText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#111',
        textAlign: 'left',
        marginHorizontal: 16,
        marginVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E5E6',
    },
    photoContainer: {
        alignItems: 'center',
        marginVertical: 0,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 8
    },
    updateText: {
        fontWeight: '600',
        color: '#49CBEB',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        backgroundColor: '#f4f5f6',
        padding: 14,
        borderRadius: 25,
        marginVertical: 8,
        fontSize: 16,
        color: '#000',
    },
    button: {
        backgroundColor: '#49CBEB',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginVertical: 8,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#F00',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginTop: 18,
        marginBottom: 50,
        alignItems: 'center',
        width: '100%',
    },
    labelAbove: {
        alignSelf: 'flex-start',
        fontSize: 16,
        color: '#C4C5C6',
        paddingStart: 14,
        paddingTop: 14
    }
});

export default Profile;
