import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, Alert} from 'react-native';
import RNFS from 'react-native-fs';

interface TableData {
  name: string;
  type: string;
  languageName: string;
  version: string;
}

const ListBiblePage: React.FC = () => {
  const [data, setData] = useState<TableData[]>([]);

  useEffect(() => {
    // Function to load references from appInfo.json
    const loadReferences = async () => {
      try {
        // const appInfoPath = `${RNFS.DownloadDirectoryPath}/appInfo.json`;
        const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
        const appInfoPath = `${baseFolderPath}/appInfo.json`;
        const appInfo = await RNFS.readFile(appInfoPath, 'utf8');
        const parsedInfo = JSON.parse(appInfo);

        const references = parsedInfo.references || [];
        const tableData: TableData[] = [];

        for (const reference of references) {
          const metadataPath = `${reference.referencePath}/text-1/metadata.json`;
          if (await RNFS.exists(metadataPath)) {
            const metadata = JSON.parse(
              await RNFS.readFile(metadataPath, 'utf8'),
            );
            const {languages, version} = metadata;

            tableData.push({
              name: reference.referenceName,
              type: 'Bible',
              // type: type || 'Unknown',
              languageName: languages[0].name.en || 'Unknown',
              version: version || 'Unknown',
            });
          } else {
            Alert.alert(
              'Metadata not found',
              `Metadata file not found for ${reference.referenceName}`,
            );
          }
        }

        setData(tableData);
      } catch (error) {
        console.error('Error loading references:', error);
      }
    };

    loadReferences();
  }, []);

  const renderItem = ({item}: {item: TableData}) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.type}</Text>
      <Text style={styles.cell}>{item.languageName}</Text>
      <Text style={styles.cell}>{item.version}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Name</Text>
        <Text style={styles.headerCell}>Type</Text>
        <Text style={styles.headerCell}>Language Name</Text>
        <Text style={styles.headerCell}>Version</Text>
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2980b9',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
});

export default ListBiblePage;
