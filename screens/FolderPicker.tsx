import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';

// Define props for FolderPicker component
type FolderPickerProps = {
  onSelectFolder: (path: string) => void;
  onCancel: () => void;
};

// Define the structure of metadata.json content
interface MetadataFormat {
  format: string;
  type: {
    flavorType: {
      name: string;
      flavor: {
        name: string;
        performance?: string[];
        formats?: Record<string, any>;
      };
      currentScope?: Record<string, any>;
    };
  };
  // Add other fields as needed
}

// Simple separator component for visual spacing
const Separator = () => <View style={styles.separator} />;

// FolderPicker component definition
const FolderPicker: React.FC<FolderPickerProps> = ({
  onSelectFolder,
  onCancel,
}) => {
  const [items, setItems] = useState<{ path: string; isDirectory: boolean }[]>(
    [],
  );
  const [currentPath, setCurrentPath] = useState<string>(
    RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath,
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Load folder contents whenever the currentPath changes
  useEffect(() => {
    loadItems(currentPath);
  }, [currentPath]);

  // Function to load items in the current directory
  const loadItems = async (path: string) => {
    try {
      const fileItems = await RNFS.readDir(path);
      const formattedItems = fileItems.map(item => ({
        path: item.path,
        isDirectory: item.isDirectory(),
      }));
      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items.');
    }
  };

  // Function to validate the content of metadata.json
  const validateMetadata = async (filePath: string): Promise<boolean> => {
    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const metadata: MetadataFormat = JSON.parse(fileContent);
      console.log(filePath, "fp")
      // Check if it's a scripture burrito format
      if (metadata.format !== 'scripture burrito') {
        Alert.alert('Error', 'Invalid file format. Expected scripture burrito format.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating metadata:', error);
      Alert.alert('Error', 'Failed to validate metadata.json file.');
      return false;
    }
  };

  // Handle folder selection or navigation
  const handleSelect = (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      setCurrentPath(path); // Navigate into the selected folder
      setSelectedFolder(path);
    } else {
      Alert.alert('Error', 'Cannot select files, please choose a folder.');
    }
  };

  // Navigate to the parent directory
  const handleBack = () => {
    const parentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parentDir && parentDir !== currentPath) {
      setCurrentPath(parentDir);
      setSelectedFolder(null);
    }
  };

  // Confirm folder selection
  const handleConfirmSelection = async () => {
    if (selectedFolder) {
      // Check for metadata.json file in the selected folder
      const metadataFilePath = `${selectedFolder}/metadata.json`;
      const fileExists = await RNFS.exists(metadataFilePath);

      if (!fileExists) {
        Alert.alert('Error', 'Unable to find burrito file (metadata.json).');
        return;
      }

      // Validate the metadata.json content
      const isValid = await validateMetadata(metadataFilePath);
      if (isValid) {
        onSelectFolder(selectedFolder);
      }
    } else {
      Alert.alert('Error', 'No folder selected.');
    }
  };

  // Cancel the folder selection process
  const handleCancel = () => {
    // Reset selections
    setCurrentPath(
      RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath,
    );
    setSelectedFolder(null);
    setItems([]);
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Button
        title="Back"
        onPress={handleBack}
        disabled={
          currentPath ===
          (RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath)
        }
      />
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item.path, item.isDirectory)}
            style={styles.itemContainer}>
            <Text style={styles.item}>
              {item.isDirectory ? '📁 ' : '📄 '}
              {item.path.split('/').pop()} {/* Display file or folder name */}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.path}
      />
      <Button
        title="Select Folder"
        onPress={handleConfirmSelection}
      />
      <Separator />
      <Button title="Cancel" onPress={handleCancel} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  itemContainer: {
    padding: 16,
  },
  item: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    color: 'white', // Ensure text is visible on black background
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default FolderPicker;
