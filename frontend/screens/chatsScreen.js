import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import Navigation from './util/navigation';
import { useNavigation, useFocusEffect  } from '@react-navigation/native';
import ChatComm from '../api_comm/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import UserComm from '../api_comm/user';
import { getSocket } from './util/socket';
import {IP, PORT} from '@env';

const Chats = () => {
    const [loggedUsername, setLoggedUsername] = useState('');
    const [loggedEmail, setLoggedEmail] = useState('');
    const [loggedProfilePhoto, setLoggedProfilePhoto] = useState('https://via.placeholder.com/50');

    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigation = useNavigation();

    const userComm = new UserComm();
    const socket = getSocket();

    const defaultProfilePhoto = { uri: 'http://' + IP + ':' + PORT + '/files/profile_photos/default_profile_photo.jpg' };

    const fetchChats = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const { username: loggedUsername, email: loggedEmail, profilePhoto: loggedProfilePhoto } = JSON.parse(userData);
                setLoggedUsername(loggedUsername);
                setLoggedEmail(loggedEmail);
                setLoggedProfilePhoto(loggedProfilePhoto);
    
                const chatComm = new ChatComm();
                
                const response = await chatComm.getChatsForUser(loggedUsername);
    
                const sortedChats = response.sort((a, b) => new Date(b.chat.lastMessage.sentAt) - new Date(a.chat.lastMessage.sentAt));
                
                // Fetch profile photos for each chat participant
                const chatsWithPhotos = await Promise.all(sortedChats.map(async chat => {
                    const otherParticipant = chat.chat.participant1 === loggedUsername ? chat.chat.participant2 : chat.chat.participant1;
                    const user = await userComm.getUserByUsername(otherParticipant);
                    return {
                        ...chat,
                        profilePhoto: user.profilePhoto
                    };
                }));
    
                setChats(chatsWithPhotos);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchChats(); // Fetch the chats when the screen is focused

            // Listen for new messages from the backend
            socket.on('newMessageSuccess', (newMessage) => {
                console.log('New message success');
                fetchChats();
            });

            // Listen for initial message from the backend
            socket.on('initialMessageSuccess', () => {
                console.log('Initial message success');
                fetchChats();
            });

            // Listen for chat acceptance from the backend
            socket.on('acceptChatSuccess', () => {
                console.log('Accept chat success')
                fetchChats();
            });

            // Listen for chat rejection from the backend
            socket.on('rejectChatSuccess', () => {
                console.log('Reject chat success')
                fetchChats();
            });

            // // Cleanup the socket listener on component unmount
            // return () => {
            //     socket.off('newMessageSuccess');
            // };
        }, [])
    );

    const handleChatPress = async (item) => {
        const otherParticipant = item.chat.participant1 === loggedUsername ? item.chat.participant2 : item.chat.participant1;
        const profilePhoto = item.profilePhoto;
        
        navigation.navigate('Chat', {
            username: otherParticipant,
            profilePhoto: profilePhoto,
        });
    };

    const renderItem = ({ item }) => {
        const formattedDate = moment(item.chat.lastMessage.sentAt).format('HH:mm, D MMM YY');

        const defaultProfilePhotoPath = 'http://' + IP + ':' + PORT + '/files/profile_photos';
        const profilePhotoPath = `${defaultProfilePhotoPath}/${item.profilePhoto}`;
        const profilePhoto = { uri: profilePhotoPath };

        return (
            <TouchableOpacity onPress={() => handleChatPress(item)} style={styles.chatRow}>
                <Image source={profilePhoto} style={styles.chatPhoto} />
                <View style={styles.chatDetails}>
                    <Text style={styles.chatName}>
                    {item.chat.participant1 === loggedUsername ? item.chat.participant2 || 'Unknown' : item.chat.participant1 || 'Unknown'}
                    </Text>
                    <Text style={styles.chatMessage}>{item.chat.lastMessage?.text || 'No message'}</Text>
                </View>
                <View style={styles.chatRight}>
                    <Text style={styles.chatTime}>
                    {formattedDate}
                    </Text>
                    {item.unreadMessages > 0 && (
                    <View style={item.chat.isAccepted ? styles.unreadBadgeBlue : styles.unreadBadgeGreen}>
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
                    <Text style={styles.topText}>Chats</Text>
                </View>

                <View style={styles.divider} />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E4E5E6" />
                    </View>
                ) : (
                    <FlatList
                        data={chats}
                        renderItem={renderItem}
                        keyExtractor={item => item.chat._id}
                        contentContainerStyle={styles.chatList}
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
        marginBottom: 50,
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
        color: '#111',
        textAlign: 'left',
        marginHorizontal: 16,
        marginVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E5E6',
    },
    chatList: {
        paddingHorizontal: 16,
    },
    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    chatPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    chatDetails: {
        flex: 1,
    },
    chatRight: {
        alignItems: 'flex-end',
    },
    chatName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 1,
    },
    chatMessage: {
        fontSize: 14,
        color: '#C4C5C6',
        marginTop: 2,
    },
    chatTime: {
        fontSize: 12,
        color: '#C4C5C6',
        marginBottom: 2,
    },
    unreadBadgeBlue: {
        backgroundColor: '#49CBEB',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 2,
    },
    unreadBadgeGreen: {
        backgroundColor: '#8EF3CC',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 2,
    },
    unreadText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default Chats;
