import React, {useState} from 'react';
import {View, TextInput, Button, StyleSheet, Text} from 'react-native';

const CreateProjectScreen: React.FC = () => {
  const [projectName, setProjectName] = useState('');

  const handleCreate = () => {
    // Add logic to create a new project
    console.log('Project Created:', projectName);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Project Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter project name"
        placeholderTextColor="#888"
        value={projectName}
        onChangeText={setProjectName}
      />
      <Button title="Create Project" onPress={handleCreate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: '#2c3e50',
  },
  label: {
    marginBottom: 5,
    color: '#2980b9',
  },
});

export default CreateProjectScreen;
