import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
// import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SignupScreen from './screens/SignupScreen';
import {enableScreens} from 'react-native-screens';
import CreateProjectScreen from './screens/CreateProjectScreen';
import ProjectEditorScreen from './screens/ProjectEditorScreen';
import RNFS from 'react-native-fs';
import {ActivityIndicator, View} from 'react-native';
import {
  checkManagePermission,
  requestManagePermission,
} from 'manage-external-storage';
import ImportReferenceModal from './screens/importRefernceModal';

enableScreens();

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  'Sign up': undefined;
  CreateProject: undefined;
  ReferencePage: undefined;
  ProjectEditor: {projectId: string; projectName: string};
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = React.useState<'Sign up' | 'Home'>(
    'Sign up',
  );
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let permission;
    checkManagePermission().then(isManagePermitted => {
      console.log(isManagePermitted);
      permission = isManagePermitted;
    });
    // request rights to manage
    if (permission === false) {
      requestManagePermission().then(isManagePermitted => {
        console.log(isManagePermitted);
      });
    }
    const checkAndCreateFolderAndFile = async () => {
      const folderPath = `${RNFS.ExternalStorageDirectoryPath}/Download/OBTRecorderApp`;
      const filePath = `${folderPath}/appInfo.json`;

      try {
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
          const defaultContent = JSON.stringify({username: null});
          await RNFS.writeFile(filePath, defaultContent, 'utf8');
          console.log('File appInfo.json created with default content');
        } else {
          console.log('File appInfo.json already exists');
        }

        // Read the file and check the value of username
        const fileContent = await RNFS.readFile(filePath, 'utf8');
        const {username} = JSON.parse(fileContent);

        if (username && username.trim() !== '') {
          // Redirect to Home if username is not null or empty
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Error checking/creating folder/file:', error);
      } finally {
        // Set loading to false to render the NavigationContainer
        setIsLoading(false);
      }
    };

    checkAndCreateFolderAndFile();
  }, []);

  if (isLoading) {
    // Show a loading indicator while checking the initial route
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
        <Stack.Screen name="Sign up" component={SignupScreen} />
        <Stack.Screen
          name="CreateProject"
          component={CreateProjectScreen}
          options={{title: 'Create New Project'}}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Dashboard'}}
        />
        <Stack.Screen
          name="ReferencePage"
          component={ImportReferenceModal}
          options={{title: 'Import Reference'}}
        />
        <Stack.Screen
          name="ProjectEditor"
          component={ProjectEditorScreen}
          options={{title: 'Project Editor'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
