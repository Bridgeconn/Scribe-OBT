import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  FlatList,
  // Dimensions,
  TouchableOpacity,
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
} from 'react-native-paper';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../App';
import {SvgXml} from 'react-native-svg';
import ImportModal from './ImportModal';
import ImportReferenceModal from './importRefernceModal';
import DarkLightToggle from './DarkLightToggleButton';
import RNFS from 'react-native-fs';

type CreateProjectScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateProject'
>;

type Props = {
  navigation: CreateProjectScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<{
    [x: string]: string;id: string; name: string
}[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importReferenceDialogVisible, setImportReferenceDialogVisible] =
    useState(false);
  const [update, setUpdate] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const folderPath = '/storage/emulated/0/Download/OBTRecorderApp';
        const path = `${folderPath}/appInfo.json`;
        // const path = `${RNFS.DocumentDirectoryPath}/appInfo.json`;
        const fileContent = await RNFS.readFile(path);
        const appInfo = JSON.parse(fileContent);

        if (appInfo.projects && Array.isArray(appInfo.projects)) {
          const loadedProjects = appInfo.projects.map((project: { projectName: any; projectPath: any; referenceResource: any; }, index: number) => ({
            id: `${index + 1}`,
            name: project.projectName,
            path: project.projectPath,
            reference:project.referenceResource,
          }));
          setProjects(loadedProjects);
        } else {
          setProjects([]); // Fallback if the projects array is missing or not an array
        }
        setUpdate(false);
      } catch (error) {
        console.error('Error reading appInfo.json:', error);
      }
    };

    loadProjects();
  }, []);


  useEffect(() => {
    if (update === true) {
      const loadProjects = async () => {
        try {
          const folderPath = '/storage/emulated/0/Download/OBTRecorderApp';
          const path = `${folderPath}/appInfo.json`;
          // const path = `${RNFS.DocumentDirectoryPath}/appInfo.json`;
          const fileContent = await RNFS.readFile(path);
          const appInfo = JSON.parse(fileContent);

          if (appInfo.projects && Array.isArray(appInfo.projects)) {
            const loadedProjects = appInfo.projects.map((project: { projectName: any; projectPath: any; referenceResource: any; }, index: number) => ({
              id: `${index + 1}`,
              name: project.projectName,
              path: project.projectPath,
              reference: project.referenceResource
            }));
            setProjects(loadedProjects);
          } else {
            setProjects([]); // Fallback if the projects array is missing or not an array
          }
          setUpdate(false);
        } catch (error) {
          console.error('Error reading appInfo.json:', error);
        }
      };

      loadProjects();
    }
  }, [update]);

  // const [isLandscape, setIsLandscape] = useState(false);

  // useEffect(() => {
  //   const updateOrientation = () => {
  //     const {width, height} = Dimensions.get('window');
  //     setIsLandscape(width > height);
  //   };

  //   const subscription = Dimensions.addEventListener(
  //     'change',
  //     updateOrientation,
  //   );

  //   // Initial check
  //   updateOrientation();

  //   return () => {
  //     subscription?.remove();
  //   };
  // }, []);
  const handleMenuOpen = (id: string) => {
    setSelectedProject(id);
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setSelectedProject(null);
    setMenuVisible(false);
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDialogVisible(true);
  };

  const confirmDelete = () => {
    setProjects(projects.filter(project => project.id !== projectToDelete));
    setDialogVisible(false);
    setProjectToDelete(null);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleExport = () => {
    console.log('Export project:', selectedProject);
    closeDrawer();
  };

  const navigateToProjectEditor = (id: string, name: string , path:string, reference:string) => {
    navigation.navigate('ProjectEditor', {projectId: id, projectName: name, projectPath:path, referenceResource:reference});
  };

  const handleImport = async (folderPath: string) => {
    console.log('Imported folder path:', folderPath);
  };

  const logo =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" stroke="#fff">  <path d="m6.667 33.334 16.667-16.667m0 0V8.333L16.667 15m6.667 1.667h8.333m-15-1.667v8.334H25M16.667 15 10 21.667V30h8.334"></path>  <path d="M23.333 8.333c1.06-1.055 2.522-1.667 4.138-1.667a5.859 5.859 0 0 1 5.862 5.857c0 1.619-.603 3.084-1.667 4.143L25 23.334 18.333 30"></path></svg>';

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header dark style={styles.appbarStyle}>
          <View style={styles.logoContainer}>
            <SvgXml xml={logo} width="40" height="40" />
          </View>
          <Appbar.Content title="Scribe OBT App" color="#f7f1e3" />
          <Appbar.Action icon="menu" onPress={() => setDrawerVisible(true)} />
        </Appbar.Header>
        <TextInput
          style={styles.searchBar}
          placeholder="Search..."
          placeholderTextColor="grey"
          value={search}
          onChangeText={setSearch}
        />
        <Card style={styles.glassCard}>
          <FlatList
            data={projects.filter(project =>
              project.name.toLowerCase().includes(search.toLowerCase()),
            )}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => navigateToProjectEditor(item.id, item.name, item.path , item.reference)}
                style={styles.touchable}>
                <View style={styles.projectContainer}>
                  <Text style={styles.projectName}>{item.name}</Text>
                  <View style={styles.projectActions}>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(item.id)}
                      iconColor="grey"
                    />
                    <Menu
                      visible={menuVisible && selectedProject === item.id}
                      onDismiss={handleMenuClose}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          onPress={() => handleMenuOpen(item.id)}
                          iconColor="#34495e"
                        />
                      }>
                      <Menu.Item onPress={handleExport} title="Export" />
                      {/* <Menu.Item onPress={() => {}} title="Sync" disabled /> */}
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
        </Card>
        <ImportModal
          visible={importDialogVisible}
          onDismiss={() => setImportDialogVisible(false)}
          onImport={handleImport}
          onUpdate={() => setUpdate(true)}
        />
        {/* <ImportReferenceModal
          visible={importReferenceDialogVisible}
          onClose={() => setImportReferenceDialogVisible(false)}
        /> */}
        <Portal>
          <Dialog
            visible={drawerVisible}
            onDismiss={closeDrawer}
            style={
              styles.drawerStyle
              // styles.drawerContentStyle
            }
            // contentContainerStyle={styles.drawerContentStyle}
          >
            <Button
              icon="file-import"
              onPress={() => {
                setImportDialogVisible(true);
                closeDrawer();
              }}
              textColor="#fff"
              mode="text"
              style={styles.drawerButton}>
              Import Project
            </Button>
            {/* <Button
              icon="folder-plus"
              onPress={() => {
                navigation.navigate('CreateProject');
                closeDrawer();
              }}
              mode="text"
              textColor="#fff"
              style={styles.drawerButton}>
              Create Project
            </Button> */}
            <Button
              icon="book"
              onPress={() => {
                // setImportReferenceDialogVisible(true);
                navigation.navigate('ReferencePage');

                closeDrawer();
              }}
              mode="text"
              textColor="#fff"
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
              <Text>Are you sure you want to delete this project?</Text>
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
  },
  appbarStyle: {
    height: 50,
    backgroundColor: '#636e72',
  },
  logoContainer: {
    borderRadius: 50,
    margin: 5,
    backgroundColor: '#e15f41',
  },
  searchBar: {
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#2c3e50',
    borderRadius: 7,
    fontSize: 15,
    // padding: 7,
    fontWeight: '400',
  },
  glassCard: {
    marginHorizontal: 10,
    marginBottom: 10,
    // margin: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    elevation: 5,
    flex: 1,
  },
  projectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchable: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  drawerStyle: {
     backgroundColor: '#2f3542',
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
    // right: 0,

    // color: '#ddd',
  },
  drawerContentStyle: {
    flex: 1,
    padding: 20,
  },
  drawerButton: {
    marginVertical: 10,
    // justifyContent: 'flex-start',
    // backgroundColor: '#ddd',
    alignItems: 'baseline',
    // width: '75%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: 'grey',
  },
});

export default HomeScreen;
