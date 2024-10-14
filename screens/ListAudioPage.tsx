import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';

// Define the type for table data
interface TableData {
  name: string;
  type: string;
  languageName: string;
  [key: string]: string; // For additional columns without headers
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
  const renderItem = ({item}: {item: TableData}) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.type}</Text>
      <Text style={styles.cell}>{item.languageName}</Text>
      <Text style={styles.cell}>{item.col4}</Text>
      {/* <Text style={styles.cell}>{item.col5}</Text>
      <Text style={styles.cell}>{item.col6}</Text> */}
      <Text style={styles.cell}>{item.col7}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Name</Text>
        <Text style={styles.headerCell}>Type</Text>
        <Text style={styles.headerCell}>Language Name</Text>
        <Text style={styles.headerCell}></Text>
        {/* <Text style={styles.headerCell}></Text>
        <Text style={styles.headerCell}></Text> */}
        <Text style={styles.headerCell}></Text>
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
});

export default ListAudioPage;
