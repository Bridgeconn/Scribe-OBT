import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {SvgXml} from 'react-native-svg';
import RNFS from 'react-native-fs';
import {Portal} from 'react-native-paper'; // Import Portal
// import ImportReferenceCollectionModal from './ImportReferenceCollectionModal';
import FolderPicker from './FolderPicker';
const grammar = require('usfm-grammar');

const ImportResourcePage: React.FC = () => {
  // const [importCollectionDialogVisible, setImportCollectionDialogVisible] =
  //   useState(false);
  // const [updateCollection, setUpdateCollection] = useState(false);

  // const handleImportCollection = async (folderPath: string) => {
  //   console.log('Imported folder path:', folderPath);
  // };

  const folderIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h6.621a2.25 2.25 0 011.743.833l.887 1.11a2.25 2.25 0 001.743.833h6.621a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25v-10.5a2.25 2.25 0 012.25-2.25z"></path></svg>';

  const infoIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v.01M12 12v3m0 0v.01M12 21c-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9-4.029 9-9 9z"></path></svg>';

  const [showFolderPicker, setShowFolderPicker] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [fileTransferMessage, setFileTransferMessage] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  // const [startTime, setStartTime] = useState<number | null>(null);
  // const [endTime, setEndTime] = useState<number | null>(null);

  const handleSelectFolder = (path: string) => {
    setSelectedFolder(path);
    setShowFolderPicker(false);
    // onImport(path);
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
        setFileTransferMessage(`transferring file: ${item.path}`)
        await convertUsfmToJson(item.path, itemDestination);
      } else {
        await RNFS.copyFile(item.path, itemDestination);
      }
    }
  };

  const handleImportFolder = async () => {
    if (selectedFolder) {
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
          const referenceFolderPath = `${baseFolderPath}/references`;
          const jsonFilePath = `${baseFolderPath}/appInfo.json`;

          const fileExists = await RNFS.exists(jsonFilePath);
          let appInfo: any = {};

          // If the appInfo file exists, read it; otherwise, initialize appInfo
          if (fileExists) {
            const appInfoContent = await RNFS.readFile(jsonFilePath);
            appInfo = JSON.parse(appInfoContent);
          }

          // Ensure the `references` array exists
          if (!appInfo.references) {
            appInfo.references = []; // Initialize the references array if it doesn't exist
          }

          // Check if a project with the same name already exists
          const projectExists = appInfo.references.some(
            (reference: any) => reference.projectName === projectName,
          );

          if (projectExists) {
            Alert.alert('Error', 'A project with this name already exists.');
            setIsImporting(false);
            return;
          }

          // Check if text-1/ingredients folder exists with .usfm or .sfm files
          const text1FolderPath = `${selectedFolder}/text-1`;
          const ingredientsFolderPath = `${text1FolderPath}/ingredients`;

          const text1Exists = await RNFS.exists(text1FolderPath);
          let referenceType = [];

          if (text1Exists) {
            const ingredientsExists = await RNFS.exists(ingredientsFolderPath);
            if (ingredientsExists) {
              const ingredientFiles = await RNFS.readDir(ingredientsFolderPath);
              const hasUsfmOrSfm = ingredientFiles.some(
                file =>
                  file.name.toLowerCase().endsWith('.usfm') ||
                  file.name.toLowerCase().endsWith('.sfm'),
              );

              if (hasUsfmOrSfm) {
                referenceType.push('Bible');
              }
            }
          }

          // Ensure the references folder exists
          const referenceResourceFolderExists = await RNFS.exists(
            referenceFolderPath,
          );
          if (!referenceResourceFolderExists) {
            await RNFS.mkdir(referenceFolderPath);
          }

          // Copy the selected folder and its contents to the destination
          const destinationPath = `${referenceFolderPath}/${projectName}`;
          await copyDirectory(selectedFolder, destinationPath);

          // Create the new project object
          const newProject = {
            referenceName: projectName,
            referencePath: destinationPath,
            referenceType: referenceType,
          };

          // Add the new project to the references array
          appInfo.references.push(newProject);

          // Save the updated appInfo.json file
          await RNFS.writeFile(jsonFilePath, JSON.stringify(appInfo, null, 2));
          setFileTransferMessage("");
          handleCancel();
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

        console.log('elapsed time', elapsedTime);
        console.log(
          `Import time: ${hoursString} : ${minutesString} : ${secondsString}`,
        );
      }
    } else {
      Alert.alert('Error', 'No folder selected.');
    }
  };

  const handleCancel = () => {
    setSelectedFolder('');
    // onDismiss();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>IMPORT RESOURCE</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Scripture Burrito Resource filepath</Text>
        <SvgXml xml={infoIcon} width={20} height={20} />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={selectedFolder}
          disabled
          // multiline={true}
          textColor="#000"
        />
        <TouchableOpacity
          style={styles.selectFolderButton}
          onPress={() => setShowFolderPicker(true)}>
          <SvgXml xml={folderIcon} width={24} height={24} />
          <Text style={styles.selectFolderText}>Select Folder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadContainer}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleImportFolder}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <Portal>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    marginRight: 10,
    color: '#ff5500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    width: '60%',
    height: 30,
    marginRight: 10,
    // color: '#222f3e',
  },
  selectFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  selectFolderText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#000',
  },
  uploadContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 5,
    width: 100,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ImportResourcePage;
