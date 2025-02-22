import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Dimensions,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Card } from 'react-native-paper';
import RNFS from 'react-native-fs';
import { SvgXml } from 'react-native-svg';
import { CommonActions } from '@react-navigation/native';

type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Sign up'
>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

const { width } = Dimensions.get('window');

// const folderPath = '/storage/emulated/0/Download/OBTRecorderApp';
const folderPath = RNFS.DocumentDirectoryPath;

const jsonFilePath = `${folderPath}/appInfo.json`;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');


  // This function handles the signup process by validating the username,
  // saving it to a JSON file, and navigating to the Home screen.
  const handleSignup = async () => {
    try {
      // Trim whitespace from the username and validate it
      const trimmedUsername = username.trim();

      if (!trimmedUsername) {
        // Show an error if the username is empty
        Alert.alert('Error', 'Username cannot be empty');
        return;
      }
      // Prepare the appInfo object with the trimmed username
      const appInfo = { username: trimmedUsername };

      console.log('appInfo:', appInfo);

      // Check if the target folder exists; if not, create it
      const folderExists = await RNFS.exists(folderPath);
      if (!folderExists) {
        await RNFS.mkdir(folderPath);
      }

      // Write the appInfo object to the JSON file
      await RNFS.writeFile(
        jsonFilePath,
        JSON.stringify(appInfo, null, 2),
        'utf8',
      );

      // Read and log the written data to confirm it was saved correctly
      const writtenData = await RNFS.readFile(jsonFilePath, 'utf8');
      console.log('Written Data:', writtenData);

      // Navigate to the Home screen by resetting the navigation stack

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        }),
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save username');
      console.error('Failed to save username:', error);
    }
  };

  const logo =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none" stroke="#ffffff">  <path d="m6.667 33.334 16.667-16.667m0 0V8.333L16.667 15m6.667 1.667h8.333m-15-1.667v8.334H25M16.667 15 10 21.667V30h8.334"></path>  <path d="M23.333 8.333c1.06-1.055 2.522-1.667 4.138-1.667a5.859 5.859 0 0 1 5.862 5.857c0 1.619-.603 3.084-1.667 4.143L25 23.334 18.333 30"></path></svg>';
  return (
    <View style={styles.container}>
      {/* <SVGImg width={200} height={200} /> */}

      <Card style={styles.glassCard}>
        <Card.Content>
          <View style={styles.container2}>
            <View style={styles.logoContainer}>
              <SvgXml xml={logo} width="100%" height="100%" />
            </View>
          </View>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />

          <Button title="Sign Up" onPress={handleSignup} />
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#d1d8e0',
    //opacity: 9,
    // alignContent: 'center',
  },
  container2: { justifyContent: 'center', alignItems: 'center' },
  glassCard: {
    width: width - 40,
    alignSelf: 'center',
    borderRadius: 15,
    overflow: 'hidden',
    // backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
  },
  logoContainer: {
    height: 50,
    width: 50,
    borderWidth: 1,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    marginBottom: 15,
    backgroundColor: '#ff6348',
    borderColor: '#747d8c',
    // shadowRadius: 15,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: '#2c3e50',
  },
  label: {
    marginBottom: 5,
    color: '#2980b9',
  },
});

export default SignupScreen;
