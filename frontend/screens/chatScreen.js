import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Button, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons/faMicrophone';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserComm from '../api_comm/user';
import ChatComm from '../api_comm/chat';
import MessageComm from '../api_comm/message';
import moment from 'moment';
import { getSocket } from './util/socket';
import { Audio } from 'expo-av';
import {IP, PORT} from '@env';

const Chat = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { username, profilePhoto } = route.params || {};

    const [userProfilePhoto, setUserProfilePhoto] = useState('https://via.placeholder.com/50');
    const [loggedUsername, setLoggedUsername] = useState('');
    const [loggedEmail, setLoggedEmail] = useState('');
    const [loggedProfilePhoto, setLoggedProfilePhoto] = useState('https://via.placeholder.com/50');
    const [message, setMessage] = useState("");
    const [chatExists, setChatExists] = useState(false);
    const [isChatAccepted, setIsChatAccepted] = useState(false);
    const [isParticipant1, setIsParticipant1] = useState(false);
    const [messages, setMessages] = useState([]);

    const userComm = new UserComm();
    const chatComm = new ChatComm();
    const messageComm = new MessageComm();
    const socket = getSocket();
    
    const flatListRef = useRef(null);

    const defaultProfilePhoto = { uri: 'http://' + IP + ':' + PORT + '/files/profile_photos/default_profile_photo.jpg' };

    useEffect(() => {
        const checkChatStatus = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const { username: loggedUsername, email: loggedEmail, profilePhoto: loggedProfilePhoto } = JSON.parse(userData);
                    setLoggedUsername(loggedUsername);
                    setLoggedEmail(loggedEmail);
                    setLoggedProfilePhoto(loggedProfilePhoto);

                    const defaultProfilePhotoPath = 'http://' + IP + ':' + PORT + '/files/profile_photos';
                    const profilePhotoPath = `${defaultProfilePhotoPath}/${profilePhoto}`;
                    setUserProfilePhoto({ uri: profilePhotoPath });

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

    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false); // Track if the timer is running
    const intervalRef = useRef(null); // Store interval reference

    // Start the interval
    const startInterval = () => {
        if (!isRunning) {
            setIsRunning(true);
            intervalRef.current = setInterval(() => {
            setSecondsElapsed((prev) => prev + 1);
            }, 1000);
        }
    };

    // Stop the interval
    const stopInterval = () => {
        if (isRunning) {
            setSecondsElapsed(0);
            setIsRunning(false);
            clearInterval(intervalRef.current);
        }
    };

    // Format time to mm:ss
    const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const [recording, setRecording] = React.useState();
    const [recordingData, setRecordingData] = React.useState();

    async function startRecording() {
        try {
            const perm = await Audio.requestPermissionsAsync();
            if (perm.status === "granted") {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true
                });
                const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
                setRecording(recording);

                startInterval();
            }
        } catch (err) {}
    }

    async function stopRecording() {
        // setRecording(undefined);

        await recording.stopAndUnloadAsync();
        // let allRecordings = [...recordings];
        const { sound, status } = await recording.createNewLoadedSoundAsync();
        setRecordingData({
            sound: sound,
            duration: getDurationFormatted(status.durationMillis),
            file: recording.getURI()
        });
        // allRecordings.push({
        //     sound: sound,
        //     duration: getDurationFormatted(status.durationMillis),
        //     file: recording.getURI()
        // });

        console.log('Sound:', sound);
        console.log('Duration:', getDurationFormatted(status.durationMillis));
        console.log('File:', recording.getURI());

        stopInterval();
    }

    function getDurationFormatted(milliseconds) {
        const minutes = milliseconds / 1000 / 60;
        const seconds = Math.round((minutes - Math.floor(minutes)) * 60);
        return seconds < 10 ? `${Math.floor(minutes)}:0${seconds}` : `${Math.floor(minutes)}:${seconds}`
    }

    // function getRecordingLines() {
    //     return recordings.map((recordingLine, index) => {
    //         return (
    //             <View key={index} style={styles.row}>
    //             <Text style={styles.fill}>
    //             Recording #{index + 1} | {recordingLine.duration}
    //             </Text>
    //             <Button onPress={() => recordingLine.sound.replayAsync()} title="Play"></Button>
    //             </View>
    //         );
    //     });
    // }

    function clearRecording() {
        setRecording(null);
        setRecordingData(null);
    }

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
                        <Image source={userProfilePhoto} style={styles.headerPhoto} />
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
                            {!recordingData && (
                                <>
                                    <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={recording ? styles.stopRecordingButton : styles.startRecordingButton}>
                                        <FontAwesomeIcon 
                                            icon={faMicrophone} 
                                            style={styles.microphoneIcon} 
                                        />
                                    </TouchableOpacity>
                                </>
                            )}
                            {recording ? (
                                <>
                                    {recordingData ? (
                                        <>
                                            <TouchableOpacity onPress={clearRecording} style={styles.stopRecordingButton}>
                                                <FontAwesomeIcon 
                                                    icon={faTrash} 
                                                    style={styles.microphoneIcon} 
                                                />
                                            </TouchableOpacity>
                                            <View style={styles.voiceInputContainer}>
                                                <TouchableOpacity onPress={() => recordingData.sound.replayAsync()} style={styles.playButton}>
                                                    <FontAwesomeIcon 
                                                        icon={faPlay} 
                                                        style={styles.playIcon} 
                                                    />
                                                </TouchableOpacity>
                                                <Text style={styles.voiceInputTimer}>
                                                    {/* {getDurationFormatted(recording._finalDurationMillis || 0)} */}
                                                    {recordingData.duration}
                                                </Text>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.timerText}>{formatTime(secondsElapsed)}</Text>
                                        </>
                                    )}
                                </>
                            ) : (
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
                                </>
                            )}
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
        marginHorizontal: 8,
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
    },
    microphoneIcon: {
        color: '#FFF',
        fontSize: 16,
    },
    startRecordingButton: {
        backgroundColor: '#49CBEB',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopRecordingButton: {
        backgroundColor: '#F00',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingHorizontal: 7,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#49CBEB',
        fontSize: 16,
    },
    timerText: {
        flex: 1,
        backgroundColor: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        padding: 14,
        textAlign: 'center',
    },
    voiceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    voiceInputTimer: {
        backgroundColor: '#FFF',
        fontSize: 16,
        paddingHorizontal: 7,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
    }
});

export default Chat;
