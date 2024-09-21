import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './screens/auth/loginScreen';
import Register from './screens/auth/registerScreen';
import Chats from './screens/chatsScreen';
import Explore from './screens/exploreScreen';
import Profile from './screens/profileScreen';
import Navigation from './screens/util/navigation';
import Chat from './screens/chatScreen';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer >
      <Stack.Navigator initialRouteName='Login' screenOptions={{headerShown: false, animationEnabled: false}}>
        <Stack.Screen  name="Login" component={Login} />
        <Stack.Screen  name="Register" component={Register} />
        <Stack.Screen  name="Explore" component={Explore} />
        <Stack.Screen  name="Chats" component={Chats} />
        <Stack.Screen  name="Profile" component={Profile} />
        <Stack.Screen  name="Navigation" component={Navigation} />
        <Stack.Screen  name="Chat" component={Chat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
