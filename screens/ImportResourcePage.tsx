import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {TextInput, Dialog, Portal, Button} from 'react-native-paper';
import {SvgXml} from 'react-native-svg';
import RNFS from 'react-native-fs';
const grammar = require('usfm-grammar');
import FolderPicker from './FolderPicker';

interface AppInfo {
  references?: {
    referenceName: string;
    referencePath: string;
    referenceType: string[];
  }[];
}

interface Ingredient {
  mimeType?: string;
  mime_type?: string;
}

// Type guard to check if an object is of type `Ingredient`
const isIngredient = (obj: any): obj is Ingredient => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('mimeType' in obj || 'mime_type' in obj)
  );
};

const ImportResourcePage = () => {
  const folderIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h6.621a2.25 2.25 0 011.743.833l.887 1.11a2.25 2.25 0 001.743.833h6.621a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25v-10.5a2.25 2.25 0 012.25-2.25z"></path></svg>';

  const infoIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v.01M12 12v3m0 0v.01M12 21c-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9-4.029 9-9 9z"></path></svg>';

  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fileTransferMessage, setFileTransferMessage] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleSelectFolder = (path: React.SetStateAction<string>) => {
    setSelectedFolder(path);
    setShowFolderPicker(false);
    setShowImportDialog(true);
  };

  const handleCancel = () => {
    setSelectedFolder('');
    setShowImportDialog(false);
  };

  const convertUsfmToJson = async (sourcePath: string, destinationPath: string) => {
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
        let chars = item.path.split('/');
        setFileTransferMessage(`Importing file: ${chars[chars.length - 1]}`);
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

        if (metadata && metadata.identification && metadata.identification.name) {
          const projectName = metadata.identification.name.en;
          const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
          const referenceFolderPath = `${baseFolderPath}/references`;
          const jsonFilePath = `${baseFolderPath}/appInfo.json`;

          const fileExists = await RNFS.exists(jsonFilePath);
          let appInfo: AppInfo = {};

          if (fileExists) {
            const appInfoContent = await RNFS.readFile(jsonFilePath);
            appInfo = JSON.parse(appInfoContent)  as AppInfo;
          }

          if (!appInfo.references) {
            appInfo.references = [];
          }

          const projectExists = appInfo.references.some(
            (reference) => reference.referenceName === projectName,
          );

          if (projectExists) {
            Alert.alert('Error', 'A project with this name already exists.');
            setIsImporting(false);
            return;
          }

          let referenceType: string[] = [];

          if (metadata.ingredients) {
            const hasAudioFiles = Object.values(metadata.ingredients).some(
              (ingredient) => {
                if (isIngredient(ingredient)) {
                  const mimeType = ingredient.mimeType || ingredient.mime_type;
                  return (
                    mimeType &&
                    (mimeType.startsWith('audio/') ||
                      mimeType.includes('wav') ||
                      mimeType.includes('mp3'))
                  );
                }
                return false;
              },
            );
          
            if (hasAudioFiles) {
              referenceType.push('Audio');
            }
          }

          const text1FolderPath = `${selectedFolder}/text-1`;
          const ingredientsFolderPath = `${text1FolderPath}/ingredients`;

          const text1Exists = await RNFS.exists(text1FolderPath);
          if (text1Exists) {
            const ingredientsExists = await RNFS.exists(ingredientsFolderPath);
            if (ingredientsExists) {
              const ingredientFiles = await RNFS.readDir(ingredientsFolderPath);
              const hasUsfmOrSfm = ingredientFiles.some(
                (file) =>
                  file.name.toLowerCase().endsWith('.usfm') ||
                  file.name.toLowerCase().endsWith('.sfm'),
              );

              if (hasUsfmOrSfm) {
                referenceType.push('Bible');
              }
            }
          }

          const referenceResourceFolderExists = await RNFS.exists(
            referenceFolderPath,
          );
          if (!referenceResourceFolderExists) {
            await RNFS.mkdir(referenceFolderPath);
          }

          const destinationPath = `${referenceFolderPath}/${projectName}`;
          await copyDirectory(selectedFolder, destinationPath);

          const newProject = {
            referenceName: projectName,
            referencePath: destinationPath,
            referenceType: referenceType,
          };

          appInfo.references.push(newProject);
          await RNFS.writeFile(jsonFilePath, JSON.stringify(appInfo, null, 2));
          setFileTransferMessage('');
          handleCancel();
          Alert.alert('Success', 'Reference imported successfully.');
        } else {
          Alert.alert('Error', 'Invalid metadata file.');
        }
      } catch (error) {
        console.error('Error importing folder:', error);
        Alert.alert('Error', 'Failed to import the folder.');
      } finally {
        setIsImporting(false);
        const endTime = Date.now();
        console.log('Import time:', endTime - startTime, 'ms');
      }
    } else {
      Alert.alert('Error', 'No folder selected.');
    }
  };

  return (
    <View style={styles.container} pointerEvents={isImporting ? 'none' : 'auto'}>
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
          textColor="#000"
        />
        <TouchableOpacity
          style={styles.selectFolderButton}
          onPress={() => setShowFolderPicker(true)}
          disabled={isImporting}>
          <SvgXml xml={folderIcon} width={24} height={24} />
          <Text style={styles.selectFolderText}>Select Folder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadContainer}>
        <TouchableOpacity
          style={[styles.uploadButton, isImporting && styles.disabledButton]}
          onPress={() => setShowImportDialog(true)}
          disabled={!selectedFolder || isImporting}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <Portal>
        <Dialog visible={showImportDialog} onDismiss={handleCancel}>
          <Dialog.Title>Import Reference</Dialog.Title>
          <Dialog.Content>
            {isImporting ? (
              <View style={styles.dialogContent}>
                <ActivityIndicator size="large" />
                <Text style={styles.importingText}>
                  Please wait. Importing Reference in progress...
                </Text>
                <Text style={styles.fileTransferText}>{fileTransferMessage}</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.selectedFolderText}>
                  Selected Folder: {selectedFolder}
                </Text>
                <Button onPress={handleImportFolder}>Import this folder</Button>
              </View>
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  dialogContent: {
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 5,
    padding: 10,
  },
  importingText: {
    color: '#000',
    marginTop: 10,
  },
  fileTransferText: {
    color: '#ff7f50',
    marginTop: 5,
  },
  selectedFolderText: {
    marginBottom: 10,
  },
});

export default ImportResourcePage;