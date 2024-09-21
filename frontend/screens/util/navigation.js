import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Navigation = () => {
    const navigation = useNavigation();
    const [navId, setNavId] = useState(null);

    // Fetch navId from AsyncStorage when the component mounts or when it is focused
    useEffect(() => {
        const fetchNavId = async () => {
            const storedNavId = await getData('navId');
            setNavId(storedNavId);
        };

        fetchNavId();
    }, [useIsFocused()]);  // This ensures it runs when the screen is focused

    const changeView = async (view, navId) => {
        await saveData('navId', navId);
        setNavId(navId);
        navigation.replace(view);
    }

    const saveData = async (key, value) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error saving data', error);
        }
    };

    const getData = async (key) => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value;
        } catch (error) {
            console.error('Error retrieving data', error);
        }
    };

    return (
        <View style={styles.bottomMenu}>
            <TouchableOpacity onPress={() => changeView("Explore", '1')}>
                <FontAwesomeIcon 
                    icon={faMagnifyingGlass} 
                    style={[styles.iconStyles, { color: navId === '1' ? '#49CBEB' : '#000' }]} 
                />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => changeView("Chats", '2')}>
                <FontAwesomeIcon 
                    icon={faComment} 
                    style={[styles.iconStyles, { color: navId === '2' ? '#49CBEB' : '#000' }]} 
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => changeView("Profile", '3')}>
                <FontAwesomeIcon 
                    icon={faUser} 
                    style={[styles.iconStyles, { color: navId === '3' ? '#49CBEB' : '#000' }]} 
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomMenu: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E4E5E6',
    },
    iconStyles: {
        width: '33%',
        padding: 16,
        marginVertical: 16,
        marginHorizontal: 32,
    },
});

export default Navigation;
