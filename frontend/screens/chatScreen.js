import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatComm from '../api_comm/chat';
import MessageComm from '../api_comm/message';
import moment from 'moment';
import { getSocket } from './util/socket';

const Chat = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { username, profilePhoto } = route.params || {};

    const [loggedUsername, setLoggedUsername] = useState('');
    const [loggedEmail, setLoggedEmail] = useState('');
    const [loggedProfilePhoto, setLoggedProfilePhoto] = useState('https://via.placeholder.com/50');
    const [message, setMessage] = useState("");
    const [chatExists, setChatExists] = useState(false);
    const [isChatAccepted, setIsChatAccepted] = useState(false);
    const [isParticipant1, setIsParticipant1] = useState(false);
    const [messages, setMessages] = useState([]);

    const chatComm = new ChatComm();
    const messageComm = new MessageComm();
    const socket = getSocket();
    
    const flatListRef = useRef(null);

    const defaultProfilePhoto = require('../default_profile_photo.jpg');

    useEffect(() => {
        const checkChatStatus = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const { username: loggedUsername, email: loggedEmail, profilePhoto: loggedProfilePhoto } = JSON.parse(userData);
                    setLoggedUsername(loggedUsername);
                    setLoggedEmail(loggedEmail);
                    setLoggedProfilePhoto(loggedProfilePhoto);

                    const response = await chatComm.getChatForUsers(loggedUsername, username);
                    if ((response.participant1 == loggedUsername && response.participant2 == username)
                        || (response.participant1 == username && response.participant2 == loggedUsername)) {
                        setChatExists(true);
                        setIsChatAccepted(response.isAccepted);
                        setIsParticipant1(response.participant1 === loggedUsername);

                        // Fetch messages for the chat
                        const messagesResponse = await messageComm.getMessagesForChat(loggedUsername, username);
                        setMessages(messagesResponse);

                        // Scroll to the bottom after loading messages
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 1);

                        messageComm.setMessagesToRead(loggedUsername, username);
                    } else {
                        setChatExists(false);
                    }
                }
                else {
                    setChatExists(false);
                }
            } catch (error) {
                console.error('Error checking chat status:', error);
            }
        };

        checkChatStatus();

        // Listen for new messages from the backend
        socket.on('newMessageSuccess', (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);

            // Scroll to the bottom after adding the new message
            setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
            }, 1);
        });

        // Listen for initial message from the backend
        socket.on('initialMessageSuccess', () => {
            console.log('Initial message success', loggedUsername);
            checkChatStatus();
        });

        // Listen for chat acceptance from the backend
        socket.on('acceptChatSuccess', () => {
            console.log('Accept chat success')
            checkChatStatus();
        });

        // Listen for chat rejection from the backend
        socket.on('rejectChatSuccess', () => {
            console.log('Reject chat success')
            setMessages([]);
            checkChatStatus();
        });

        // // Cleanup the socket listener on component unmount
        // return () => {
        //     socket.off('newMessageSuccess');
        // };
    }, []);

    const renderMessage = ({ item }) => {
        const formattedDate = moment(item.sentAt).format('HH:mm, D MMM YY');
    
        return (
            <View style={[styles.messageContainer, item.sender === loggedUsername ? styles.sentMessage : styles.receivedMessage]}>
                <Text style={styles.messageText}>{item.textMessage}</Text>
                <Text style={styles.messageDate}>{formattedDate}</Text>
            </View>
        );
    };

    const handleInvitation = () => {
        if (message != '') {
            socket.emit('initialMessage', {
                sender: loggedUsername,
                receiver: username,
                messageType: 'text',
                textMessage: message,
                voiceMessageUrl: null,
            });
            setMessage('');

            console.log('Invitation sent');
        }
    };

    const handleAccept = () => {
        socket.emit('acceptChat', {
            participant1: username,
            participant2: loggedUsername
        });

        console.log('Chat accepted');
    };

    const handleReject = () => {
        socket.emit('rejectChat', {
            participant1: username,
            participant2: loggedUsername
        });

        console.log('Chat rejected');
    };

    const handleSend = () => {
        if (message != '') {
            socket.emit('newMessage', {
                sender: loggedUsername,
                receiver: username,
                messageType: 'text',
                textMessage: message,
                voiceMessageUrl: null,
            });
            setMessage('');

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    return (
        <SafeAreaView style={styles.backgroundStyle}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <FontAwesomeIcon 
                            icon={faChevronLeft} 
                            style={styles.headerIcon} 
                        />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Image source={defaultProfilePhoto} style={styles.headerPhoto} />
                        <Text style={styles.headerTitle}>{username}</Text>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <View style={styles.inputContainer}>
                    {!chatExists && (
                        <>
                            <TextInput
                                style={styles.input}
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Type a message..."
                            />
                            <TouchableOpacity onPress={handleInvitation} style={styles.inviteButton}>
                                <Text style={styles.bottomButtonText}>Invite</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {chatExists && !isChatAccepted && isParticipant1 && (
                        <Text style={styles.invitationSentText}>Invitation sent</Text>
                    )}
                    {chatExists && !isChatAccepted && !isParticipant1 && (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                <TouchableOpacity onPress={handleAccept} style={styles.acceptButton}>
                                    <Text style={styles.bottomButtonText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleReject} style={styles.rejectButton}>
                                    <Text style={styles.rejectButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                    {chatExists && isChatAccepted && (
                        <>
                            <TextInput
                                style={styles.input}
                                value={message}
                                onChangeText={(text) => {
                                    setMessage(text);
                                    setTimeout(() => {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }, 1);
                                }}
                                placeholder="Type a message..."
                            />
                            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                                <Text style={styles.bottomButtonText}>Send</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    backgroundStyle: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E5E6',
    },
    headerIcon: {
        color: '#000',
        padding: 14,
        marginRight: 8,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'start',
    },
    headerPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    headerTitle: {
        color: '#000',
        fontSize: 18,
        fontWeight: '700',
    },
    messageList: {
        paddingHorizontal: 16,
        paddingVertical: 5
    },
    messageContainer: {
        marginVertical: 4,
        padding: 10,
        borderRadius: 20,
        maxWidth: '80%',
    },
    sentMessage: {
        backgroundColor: '#49CBEB',
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        backgroundColor: '#C4C5C6',
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 16,
        color: '#fff',
    },
    messageDate: {
        fontSize: 11,
        color: '#f4f5f6',
        marginTop: 2,
        alignSelf: 'flex-end'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E4E5E6',
        backgroundColor: '#FFF'
    },
    input: {
        flex: 1,
        backgroundColor: '#f4f5f6',
        fontSize: 16,
        color: '#000',
        padding: 14,
        borderRadius: 25,
        marginRight: 8,
    },
    invitationSentText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#C4C5C6',
        textAlign: 'center',
        paddingVertical: 14,
    },
    inviteButton: {
        backgroundColor: '#8EF3CC',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: '#8EF3CC',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        width: '50%'
    },
    rejectButton: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        width: 'auto'
    },
    sendButton: {
        backgroundColor: '#49CBEB',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    rejectButtonText: {
        color: '#C4C5C6',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default Chat;
