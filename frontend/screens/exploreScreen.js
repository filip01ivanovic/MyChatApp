import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './util/navigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserComm from '../api_comm/user';
import { getSocket } from './util/socket';
import {IP, PORT} from '@env';

const Explore = () => {
    const [loggedUsername, setLoggedUsername] = useState('');
    const [loggedEmail, setLoggedEmail] = useState('');
    const [loggedProfilePhoto, setLoggedProfilePhoto] = useState('https://via.placeholder.com/50');

    const [searchQuery, setSearchQuery] = useState("");
    const [usersData, setUsersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const userComm = new UserComm();
    const socket = getSocket();

    const defaultProfilePhoto = { uri: 'http://' + IP + ':' + PORT + '/files/profile_photos/default_profile_photo.jpg' };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'No user data found');
                return;
            }

            if (userData) {
                const { username: loggedUsername, email: loggedEmail, profilePhoto: loggedProfilePhoto } = JSON.parse(userData);
                setLoggedUsername(loggedUsername);
                setLoggedEmail(loggedEmail);
                setLoggedProfilePhoto(loggedProfilePhoto);

                const data = await userComm.getAllUsersWithUnreadMessages(loggedUsername);

                setUsersData(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchUsers();

            // Listen for new messages from the backend
            socket.on('newMessageSuccess', (newMessage) => {
                console.log('New message success');
                fetchUsers();
            });

            // Listen for initial message from the backend
            socket.on('initialMessageSuccess', () => {
                console.log('Initial message success');
                fetchUsers();
            });

            // Listen for chat acceptance from the backend
            socket.on('acceptChatSuccess', () => {
                console.log('Accept chat success')
                fetchUsers();
            });

            // Listen for chat rejection from the backend
            socket.on('rejectChatSuccess', () => {
                console.log('Reject chat success')
                fetchUsers();
            });

            // // Cleanup the socket listener on component unmount
            // return () => {
            //     socket.off('newMessageSuccess');
            // };
        }, [])
    );

    // Filter users based on search query
    const filteredData = usersData.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUserPress = (user) => {
        navigation.navigate('Chat', {
            username: user.username,
            profilePhoto: user.profilePhoto
        });
    };

    const renderItem = ({ item }) => {
        const defaultProfilePhotoPath = 'http://' + IP + ':' + PORT + '/files/profile_photos';
        const profilePhotoPath = `${defaultProfilePhotoPath}/${item.profilePhoto}`;
        const profilePhoto = { uri: profilePhotoPath };

        return (
            <TouchableOpacity onPress={() => handleUserPress(item)} style={styles.resultRow}>
                <View style={styles.resultLeft}>
                    <Image source={profilePhoto} style={styles.resultPhoto} />
                    <Text style={styles.resultUsername}>{item.username}</Text>
                </View>
                <View style={styles.chatRight}>
                    {item.chatExists && !item.isAccepted && item.unreadMessages > 0 && (
                        <View style={styles.unreadBadgeGreen}>
                            <Text style={styles.unreadText}>{item.unreadMessages}</Text>
                        </View>
                    )}
                    {item.chatExists && item.isAccepted && item.unreadMessages > 0 && (
                        <View style={styles.unreadBadgeBlue}>
                            <Text style={styles.unreadText}>{item.unreadMessages}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.backgroundStyle}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.textWrapper}>
                    <Text style={styles.topText}>Explore</Text>
                </View>

                <TextInput
                    placeholder="Search..."
                    placeholderTextColor='#C4C5C6'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                />

                <View style={styles.divider} />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E4E5E6" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        renderItem={renderItem}
                        keyExtractor={item => item.username}
                        contentContainerStyle={styles.resultsList}
                        style={styles.myFaltList}
                    />
                )}
            </View>

            <View style={styles.navContainer}>
                <Navigation />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    myFaltList: {
        marginBottom: 50
    },
    backgroundStyle: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    container: {
        flex: 1,
    },
    navContainer: {
        paddingBottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginVertical: 8,
    },
    searchInput: {
        backgroundColor: '#f4f5f6',
        fontSize: 16,
        color: '#000',
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 25,
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E5E6'
    },
    resultsList: {
        paddingHorizontal: 16,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    resultLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    resultUsername: {
        fontSize: 18,
        color: '#000',
        fontWeight: '600'
    },
    chatRight: {
        alignItems: 'flex-end',
    },
    unreadBadgeBlue: {
        backgroundColor: '#49CBEB',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    unreadBadgeGreen: {
        backgroundColor: '#8EF3CC',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    unreadText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
    },
});

export default Explore;
