import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Dialog, Portal, Button } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import RNFS from 'react-native-fs';
const grammar = require('usfm-grammar');
// import FolderPicker from './FolderPicker';
import Loader2 from './Loader2';
import FolderPickerRef from './FolderPickerReference';

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
    '<svg xmlns="http://www.w3.org/2000/svg" fill="#fbc531" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h6.621a2.25 2.25 0 011.743.833l.887 1.11a2.25 2.25 0 001.743.833h6.621a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25v-10.5a2.25 2.25 0 012.25-2.25z"></path></svg>';

  const infoIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#4B527E" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v.01M12 12v3m0 0v.01M12 21c-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9-4.029 9-9 9z"></path></svg>';

  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fileTransferMessage, setFileTransferMessage] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [convertingFileMessage, setConvertingFileMessage] = useState("");

  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [copiedFiles, setCopiedFiles] = useState(0);

  // Handles the selection of a folder
  const handleSelectFolder = (path: React.SetStateAction<string>) => {
    setSelectedFolder(path);
    setShowFolderPicker(false);
    setShowImportDialog(true);
  };

  // Handles modal dismissal
  const handleCancel = () => {
    setSelectedFolder('');
    setShowImportDialog(false);
  };

  // Recursively copies files and folders from the source to the destination
  const copyDirectory = async (source: string, destination: string) => {
    const items = await RNFS.readDir(source);
    try {
      await RNFS.mkdir(destination);
      setCopiedFiles((prevCopiedFiles) => {
        const newCopiedFiles = prevCopiedFiles + 1;
        setProgress(newCopiedFiles / totalFiles);
        return newCopiedFiles;
      });
    } catch (error) {
      console.error('Error copying file:', error);
    }

    for (const item of items) {
      const itemDestination = `${destination}/${item.name}`;

      if (item.isDirectory()) {
        await copyDirectory(item.path, itemDestination);
      } else {
        let chars = item.path.split('/');
        setConvertingFileMessage(`Importing file : ${chars.slice(5).join('/')}`);
        try {
          await RNFS.copyFile(item.path, itemDestination);
          setCopiedFiles((prevCopiedFiles) => {
            const newCopiedFiles = prevCopiedFiles + 1;
            // console.log(newCopiedFiles,"new copied file no")
            setProgress(newCopiedFiles / totalFiles);
            return newCopiedFiles;
          });
        } catch (error) {
          console.error('Error copying file:', error);
        }
      }
    }
  };

  const countFiles = async (path: string) => {
    const dirItems = await RNFS.readDir(path);
    let count = dirItems.length;
    for (const item of dirItems) {
      if (item.isDirectory()) {
        count += await countFiles(item.path);
      }
    }
    return count;
  };


  // Recursively counts the number of files in a directory
  useEffect(() => {
    if (selectedFolder) {
      const calculateTotalFiles = async () => {
        const totalFileCount = await countFiles(selectedFolder);
        console.log(totalFileCount, 'total file count')
        setTotalFiles(totalFileCount + 1);

      };
      calculateTotalFiles();
      setCopiedFiles(0);
    }
  }, [selectedFolder]);

  // Initiates the folder import process
  const handleImportFolder = async () => {
    if (selectedFolder) {
      setIsImporting(true);
      const startTime = Date.now();
      try {
        const metadataFilePath = `${selectedFolder}/metadata.json`;
        const metadataFileExists = await RNFS.exists(metadataFilePath);

        // const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
         const baseFolderPath = RNFS.DocumentDirectoryPath;
        const referenceFolderPath = `${baseFolderPath}/references`;
        const jsonFilePath = `${baseFolderPath}/appInfo.json`;

        let projectName: string;
        let referenceType: string[] = ['Bible'];

        if (metadataFileExists) {
          // Existing metadata.json processing logic
          const metadataContent = await RNFS.readFile(metadataFilePath);
          const metadata = JSON.parse(metadataContent);

          if (metadata && metadata.identification && metadata.identification.name) {
            projectName = metadata.identification.name.en;

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
          } else {
            Alert.alert('Error', 'Invalid metadata file.');
            setIsImporting(false);
            return;
          }
        } else {
          // Alternative processing for folders without metadata.json
          // Use the last part of the folder path as the project name
          projectName = selectedFolder.split('/').pop() || 'Unnamed Project';
        }

        // Check if references folder exists, create if not
        const referenceResourceFolderExists = await RNFS.exists(referenceFolderPath);
        if (!referenceResourceFolderExists) {
          try {
            await RNFS.mkdir(referenceFolderPath);
            setCopiedFiles((prevCopiedFiles) => {
              const newCopiedFiles = prevCopiedFiles + 1;
              console.log(newCopiedFiles, "new copied file no")
              setProgress(newCopiedFiles / totalFiles);
              return newCopiedFiles;
            });
          } catch (error) {
            console.error('Error copying file:', error);
          }
        }

        // Prepare destination path
        const destinationPath = `${referenceFolderPath}/${projectName}`;

        // Ensure file exists and can be read/written
        const fileExists = await RNFS.exists(jsonFilePath);
        let appInfo: AppInfo = {};

        if (fileExists) {
          const appInfoContent = await RNFS.readFile(jsonFilePath);
          appInfo = JSON.parse(appInfoContent) as AppInfo;
        }

        // Initialize references array if not exists
        if (!appInfo.references) {
          appInfo.references = [];
        }

        // Check if project already exists
        const projectExists = appInfo.references.some(
          (reference) => reference.referenceName === projectName,
        );

        if (projectExists) {
          Alert.alert('Error', 'A project with this name already exists.');
          setIsImporting(false);
          return;
        }

        // Copy the selected folder
        await copyDirectory(selectedFolder, destinationPath);

        // Create new project entry
        const newProject = {
          referenceName: projectName,
          referencePath: destinationPath,
          referenceType: referenceType,
        };

        // Add to references and save
        appInfo.references.push(newProject);
        await RNFS.writeFile(jsonFilePath, JSON.stringify(appInfo, null, 2));

        setFileTransferMessage('');
        handleCancel();
        Alert.alert('Success', 'Reference imported successfully.');
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
      <Text style={styles.heading}>Import Resource</Text>

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

      {/* <View style={styles.uploadContainer}>
        <TouchableOpacity
          style={[styles.uploadButton, isImporting && styles.disabledButton]}
          onPress={() => setShowImportDialog(true)}
          disabled={!selectedFolder || isImporting}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View> */}

      <Portal>
        <Dialog visible={showImportDialog} onDismiss={handleCancel}>
          <Dialog.Title>Import Reference</Dialog.Title>
          <Dialog.Content>
            {isImporting ? (
              <Loader2 visible={true} progress={progress} />
            ) : (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Text >Selected Folder : </Text>
                  <Text >{selectedFolder}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>

                  <Text>Total Files : </Text>
                  <Text > {totalFiles}</Text>
                </View>
                <Button onPress={handleImportFolder} disabled={totalFiles < 1}>Import this folder</Button>
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
          <FolderPickerRef
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
    color: '#2E4374',
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
    color: '#7C81AD',
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
    backgroundColor: '#576574',
    padding: 10,
    borderRadius: 5,
  },
  selectFolderText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#fff',
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