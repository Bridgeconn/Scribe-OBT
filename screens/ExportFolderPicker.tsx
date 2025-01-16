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

type FolderPickerProps = {
  onSelectFolder: (path: string) => void;
  onCancel: () => void;
};

const Separator = () => <View style={styles.separator} />;

/**
 * Component to allow users to select a folder for export purposes.
 * Props:
 * - onSelectFolder: Callback function invoked with the selected folder path.
 * - onCancel: Callback function invoked when the folder selection is canceled.
 */
const ExportFolderPicker: React.FC<FolderPickerProps> = ({
  onSelectFolder,
  onCancel,
}) => {
  const [items, setItems] = useState<{ path: string; isDirectory: boolean }[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(
    RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath,
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Effect hook to load items whenever the current path changes.
  useEffect(() => {
    loadItems(currentPath);
  }, [currentPath]);


  /**
  * Loads the items (files and folders) from the given path.
  * @param path - The directory path to read.
  */
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

  /**
 * Handles the selection of a folder or a file.
 * Updates the current path if a folder is selected.
 * @param path - The selected item's path.
 * @param isDirectory - Boolean indicating if the item is a directory.
 */
  const handleSelect = (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      setCurrentPath(path);
      setSelectedFolder(path);
    } else {
      Alert.alert('Error', 'Cannot select files, please choose a folder.');
    }
  };

  //Handles navigation to the parent directory.
  const handleBack = () => {
    const parentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parentDir && parentDir !== currentPath) {
      setCurrentPath(parentDir);
      setSelectedFolder(null);
    }
  };


  /**
 * Confirms the selection of the currently selected folder.
 * Invokes the `onSelectFolder` callback with the selected folder path.
 */
  const handleConfirmSelection = () => {
    if (selectedFolder) {
      onSelectFolder(selectedFolder);
    } else {
      Alert.alert('Error', 'No folder selected.');
    }
  };


  /**
  * Cancels the folder selection process.
  * Resets the state and invokes the `onCancel` callback.
  */
  const handleCancel = () => {
    setCurrentPath(
      RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath,
    );
    setSelectedFolder(null);
    setItems([]);
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pathText}>Current Path: {currentPath}</Text>
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
            style={[
              styles.itemContainer,
              selectedFolder === item.path && styles.selectedItem,
            ]}>
            <Text style={styles.item}>
              {item.isDirectory ? '📁 ' : '📄 '}
              {item.path.split('/').pop()}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.path}
      />
      <Button
        title="Select This Folder"
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
  pathText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  itemContainer: {
    padding: 16,
  },
  selectedItem: {
    backgroundColor: '#333',
  },
  item: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    color: 'white',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default ExportFolderPicker;