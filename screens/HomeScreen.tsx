import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import {
  Appbar,
  Menu,
  IconButton,
  Card,
  Dialog,
  Portal,
  Button,
  Provider,
  // Searchbar,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { SvgXml } from 'react-native-svg';
import ImportModal from './ImportModal';
import DarkLightToggle from './DarkLightToggleButton';
import RNFS from 'react-native-fs';
import ExportModal from './ExportModal';
import Loader2 from './Loader2';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon1 from 'react-native-vector-icons/Entypo';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ScreenNavigationProp = StackNavigationProp<
  RootStackParamList

>;

type Props = {
  navigation: ScreenNavigationProp;
};

interface ExportProject {
  exportedProjectName: string;
  ProjectPath: string;
}


const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isPortrait, setIsPortrait] = useState(true);

  const [search, setSearch] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [projects, setProjects] = useState<{
    [x: string]: string;
    id: string;
    name: string;
    path: string;
  }[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [update, setUpdate] = useState(false);
  const [exportedProject, setExportedProject] = useState<ExportProject | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Handles orientation changes and updates the layout
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      const newIsPortrait = height >= width;

      if (newIsPortrait !== isPortrait) {
        setIsPortrait(newIsPortrait);
      }
    };
    const subscription = Dimensions.addEventListener(
      'change',
      updateOrientation,
    );
    updateOrientation();
    return () => {
      subscription?.remove?.();
    };
  }, [isPortrait]);

  // Loads project data from `appInfo.json` on screen focus
  useFocusEffect(
    useCallback(() => {
      const loadProjects = async () => {
        try {
          // const folderPath = '/storage/emulated/0/Download/OBTRecorderApp';
          const folderPath = RNFS.DocumentDirectoryPath;

          const path = `${folderPath}/appInfo.json`;
          const fileContent = await RNFS.readFile(path);
          const appInfo = JSON.parse(fileContent);

          if (appInfo.projects && Array.isArray(appInfo.projects)) {
            const loadedProjects = appInfo.projects.map(
              (
                project: {
                  projectName: any;
                  projectPath: any;
                  referenceResource: any;
                },
                index: number,
              ) => ({
                id: `${index + 1}`,
                name: project.projectName,
                path: project.projectPath,
                reference: project.referenceResource,
              }),
            );
            setProjects(loadedProjects);
          } else {
            setProjects([]);
          }
          setUpdate(false);
        } catch (error) {
          console.error('Error reading appInfo.json:', error);
        }
      };

      loadProjects();
    }, [])
  );

  // Reloads project data when the update flag is set
  useEffect(() => {
    if (update === true) {
      const loadProjects = async () => {
        try {
          // const folderPath = '/storage/emulated/0/Download/OBTRecorderApp';
          const folderPath = RNFS.DocumentDirectoryPath;
          const path = `${folderPath}/appInfo.json`;
          const fileContent = await RNFS.readFile(path);
          const appInfo = JSON.parse(fileContent);

          if (appInfo.projects && Array.isArray(appInfo.projects)) {
            const loadedProjects = appInfo.projects.map(
              (
                project: {
                  projectName: any;
                  projectPath: any;
                  referenceResource: any;
                },
                index: number,
              ) => ({
                id: `${index + 1}`,
                name: project.projectName,
                path: project.projectPath,
                reference: project.referenceResource,
              }),
            );
            setProjects(loadedProjects);
          } else {
            setProjects([]);
          }
          setUpdate(false);
        } catch (error) {
          console.error('Error reading appInfo.json:', error);
        }
      };

      loadProjects();
    }
  }, [update]);

  // Handles the opening of the project menu
  const handleMenuOpen = (name: string) => {
    setSelectedProject(name);
    setMenuVisible(true);
  };

  // Handles the closing of the project menu
  const handleMenuClose = () => {
    setSelectedProject(null);
    setMenuVisible(false);
  };

  // Prepares the selected project for deletion
  const handleDelete = (name: string) => {
    console.log(name, "projectid");
    setProjectToDelete(name);
    setDialogVisible(true);
  };

  // Confirms and performs the project deletion
  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setIsLoading(true)
      setDialogVisible(false);

      // 1. Read the current appInfo.json
      // const appInfoPath = '/storage/emulated/0/Download/OBTRecorderApp/appInfo.json';
      const appInfoPath = `${RNFS.DocumentDirectoryPath}/appInfo.json`;

      const fileContent = await RNFS.readFile(appInfoPath);
      const appInfo = JSON.parse(fileContent);

      // 2. Find the project in appInfo.json
      const projectToRemove = appInfo.projects.find(
        (project: { projectName: string }) => project.projectName === projectToDelete,
      );

      if (!projectToRemove) {
        console.error('Project not found in appInfo.json');
        return;
      }

      // 3. Delete the project folder
      try {
        await RNFS.unlink(projectToRemove.projectPath);
      } catch (error) {
        console.error('Error deleting project folder:', error);
      }

      //Delete entry from Async storage
      try {
        await AsyncStorage.removeItem(`bcv_selection_${projectToDelete}`);
      } catch (error) {
        console.error('Error saving BCVselection:', error);
      }
      // 4. Update appInfo.json
      const updatedProjects = appInfo.projects.filter(
        (project: { projectName: string }) => project.projectName !== projectToDelete,
      );

      const updatedAppInfo = {
        ...appInfo,
        projects: updatedProjects,
      };

      // 5. Write the updated appInfo.json
      await RNFS.writeFile(
        appInfoPath,
        JSON.stringify(updatedAppInfo, null, 2),
        'utf8',
      );

      // 6. Update the UI
      setProjects(projects.filter(project => project.name !== projectToDelete));

      // 7. Close the dialog and clear the selected project
      setProjectToDelete(null);
      setIsLoading(false);
      Alert.alert("Project Deleted Successfully")


    } catch (error) {
      console.error('Error in delete operation:', error);
      // Optionally show an error message to the user
    }
  };

  // Closes the drawer menu
  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  // Handles the export of a project
  const handleExport = (name: string, path: string) => {
    console.log('Export project:', selectedProject);
    setExportedProject({
      exportedProjectName: name,
      ProjectPath: path
    });

    setShowExportModal(true);
    setMenuVisible(false);
    closeDrawer();
  };

  // Navigates to the Project Editor screen
  const navigateToProjectEditor = (
    id: string,
    name: string,
    path: string,
    reference: string,
  ) => {
    navigation.navigate('ProjectEditor', {
      projectId: id,
      projectName: name,
      projectPath: path,
      referenceResource: reference,
    });
  };

  // Handles the import of a folder
  const handleImport = async (folderPath: string) => {
    console.log('Imported folder path:', folderPath);
  };

  const logo =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" stroke="#D8DBBD"  stroke-width="2">  <path d="m6.667 33.334 16.667-16.667m0 0V8.333L16.667 15m6.667 1.667h8.333m-15-1.667v8.334H25M16.667 15 10 21.667V30h8.334"></path>  <path d="M23.333 8.333c1.06-1.055 2.522-1.667 4.138-1.667a5.859 5.859 0 0 1 5.862 5.857c0 1.619-.603 3.084-1.667 4.143L25 23.334 18.333 30"></path></svg>';

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header dark style={styles.appbarStyle} center-aligned>
          <View style={styles.logoContainer}>
            <SvgXml xml={logo} width="40" height="40" />
          </View>
          <Appbar.Content title={(!isSearchVisible || !isPortrait) ? "Scribe" : ""} style={styles.appbarTitle} color="#2980b9" />
          <View style={[styles.appbarRight, { width: (isSearchVisible && isPortrait) ? '85%' : (isSearchVisible && !isPortrait) ? '70%' : '25%' }]}>

            <Appbar.Action
              icon="menu"
              color="#2E4374"
              onPress={() => setDrawerVisible(true)}
            />
          </View>
        </Appbar.Header>
        {isLoading && <Loader2 visible={true} />}
        <View style={styles.searchBarContainer}>
          <Icon name='search' size={28} color="#4B527E" style={{ marginHorizontal: 8 }} />
          <TextInput
            style={styles.searchBarTextInput}
            placeholder="Search..."

            placeholderTextColor="#4B527E"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.glassCard1}>
          <View style={{ borderRadius: 10 }}>
            <FlatList
              data={projects.filter(project =>
                project.name.toLowerCase().includes(search.toLowerCase()),
              )}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    navigateToProjectEditor(
                      item.id,
                      item.name,
                      item.path,
                      item.reference,
                    )
                    console.log(item, "item reference")
                  }
                  }
                  style={styles.touchable}>
                  <View style={styles.projectContainer}>
                    <View style={{ flexDirection: 'row' }}>
                      <Icon1 name='text' size={22} color="#D8DBBD" style={{ marginHorizontal: 8 }} />

                      <Text style={styles.projectName}>{item.name}</Text>
                    </View>
                    <View style={styles.projectActions}>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDelete(item.name)}
                        iconColor="#2E4374"
                      />
                      <Menu
                        visible={menuVisible && selectedProject === item.name}
                        onDismiss={handleMenuClose}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            size={20}
                            onPress={() => handleMenuOpen(item.name)}
                            iconColor="#7C81AD"
                          />
                        }
                      >
                        <Menu.Item onPress={() => handleExport(item.name, item.path)} title="Export"
                        // background='#D8DBBD'
                        />
                      </Menu>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No Projects Available</Text>
                </View>
              )}
            />
          </View>
        </View>
        {/* </Card> */}
        {selectedProject && (
          <ExportModal
            visible={showExportModal}
            onDismiss={() => setShowExportModal(false)}
            projectPath={exportedProject?.ProjectPath}
            projectName={exportedProject?.exportedProjectName}
          />
        )}

        <ImportModal
          visible={importDialogVisible}
          onDismiss={() => setImportDialogVisible(false)}
          onImport={handleImport}
          onUpdate={() => setUpdate(true)}
        />
        <Portal>
          <Dialog
            visible={drawerVisible}
            onDismiss={closeDrawer}
            style={styles.drawerStyle}>
            <Button
              icon="file-import"

              onPress={() => {
                setImportDialogVisible(true);
                closeDrawer();
              }}
              textColor="#2E4374"
              mode="text"
              style={styles.drawerButton}>
              Import Project
            </Button>
            <Button
              icon="book"
              onPress={() => {
                navigation.navigate('ReferencePage');
                closeDrawer();
              }}
              mode="text"
              textColor="#2E4374"
              style={styles.drawerButton}>
              Import Reference
            </Button>
            <DarkLightToggle onToggle={() => console.log('')} />
          </Dialog>
        </Portal>
        <Portal>
          <Dialog
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>Confirm Delete</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete project-{projectToDelete}?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button onPress={confirmDelete}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',

  },
  appbarStyle: {
    height: 50,
    backgroundColor: '#fff',
  },
  appbarTitle: {
    // fontWeight:'700'
  },
  appbarRight: {
    // width:'70%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginEnd: 15,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // margin: 8,
    // borderWidth:1
  },
  searchBarContainer: {
    height: 50,
    marginTop: 15,
    marginBottom: 5,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D8DBBD',
    borderRadius: 8,
    backgroundColor: '#fff',

  },

  searchInput: {
    flex: 1,
    color: '#B59F78',
    fontSize: 18,

  },
  logoContainer: {
    borderRadius: 50,
    margin: 5,
  },
  searchBarTextInput: {
    color: '#4B527E',
    borderRadius: 7,
    fontSize: 15,
    backgroundColor: '#fff',
    fontWeight: '400',
    flex: 1,
  },
  glassCard: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderColor: '#576574',
    borderRadius: 10,
    elevation: 3,
    flex: 1,
  },
  glassCard1: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderColor: '#576574',
    borderRadius: 10,
    flex: 1,
  },

  projectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D8DBBD',
    marginBottom: 5
  },
  projectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2980b9',
    marginLeft: 5,

  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchable: {
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
  },
  drawerStyle: {
    backgroundColor: '#fff',
    position: 'absolute',
    right: 0,
    width: '45%',
    maxWidth: 250,
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 5,
    marginRight: 0,
    justifyContent: 'flex-start',
    borderWidth: 2,
    borderColor: '#D8DBBD'
  },
  drawerButton: {
    marginVertical: 10,
    alignItems: 'baseline',
    color: "#2E4374",

  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,

  },
  emptyText: {
    fontSize: 18,
    color: '#7C81AD',
  },
});

export default HomeScreen;