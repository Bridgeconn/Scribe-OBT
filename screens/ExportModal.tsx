import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import RNFS from 'react-native-fs';
import ExportFolderPicker from './ExportFolderPicker';
const grammar = require('usfm-grammar');
import Loader2 from './Loader2';

// Props for the ExportModal component
type ExportModalProps = {
  visible: boolean;
  onDismiss: () => void;
  projectPath: string | undefined;
  projectName: string | undefined;
};

// ExportModal component definition
const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onDismiss,
  projectPath,
  projectName,
}) => {
  const [showFolderPicker, setShowFolderPicker] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [convertingFileMessage, setConvertingFileMessage] = useState("");
  const [copiedFiles, setCopiedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [progress, setProgress] = useState(0);


  // Handles folder selection
  const handleSelectFolder = (path: string) => {
    setSelectedFolder(path);
    setShowFolderPicker(false);
  };

  // Recursively counts files in a directory
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

  // Updates total file count when folder or project path changes
  useEffect(() => {
    if (selectedFolder && projectPath) {
      const calculateTotalFiles = async () => {
        try {
          const totalFilesCount = await countFiles(projectPath); // Count from source
          console.log('Total file count:', totalFilesCount);
          setTotalFiles(totalFilesCount + 1);
        } catch (error) {
          console.error('Error calculating total files:', error);
          setTotalFiles(0);
        }
      };
      calculateTotalFiles();
      setCopiedFiles(0);
    }
  }, [selectedFolder, projectPath]);


  // Files to skip during conversion
  const skipConversionFiles = [
    'metadata.json',
    'scribe-settings.json',
    'versification.json'
  ];

  // Cleans up partially exported files in case of errors
  const cleanupExportFolder = async (folderPath: string) => {
    try {
      if (await RNFS.exists(folderPath)) {
        await RNFS.unlink(folderPath);
        console.log('Cleaned up export folder:', folderPath);
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
      // We don't throw here as this is already part of error handling
    }
  };


  // Converts JSON files to USFM format
  const convertJsonToUsfm = async (
    sourcePath: string,
    destinationDir: string,
    filename: string,
  ) => {
    try {
      console.log('Converting file:', sourcePath);
      console.log('Destination directory:', destinationDir);
      console.log('Filename:', filename);

      if (!filename) {
        throw new Error('Invalid filename provided');
      }

      const jsonContent = await RNFS.readFile(sourcePath, 'utf8');
      let jsonData;
      try {
        jsonData = JSON.parse(jsonContent);
      } catch (parseError) {
        throw new Error(`Invalid JSON content in file: ${filename}`);
      }

      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error(`Empty or invalid JSON data in file: ${filename}`);
      }

      const myJsonParser = new grammar.JSONParser(jsonData);
      const usfmContent = myJsonParser.toUSFM();

      if (!usfmContent) {
        throw new Error(`Failed to generate USFM content for file: ${filename}`);
      }

      const usfmFilename = filename.toLowerCase().endsWith('.json')
        ? filename.slice(0, -5) + '.usfm'
        : filename + '.usfm';

      const usfmPath = `${destinationDir}/${usfmFilename}`;
      try {

        await RNFS.writeFile(usfmPath, usfmContent, 'utf8');

        setCopiedFiles((prevCopiedFiles) => {
          const newCopiedFiles = prevCopiedFiles + 1;
          setProgress(newCopiedFiles / totalFiles);
          return newCopiedFiles;
        });
      } catch (error) {
        console.error('Error copying file:', error);
      }

      // Extract book name from filename (assuming the filename is something like 'GEN.json')
      const selectedBook = filename.split('.')[0];

      //  // Add entry to metadata
      //  await addEntryToMetadata(usfmPath, selectedBook);

      setConvertingFileMessage("");

      return true;
    } catch (error) {
      console.error('Error in convertJsonToUsfm:', error);
      throw error;
    }
  };


  // Copies a directory and its contents to another location
  const copyDirectory = async (source: string, destination: string) => {
    try {
      console.log('Copying from:', source);
      console.log('Copying to:', destination);

      const sourceExists = await RNFS.exists(source);
      if (!sourceExists) {
        throw new Error(`Source directory does not exist: ${source}`);
      }

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
      // Special handling for text-1 directory
      if (source.includes('text-1')) {
        // First, copy metadata.json if it exists
        const metadataSource = `${source}/metadata.json`;
        const metadataDestination = `${destination}/metadata.json`;
        if (await RNFS.exists(metadataSource)) {

          try {
            await RNFS.copyFile(metadataSource, metadataDestination);

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

        // Then, copy the ingredients folder
        const ingredientsSource = `${source}/ingredients`;
        const ingredientsDestination = `${destination}/ingredients`;
        if (await RNFS.exists(ingredientsSource)) {
          await copyDirectory(ingredientsSource, ingredientsDestination);
        }
      }

      // Copy skip files first
      for (const skipFile of skipConversionFiles) {
        const skipFileSource = `${source}/${skipFile}`;
        const skipFileDestination = `${destination}/${skipFile}`;
        if (await RNFS.exists(skipFileSource)) {
          try {
            await RNFS.copyFile(skipFileSource, skipFileDestination);
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
      }

      // Process all other files
      for (const item of items) {
        if (!item || !item.name) {
          throw new Error('Invalid directory item encountered');
        }

        if (skipConversionFiles.includes(item.name)) continue;

        const itemSource = item.path;
        const itemName = item.name;

        // Skip metadata.json and ingredients folder for text-1, as they've been handled already
        if (source.includes('text-1') &&
          (itemName === 'metadata.json' || itemName === 'ingredients')) {
          continue;
        }

        if (item.isDirectory()) {
          const newDestination = `${destination}/${itemName}`;
          await copyDirectory(itemSource, newDestination);
        } else if (itemName.toLowerCase().endsWith('.json')) {
          setConvertingFileMessage(`Exporting file: ${itemName.replace(".json", '.usfm')}`);
          await convertJsonToUsfm(itemSource, destination, itemName);
        } else {
          const itemDestination = `${destination}/${itemName}`;
          try {
            await RNFS.copyFile(itemSource, itemDestination);
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
      }
    } catch (error) {
      // Instead of continuing, we throw the error to trigger cleanup
      throw error;
    }
  };

  // Handles export process
  const handleExportProject = async () => {
    if (!selectedFolder) {
      Alert.alert('Error', 'No destination folder selected.');
      return;
    }

    if (!projectPath || !projectName) {
      Alert.alert('Error', 'Invalid project path or name.');
      return;
    }
    setProgress(0);
    setIsExporting(true);
    const startTime = Date.now();
    const destinationPath = `${selectedFolder}/${projectName}`;

    try {
      // Check if folder already exists
      const folderExists = await RNFS.exists(destinationPath);

      if (folderExists) {
        // Prompt user about overwriting
        return new Promise<void>((resolve, reject) => {
          Alert.alert(
            'Project Already Exists',
            'A folder with this project name already exists at the selected location. Do you want to overwrite it?',
            [
              {
                text: 'Cancel',
                onPress: () => {
                  setIsExporting(false);
                  resolve();
                },
                style: 'cancel'
              },
              {
                text: 'Overwrite',
                onPress: async () => {
                  try {
                    setIsExporting(true);
                    // Remove existing folder before copying
                    await RNFS.unlink(destinationPath);

                    // Copy and convert the project
                    await copyDirectory(projectPath, destinationPath);

                    handleCancel();
                    Alert.alert('Success', 'Project exported successfully to: ' + destinationPath);
                    resolve();
                  } catch (error) {
                    console.error('Error overwriting project:', error);

                    // Show specific error message to user
                    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                    Alert.alert('Export Failed', `Failed to overwrite the project: ${errorMessage}`);
                    reject(error);
                  } finally {
                    setIsExporting(false);
                    setProgress(0);
                    const endTime = Date.now();
                    const elapsedTime = endTime - startTime;
                    console.log('Export time:', Math.floor(elapsedTime / 1000), 'seconds');
                  }
                }
              }
            ]
          );
        });
      }
      setProgress(0);
      // If folder doesn't exist, proceed with normal export
      await copyDirectory(projectPath, destinationPath);

      handleCancel();
      Alert.alert('Success', 'Project exported successfully to: ' + destinationPath);
    } catch (error) {
      console.error('Error exporting project:', error);

      // Clean up the partially exported files
      await cleanupExportFolder(destinationPath);

      // Show specific error message to user
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Export Failed', `Failed to export the project: ${errorMessage}\nPartially exported files have been cleaned up.`);
    } finally {

      setIsExporting(false);
      setProgress(0);

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      console.log('Export time:', Math.floor(elapsedTime / 1000), 'seconds');
    }
  };


  const handleCancel = () => {
    setSelectedFolder(null);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel}>
        <Dialog.Title>Export Project</Dialog.Title>
        <Dialog.Content>
          {isExporting ? (

            <Loader2 visible={true} progress={progress} />
          ) : selectedFolder ? (
            <View>
              <Text>Export Location: {selectedFolder}</Text>
              <Button onPress={handleExportProject}>Export to this location</Button>
            </View>
          ) : (
            <Button onPress={() => setShowFolderPicker(true)}>
              Select Export Location
            </Button>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={isExporting}>
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Modal
        transparent={true}
        visible={showFolderPicker}
        onRequestClose={() => setShowFolderPicker(false)}>
        <ExportFolderPicker
          onSelectFolder={handleSelectFolder}
          onCancel={() => setShowFolderPicker(false)}
        />
      </Modal>
    </Portal>
  );
};

export default ExportModal;