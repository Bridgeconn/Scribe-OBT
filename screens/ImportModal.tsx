import React, {useState} from 'react';
import {
  Text,
  View,
  Modal,
  Alert,
  // PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import {Portal, Dialog, Button} from 'react-native-paper';
import RNFS from 'react-native-fs';
import FolderPicker from './FolderPicker';
const grammar = require('usfm-grammar');

type ImportModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onImport: (result: string) => void;
  onUpdate: () => void;
};

const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  onDismiss,
  onImport,
  onUpdate,
}) => {
  const [showFolderPicker, setShowFolderPicker] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  // const [startTime, setStartTime] = useState<number | null>(null);
  // const [endTime, setEndTime] = useState<number | null>(null);

  const handleSelectFolder = (path: string) => {
    setSelectedFolder(path);
    setShowFolderPicker(false);
    onImport(path);
  };

  const convertUsfmToJson = async (
    sourcePath: string,
    destinationPath: string,
  ) => {
    const usfmContent = await RNFS.readFile(sourcePath, 'utf8');
    const usfmParser = new grammar.USFMParser(usfmContent);
    const usfmJson = usfmParser.toJSON();
    const jsonContent = JSON.stringify(usfmJson, null, 2);
    const jsonFilePath = destinationPath.replace(/\.(usfm|SFM)$/i, '.json');
    await RNFS.writeFile(jsonFilePath, jsonContent, 'utf8');
  };

  const copyDirectory = async (source: string, destination: string) => {
    const items = await RNFS.readDir(source);

    await RNFS.mkdir(destination);

    for (const item of items) {
      const itemDestination = `${destination}/${item.name}`;

      if (item.isDirectory()) {
        await copyDirectory(item.path, itemDestination);
      } else if (
        item.name.toLowerCase().endsWith('.usfm') ||
        item.name.toLowerCase().endsWith('.sfm')
      ) {
        console.log(`Converting file: ${item.path}`);
        await convertUsfmToJson(item.path, itemDestination);
      } else {
        await RNFS.copyFile(item.path, itemDestination);
      }
    }
  };

  const handleImportFolder = async () => {
    if (selectedFolder) {
      // try {
      //   const readPermission = await PermissionsAndroid.request(
      //     PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      //     {
      //       title: 'Permission Read',
      //       message: 'Permission to read',
      //       buttonNeutral: 'Ask Me Later',
      //       buttonNegative: 'Cancel',
      //       buttonPositive: 'OK',
      //     },
      //   );
      //   const writePermission = await PermissionsAndroid.request(
      //     PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      //     {
      //       title: 'Permission Write',
      //       message: 'Permission to Write',
      //       buttonNeutral: 'Ask Me Later',
      //       buttonNegative: 'Cancel',
      //       buttonPositive: 'OK',
      //     },
      //   );

      //   if (
      //     readPermission === PermissionsAndroid.RESULTS.GRANTED ||
      //     writePermission === PermissionsAndroid.RESULTS.GRANTED
      //   ) {
      //     Alert.alert(
      //       'Permission Granted',
      //       'Storage permission is granted to access the files.',
      //     );
      //   } else {
      //     Alert.alert(
      //       'Permission Denied',
      //       'Storage permission is required to access the files.',
      //     );
      //     return; // Exit if permissions are not granted
      //   }
      // } catch (error) {
      //   console.error('Permission error:', error);
      //   return;
      // }
      setIsImporting(true);
      const startTime = Date.now();
      try {
        const metadataFilePath = `${selectedFolder}/metadata.json`;
        const metadataContent = await RNFS.readFile(metadataFilePath);
        const metadata = JSON.parse(metadataContent);

        if (
          metadata &&
          metadata.identification &&
          metadata.identification.name
        ) {
          const projectName = metadata.identification.name.en;

          const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
          const projectsFolderPath = `${baseFolderPath}/projects`;
          const jsonFilePath = `${baseFolderPath}/appInfo.json`;

          const fileExists = await RNFS.exists(jsonFilePath);
          let appInfo: any = {};

          if (fileExists) {
            const appInfoContent = await RNFS.readFile(jsonFilePath);
            appInfo = JSON.parse(appInfoContent);
          }

          if (!appInfo.projects) {
            appInfo.projects = [];
          }

          const projectExists = appInfo.projects.some(
            (project: any) => project.projectName === projectName,
          );

          if (projectExists) {
            Alert.alert('Error', 'A project with this name already exists.');
            setIsImporting(false);
            return;
          }

          const projectsFolderExists = await RNFS.exists(projectsFolderPath);
          if (!projectsFolderExists) {
            await RNFS.mkdir(projectsFolderPath);
          }

          const destinationPath = `${projectsFolderPath}/${projectName}`;
          await copyDirectory(selectedFolder, destinationPath);

          const newProject = {
            projectName: projectName,
            projectPath: destinationPath,
          };

          appInfo.projects.push(newProject);

          await RNFS.writeFile(jsonFilePath, JSON.stringify(appInfo, null, 2));
          handleCancel();
          onUpdate();
          Alert.alert('Success', 'Project imported successfully.');
        } else {
          Alert.alert('Error', 'Invalid metadata file.');
        }
      } catch (error) {
        console.error('Error importing folder:', error);
        Alert.alert('Error', 'Failed to import the folder.');
      } finally {
        setIsImporting(false);
        const endTime = Date.now();

        const elapsedTime = endTime - startTime;
        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const secondsRemaining = seconds % 60;
        const minutesRemaining = minutes % 60;

        const hoursString = hours > 0 ? `${hours}h ` : '';
        const minutesString =
          minutesRemaining > 0 ? `${minutesRemaining}m ` : '';
        const secondsString =
          secondsRemaining > 0 ? `${secondsRemaining}s` : '';

        console.log('elapsed time', elapsedTime); // This line was missing a semicolon
        console.log(
          `Import time: ${hoursString} : ${minutesString} : ${secondsString}`,
        );
      }
    } else {
      Alert.alert('Error', 'No folder selected.');
    }
  };

  const handleCancel = () => {
    setSelectedFolder(null);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel}>
        <Dialog.Title>Import Project</Dialog.Title>
        <Dialog.Content>
          {isImporting ? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: '#fff',
                elevation: 5,
                padding: 10,
              }}>
              <ActivityIndicator size="large" />
              <Text style={{color: '#000'}}>
                Please wait. Importing Project in progress...
              </Text>
            </View>
          ) : selectedFolder ? (
            <View>
              <Text>Selected Folder: {selectedFolder}</Text>
              <Button onPress={handleImportFolder}>Import this folder</Button>
            </View>
          ) : (
            <Button onPress={() => setShowFolderPicker(true)}>
              Open Folder Picker
            </Button>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={isImporting}>
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Modal
        transparent={true}
        visible={showFolderPicker}
        onRequestClose={() => setShowFolderPicker(false)}>
        <FolderPicker
          onSelectFolder={handleSelectFolder}
          onCancel={() => setShowFolderPicker(false)}
        />
      </Modal>
    </Portal>
  );
};

export default ImportModal;
