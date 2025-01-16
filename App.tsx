import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import SignupScreen from './screens/SignupScreen';
import { enableScreens } from 'react-native-screens';
import ProjectEditorScreen from './screens/ProjectEditorScreen';
import RNFS from 'react-native-fs';
import { ActivityIndicator, View, Alert, Platform, PermissionsAndroid } from 'react-native';
import {
  checkManagePermission,
  requestManagePermission,
} from 'manage-external-storage';
import ImportReferenceModal from './screens/importRefernceModal';
import Loader from './screens/Loader';

enableScreens();

export type RootStackParamList = {
  Home: undefined;
  'Sign up': undefined;
  ReferencePage: undefined;
  ProjectEditor: { projectId: string; projectName: string, projectPath: string, referenceResource: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = React.useState<'Sign up' | 'Home'>(
    'Sign up',
  );
  const [isLoading, setIsLoading] = React.useState(true);

 /**
   * Requests WRITE_EXTERNAL_STORAGE permission for Android devices.
   * Prompts the user to allow storage access if not already granted.
   */
  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to store project files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting storage permission:', err);
      return false;
    }
  };

    /**
   * Checks if WRITE_EXTERNAL_STORAGE permission is granted for Android devices.
   * Returns true if permission is already granted, otherwise false.
   */
  const checkStoragePermission = async () => {
    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return result;
    } catch (err) {
      console.error('Error checking storage permission:', err);
      return false;
    }
  };

    /**
   * Handles storage permissions based on the Android version.
   * For Android 11 and above, checks for MANAGE_EXTERNAL_STORAGE permission.
   * For lower versions, checks and requests WRITE_EXTERNAL_STORAGE permission.
   */
  const handlePermissions = async () => {
    try {
      // Check Android version
      const androidVersion = Platform.Version as number;

      if (Platform.OS === 'android') {
        if (androidVersion >= 30) { // Android 11 or higher
          // Check for MANAGE_EXTERNAL_STORAGE permission
          const hasManagePermission = await checkManagePermission();

          if (!hasManagePermission) {
            // Request MANAGE_EXTERNAL_STORAGE permission
            const permissionGranted = await requestManagePermission();

            if (!permissionGranted) {
              Alert.alert(
                'Permission Required',
                'All Files Access permission is required for Android 11 and above. Please grant permission in Settings.',
                [{ text: 'OK' }]
              );
              return false;
            }
          }
        } else { // Android 10 or lower
          // Check for regular storage permission
          const hasStoragePermission = await checkStoragePermission();

          if (!hasStoragePermission) {
            // Request regular storage permission
            const permissionGranted = await requestStoragePermission();

            if (!permissionGranted) {
              Alert.alert(
                'Permission Required',
                'Storage permission is required for the app to function properly.',
                [{ text: 'OK' }]
              );
              return false;
            }
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error handling permissions:', error);
      Alert.alert(
        'Error',
        'There was an error checking permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

    /**
   * Checks and creates the required folder and `appInfo.json` file in external storage.
   * Ensures permissions are handled and sets the initial route based on the presence of a username.
   */
  const checkAndCreateFolderAndFile = async () => {
    // const folderPath = `${RNFS.ExternalStorageDirectoryPath}/Download/OBTRecorderApp`;
    const folderPath = `${RNFS.DocumentDirectoryPath}`;
    const filePath = `${folderPath}/appInfo.json`;
    console.log(RNFS.DocumentDirectoryPath, 'folder path')
    try {
      // First handle permissions based on Android version
      const hasPermission = await handlePermissions();

      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      // Check if the folder exists
      const folderExists = await RNFS.exists(folderPath);

      if (!folderExists) {
        // Folder doesn't exist, create it
        await RNFS.mkdir(folderPath);
        console.log('Folder OBTRecorderApp created');
      } else {
        console.log('Folder OBTRecorderApp already exists');
      }

      // Check if the file exists
      const fileExists = await RNFS.exists(filePath);

      if (!fileExists) {
        // File doesn't exist, create it with default content
        const defaultContent = JSON.stringify({ username: null });
        await RNFS.writeFile(filePath, defaultContent, 'utf8');
        console.log('File appInfo.json created with default content');
      } else {
        console.log('File appInfo.json already exists');
      }

      // Read the file and check the value of username
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const { username } = JSON.parse(fileContent);

      if (username && username.trim() !== '') {
        // Redirect to Home if username is not null or empty
        setInitialRoute('Home');
      }
    } catch (error) {
      console.error('Error checking/creating folder/file:', error);
      Alert.alert(
        'Error',
        'There was an error setting up the app storage. Please check your permissions and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Set loading to false to render the NavigationContainer
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkAndCreateFolderAndFile();
  }, []);


  if (isLoading) {
    // Show a loading indicator while checking the initial route
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader visible={true} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Sign up" component={SignupScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerStyle: {
              height: 0,
            },
          }}
        />
        <Stack.Screen
          name="ReferencePage"
          component={ImportReferenceModal}
          options={{
            title: 'Import Reference',
            headerStyle: {
              height: 45,
              // backgroundColor: '#0F0F0F',
            },
            headerTitleStyle: {
              fontSize: 20,
              color: '#2E4374',
            },
            headerTintColor: '#2E4374',
          }}
        />
        <Stack.Screen
          name="ProjectEditor"
          component={ProjectEditorScreen}
          options={{
            title: 'Editor', headerStyle: {
              height: 45, // Set your desired height here
            },
            headerTitleStyle: {
              fontSize: 20, // Adjust the font size if needed
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
