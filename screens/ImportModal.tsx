import React, {useEffect, useState} from 'react';
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
import Loader2 from './Loader2';

// Props type for the ImportModal component
// visible: Controls the visibility of the modal
// onDismiss: Callback to handle modal dismissal
// onImport: Callback to handle folder import selection
// onUpdate: Callback to update after import operation
type ImportModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onImport: (result: string) => void;
  onUpdate: () => void;
};

// Main functional component for ImportModal
const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  onDismiss,
  onImport,
  onUpdate,
}) => {
  const [showFolderPicker, setShowFolderPicker] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [convertingFileMessage,setConvertingFileMessage]=useState("");
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [copiedFiles, setCopiedFiles] = useState(0);


  // Handles the selection of a folder
  const handleSelectFolder = (path: string) => {
    setSelectedFolder(path);
    setShowFolderPicker(false);
    onImport(path);
  };

   // Recursively copies files and folders from the source to the destination
  const copyDirectory = async (source: string, destination: string) => {
    const items = await RNFS.readDir(source);
try{
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
            setProgress(newCopiedFiles / totalFiles);
            return newCopiedFiles;
          });
        } catch (error) {
          console.error('Error copying file:', error);
        }
      }
    }
  };

    // Recursively counts the number of files in a directory
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

 
  // Initiates the folder import process
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

          // const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
          const baseFolderPath = RNFS.DocumentDirectoryPath;

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
            try{
            await RNFS.mkdir(projectsFolderPath);
            setCopiedFiles((prevCopiedFiles) => {
              const newCopiedFiles = prevCopiedFiles + 1;

              setProgress(newCopiedFiles / totalFiles);
              return newCopiedFiles;
            });
          } catch (error) {
            console.error('Error copying file:', error);
          }
          }

          const destinationPath = `${projectsFolderPath}/${projectName}`;
          await copyDirectory(selectedFolder, destinationPath);

          const newProject = {
            projectName: projectName,
            projectPath: destinationPath,
            referenceResource: ""
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


    // Effect to calculate total file count whenever a folder is selected
  useEffect(() => {
    if (selectedFolder) {
      const calculateTotalFiles = async () => {
        const totalFileCount = await countFiles(selectedFolder);
        console.log(totalFileCount,'total file count')
        setTotalFiles(totalFileCount+1);
        
      };
      calculateTotalFiles();
      setCopiedFiles(0);
    }
  }, [selectedFolder]);

    // Handles modal dismissal
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
            <Loader2 visible={true} progress={progress}/>
          ) : selectedFolder ? (
            <View>
              <View style={{flexDirection:'row',flexWrap:'wrap'}}>
              <Text >Selected Folder : </Text>
              <Text >{selectedFolder}</Text>
              </View>
              <View style={{flexDirection:'row',flexWrap:'wrap'}}>

              <Text >Total Files : </Text>
              <Text > {totalFiles}</Text>
              </View>
              <Button   onPress={handleImportFolder}>Import this folder</Button>
              
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
