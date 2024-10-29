import React, { useEffect, useState } from 'react';
import {View, Text, StyleSheet, FlatList, Alert, TouchableOpacity} from 'react-native';
import RNFS from 'react-native-fs';
import { SvgXml } from 'react-native-svg';

// Define the type for table data
// interface TableData {
//   name: string;
//   type: string;
//   languageName: string;
//   [key: string]: string; // For additional columns without headers
// }

interface TableData {
  name: string;
  type: string;
  languageName: string;
  version: string;
}

interface Project {
  projectName: string;
  projectPath: string;
  referenceResource: string;
}

interface AppInfo {
  username: string;
  projects: Project[];
  references: {
    referenceName: string;
    referencePath: string;
    referenceType: string[];
  }[];
}
// Sample data for the table
const data: TableData[] = [
  // {
  //   name: 'Audio 1',
  //   type: 'Hindi IRV',
  //   languageName: 'English',
  //   col4: 'Value 4',
  //   // col5: 'Value 5',
  //   // col6: 'Value 6',
  //   col7: 'Value 7',
  // },
  // {
  //   name: 'Audio2',
  //   type: 'Telegu IRV',
  //   languageName: 'Spanish',
  //   col4: 'Value 4',
  //   // col5: 'Value 5',
  //   // col6: 'Value 6',
  //   col7: 'Value 7',
  // },
  // Add more rows as needed
];

const ListAudioPage: React.FC = () => {
  const [data, setData] = useState<TableData[]>([]);
  const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
  const appInfoPath = `${baseFolderPath}/appInfo.json`;
        
  const deleteIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
`;


const handleDelete = async (itemName: string) => {
  try {
    // Read current appInfo.json
    const appInfoContent = await RNFS.readFile(appInfoPath, 'utf8');
    const appInfo: AppInfo = JSON.parse(appInfoContent);

    // Check if any project is using this reference
    const projectsUsingReference = appInfo.projects.filter(
      project => project.referenceResource === itemName
    );

    if (projectsUsingReference.length > 0) {
      Alert.alert(
        'Warning',
        `This reference is being used by ${projectsUsingReference.length} project(s). Are you sure you want to delete it?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Yes',
            onPress: () => performDelete(itemName, appInfo)
          }
        ]
      );
    } else {
      performDelete(itemName, appInfo);
    }
  } catch (error) {
    console.error('Error handling delete:', error);
    Alert.alert('Error', 'Failed to delete reference');
  }
};

const performDelete = async (itemName: string, appInfo: AppInfo) => {
  try {
    // Delete the reference folder
    const referencePath = `${baseFolderPath}/references/${itemName}`;
    await RNFS.unlink(referencePath);

    // Update projects that use this reference
    appInfo.projects = appInfo.projects.map(project => {
      if (project.referenceResource === itemName) {
        return { ...project, referenceResource: '' };
      }
      return project;
    });

    // Remove the reference from references array
    appInfo.references = appInfo.references.filter(
      ref => ref.referenceName !== itemName
    );

    // Write updated appInfo back to file
    await RNFS.writeFile(appInfoPath, JSON.stringify(appInfo, null, 2));

    // Update the UI
    setData(prevData => prevData.filter(item => item.name !== itemName));

    Alert.alert('Success', 'Reference deleted successfully');
  } catch (error) {
    console.error('Error performing delete:', error);
    Alert.alert('Error', 'Failed to delete reference');
  }
};



  useEffect(() => {
    // Function to load references from appInfo.json
    const loadReferences = async () => {
      try {
        // const appInfoPath = `${RNFS.DownloadDirectoryPath}/appInfo.json`;
        const appInfo = await RNFS.readFile(appInfoPath, 'utf8');
        const parsedInfo = JSON.parse(appInfo);

        const references = parsedInfo.references || [];
        const tableData: TableData[] = [];

        for (const reference of references) {
          const metadataPath = `${reference.referencePath}/metadata.json`;
          if (await RNFS.exists(metadataPath)) {
            const metadata = JSON.parse(
              await RNFS.readFile(metadataPath, 'utf8'),
            );
            const {languages, version,identification} = metadata;
            if(reference.referenceType.includes("Audio"))
            {
              const primaryKey = Object.keys(identification.primary)[0]; // Gets "scribe" (or the unknown key)
              const uniqueId = Object.keys(identification.primary[primaryKey])[0]; // Gets the UUID

            tableData.push({
              name: reference.referenceName,
              type: (reference.referenceType.includes("Bible") && reference.referenceType.includes("Audio")) ?'Both':'Audio' ,
              // type: type || 'Unknown',
              languageName: languages[0].name.en || 'Unknown',
              version: uniqueId || 'Unknown',
            });}
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
      <TouchableOpacity
        style={styles.deleteCell}
        onPress={() => handleDelete(item.name)}
      >
        <SvgXml xml={deleteIcon} width={20} height={20} stroke="#FF0000" />
      </TouchableOpacity>
      {/* <Text style={styles.cell}>{item.col5}</Text>
      <Text style={styles.cell}>{item.col6}</Text> */}
      {/* <Text style={styles.cell}>{item.col7}</Text> */}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Name</Text>
        <Text style={styles.headerCell}>Type</Text>
        <Text style={styles.headerCell}>Language Name</Text>
        <Text style={styles.headerCell}>Version</Text>
        <Text style={styles.headerCell}>Action</Text>
        {/* <Text style={styles.headerCell}></Text>
        <Text style={styles.headerCell}></Text> */}
        {/* <Text style={styles.headerCell}></Text> */}
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
    fontSize: 14,
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
  deleteCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default ListAudioPage;
