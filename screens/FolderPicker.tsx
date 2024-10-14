import React, {useState, useEffect} from 'react';
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

const FolderPicker: React.FC<FolderPickerProps> = ({
  onSelectFolder,
  onCancel,
}) => {
  const [items, setItems] = useState<{path: string; isDirectory: boolean}[]>(
    [],
  );
  const [currentPath, setCurrentPath] = useState<string>(
    RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath,
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    loadItems(currentPath);
  }, [currentPath]);

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

  const handleSelect = (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      setCurrentPath(path); // Navigate into the selected folder
      setSelectedFolder(path);
    } else {
      Alert.alert('Error', 'Cannot select files, please choose a folder.');
    }
  };

  const handleBack = () => {
    const parentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parentDir && parentDir !== currentPath) {
      setCurrentPath(parentDir);
      setSelectedFolder(null);
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedFolder) {
      // Check for metadata.json file in the selected folder
      const metadataFilePath = `${selectedFolder}/metadata.json`;
      const fileExists = await RNFS.exists(metadataFilePath);

      if (fileExists) {
        onSelectFolder(selectedFolder);
      } else {
        Alert.alert('Error', 'Unable to find burrito file (metadata.json).');
      }
    } else {
      Alert.alert('Error', 'No folder selected.');
    }
  };

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
        renderItem={({item}) => (
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
        disabled={!selectedFolder}
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
