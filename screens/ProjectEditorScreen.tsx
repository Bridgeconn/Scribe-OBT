import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  // TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon1 from 'react-native-vector-icons/MaterialIcons';
import { Appbar, Text, TextInput, IconButton } from 'react-native-paper';
// import ImportReferenceModal from './importRefernceModal';
import BookChapterVerseSelector from './BookChapterVerseSelector';
import RNFS from 'react-native-fs';
import AudioRecorder from './AudioRecorder';
import CustomBottomSheet from './MyBottomSheet';
import AudioPlayer, { AudioPlayerRef } from './AudioPlayer';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App'; // Adjust the import based on your project structure


type ReferenceType = {
  title: string;
  path: string | null;
};
type MetadataType = {
  ingredients: {
    [key: string]: any; // You can replace 'any' with a more specific type if you know the structure of the ingredient
  };
};
interface ProjectType {
  projectName: string;
  // add other properties if needed
}

interface AppInfo {
  projects: ProjectType[];
  // add other properties if needed
}


type ProjectEditorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProjectEditor'>;
type ProjectEditorScreenRouteProp = RouteProp<RootStackParamList, 'ProjectEditor'>;

type Props = {
  navigation: ProjectEditorScreenNavigationProp;
  route: ProjectEditorScreenRouteProp;
};


const ProjectEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isPortrait, setIsPortrait] = useState(true);
  const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
  const jsonFilePath = `${baseFolderPath}/appInfo.json`;
  const [referenceType, setReferenceType] = useState<ReferenceType[]>([]);
  const [selectedRef, setSelectedRef] = useState<ReferenceType | null>(null);
  const { projectId, projectName, projectPath, referenceRes } = route.params;
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [verseText, setVerseText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const bottomSheetRef = useRef(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('A');
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [currentScope, setCurrentScope] = useState<{ [key: string]: any }>({});

  // const [audioUrl, setAudioUrl] = useState(null);
  // const [metadata, setMetadata] = useState(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [projectAudioUrl, setProjectAudioUrl] = useState<string | null>(null);
  const [referenceMetadata, setReferenceMetadata] = useState<MetadataType | null>(null);
  const [projectMetadata, setProjectMetadata] = useState<MetadataType | null>(null);
  const [refreshMetadata, setRefreshMetadata] = useState(true)
  //font size 

  const [fontSize, setFontSize] = useState(16); // State for font size

  const increaseFontSize = () => {
    setFontSize(prevSize => (prevSize < 20 ? prevSize + 1 : prevSize));
  };

  const decreaseFontSize = () => {
    setFontSize(prevSize => (prevSize > 14 ? prevSize - 1 : prevSize));
  };


  // useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: () => (
  //       // <View style={{flexDirection: 'row'}}>
  //       //   <IconButton icon="format-font-size-increase" onPress={increaseFontSize}  iconColor={fontSize >= 20 ? '#d3d3d3' : '#ff9f1a'} />
  //       //   <IconButton icon="format-font-size-decrease" onPress={decreaseFontSize} iconColor={fontSize <= 14 ? '#d3d3d3' : '#ff9f1a'}  />
  //       // </View>
  //     ),
  //   });
  // }, [navigation,fontSize]);
  // Load reference metadata
  useEffect(() => {
    const loadReferenceMetadata = async () => {
      if (selectedRef) {
        const metadataPath = `${selectedRef.path}/metadata.json`;
        try {
          const content = await RNFS.readFile(metadataPath, 'utf8');
          const parsedMetadata = JSON.parse(content);
          setReferenceMetadata(parsedMetadata);
        } catch (error) {
          console.error('Error reading reference metadata:', error);
          setReferenceMetadata(null);
        }
      }
    };

    loadReferenceMetadata();
  }, [selectedRef]);


  const updateMetadata = (booleanData: boolean) => {
    setRefreshMetadata(!booleanData);
  };
  useEffect(() => {
    const loadProjectMetadata = async () => {
      const metadataPath = `${projectPath}/metadata.json`;
      try {
        const content = await RNFS.readFile(metadataPath, 'utf8');
        const parsedMetadata = JSON.parse(content);
        setProjectMetadata(parsedMetadata);
      } catch (error) {
        console.error('Error reading project metadata:', error);
        setProjectMetadata(null);
      }
    };
    if (refreshMetadata) {
      loadProjectMetadata();
      updateMetadata(!refreshMetadata)
    }
  }, [projectPath]);

  // const generateAudioUrl = () => {
  //   if (selectedRef && selectedBook && selectedChapter && selectedVerse && metadata) {
  //     const formattedChapter = selectedChapter.toString();
  //     const formattedVerse = selectedVerse.toString();
  //     const audioFileName = `${formattedChapter}_${formattedVerse}.wav`;
  //     const ingredientPath = `audio/ingredients/${selectedBook}/${formattedChapter}/${audioFileName}`;

  //     // Check if the audio file exists in the metadata
  //     if (metadata.ingredients && metadata.ingredients[ingredientPath]) {
  //       const url = `${selectedRef.path}/${ingredientPath}`;
  //       setAudioUrl(url);
  //     } else {
  //       console.log(`Audio file not found in metadata: ${ingredientPath}`);
  //       setAudioUrl(null);
  //     }
  //   } else {
  //     setAudioUrl(null);
  //   }
  // };
  const generateAudioUrls = useCallback(() => {
    if (selectedBook && selectedChapter && selectedVerse) {
      const formattedChapter = selectedChapter.toString();
      const formattedVerse = selectedVerse.toString();

      // Reference audio path generation (remains the same)
      if (selectedRef && referenceMetadata) {
        const referenceAudioFileName = `${formattedChapter}_${formattedVerse}.wav`;
        const referenceIngredientPath = `audio/ingredients/${selectedBook}/${formattedChapter}/${referenceAudioFileName}`;

        if (referenceMetadata.ingredients?.[referenceIngredientPath]) {
          setReferenceAudioUrl(`${selectedRef.path}/${referenceIngredientPath}`);
        } else {
          setReferenceAudioUrl(null);
        }
      }

      // Project audio path generation based on metadata ingredients
      if (projectMetadata?.ingredients) {
        // Find matching audio file in ingredients
        const matchingAudioFile = Object.entries(projectMetadata.ingredients).find(([path, info]: [string, any]) => {
          // Check if this is an audio file
          if (info.mimeType === 'audio/wav' && info.scope) {
            // Check if the scope matches current selection
            return Object.entries(info.scope).some(([book, verses]: [string, string[]]) => {
              return book === selectedBook &&
                verses.includes(`${selectedChapter}:${selectedVerse}`);
            });
          }
          return false;
        });

        if (matchingAudioFile) {
          const [audioPath] = matchingAudioFile;
          console.log('audio file:', audioPath);

          setProjectAudioUrl(`${projectPath}/${audioPath}`);
          console.log('Found matching audio file:', audioPath);
        } else {
          // If no direct match found, try the default naming pattern
          const defaultAudioPath = `audio/ingredients/${selectedBook}/${formattedChapter}/${formattedChapter}_${formattedVerse}.wav`;
          if (projectMetadata.ingredients[defaultAudioPath]) {
            setProjectAudioUrl(`${projectPath}/${defaultAudioPath}`);
            console.log('Using default audio path:', defaultAudioPath);
          } else {
            setProjectAudioUrl(null);
            console.log('No matching audio file found');
          }
        }
      } else {
        setProjectAudioUrl(null);
      }
    } else {
      setReferenceAudioUrl(null);
      setProjectAudioUrl(null);
    }
  }, [selectedRef, selectedBook, selectedChapter, selectedVerse, referenceMetadata, projectMetadata, projectPath]);

  useEffect(() => {
    generateAudioUrls();
  }, [generateAudioUrls]);


  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    // You can add additional logic here based on the selected option
  };

  // console.log(referenceRes,"referenceRes");
  const [cachedData, setCachedData] = useState<any>({});
  // console.log(projectPath,"Project pathname")



  const loadReferencesFromJson = useCallback(async () => {
    try {
      const fileExists = await RNFS.exists(jsonFilePath);
      if (fileExists) {
        const jsonData = await RNFS.readFile(jsonFilePath, 'utf8');
        const parsedData = JSON.parse(jsonData);
        if (parsedData.references) {
          const formattedReferences = parsedData.references.map((ref: any) => ({
            title: ref.referenceName,
            path: ref.referencePath,
          }));
          setReferenceType(formattedReferences);
          const defaultRef = formattedReferences.find(ref => ref.title === referenceRes);
          setSelectedRef(defaultRef);
        } else {
          setReferenceType([{ title: 'No option available', path: null }]);
        }
      } else {
        console.log('JSON file does not exist.');
        setReferenceType([{ title: 'No option available', path: null }]);
      }
    } catch (error) {
      console.log('Error reading JSON file:', error);
      setReferenceType([{ title: 'No option available', path: null }]);
    }
  }, [jsonFilePath, referenceRes]);


  const loadVerseText = useCallback(
    async (book: string, chapter: number, verse: number) => {
      if (!selectedRef) return;
      const bookPath = `${selectedRef.path}/text-1/ingredients/${book}.json`;
      // console.log(selectedRef,"selectedRef")
      // Check if data is already cached
      if (cachedData[bookPath]) {
        const bookData = cachedData[bookPath];
        const selectedChapterObj = bookData?.chapters.find(
          (chapterObj: any) => chapterObj.chapterNumber === chapter.toString(),
        );

        if (selectedChapterObj) {
          const content = selectedChapterObj.contents.find(
            (verseObj: any) => verseObj.verseNumber === verse.toString(),
          );
          setVerseText(content ? content.verseText : 'Verse not found');
        } else {
          setVerseText('Chapter not found');
        }
        setLoading(false);
        return;
      }

      try {
        const fileExists = await RNFS.exists(bookPath);
        if (fileExists) {
          setLoading(true);
          const jsonData = await RNFS.readFile(bookPath, 'utf8');
          const bookData = JSON.parse(jsonData);

          // Cache data after reading
          setCachedData((prevCache: any) => ({
            ...prevCache,
            [bookPath]: bookData,
          }));

          const selectedChapterObj = bookData.chapters.find(
            (chapterObj: any) =>
              chapterObj.chapterNumber === chapter.toString(),
          );

          if (selectedChapterObj) {
            const content = selectedChapterObj.contents.find(
              (verseObj: any) => verseObj.verseNumber === verse.toString(),
            );
            setVerseText(content ? content.verseText : 'Verse not found');
          } else {
            setVerseText('Chapter not found');
          }
        } else {
          // setVerseText('File not found');
          setVerseText('Content Not Available');
        }
        setLoading(false);
      } catch (error) {
        console.log('Error reading verse JSON file:', error);
        setLoading(false);
        setVerseText('Error loading verse.');
      }
    },
    [selectedRef, cachedData],
  );

  useEffect(() => {
    const loadCurrentScope = async () => {
      try {
        const metadataPath = `${projectPath}/metadata.json`;
        const alternativeMetadataPath = `${projectPath}/text-1/metadata.json`;

        let data;
        if (await RNFS.exists(metadataPath)) {
          const content = await RNFS.readFile(metadataPath, 'utf8');
          data = JSON.parse(content);
        } else if (await RNFS.exists(alternativeMetadataPath)) {
          const content = await RNFS.readFile(alternativeMetadataPath, 'utf8');
          data = JSON.parse(content);
        } else {
          console.log('metadata.json not found in either location');
          return;
        }

        if (data && data.type && data.type.flavorType && data.type.flavorType.currentScope) {
          const scopeKeys = Object.keys(data.type.flavorType.currentScope);
          const formattedScope: Record<string, any[]> = scopeKeys.reduce((acc, key) => {
            acc[key] = [];
            return acc;
          }, {} as Record<string, any[]>);
          setCurrentScope(formattedScope);
          // console.log(formattedScope,"fs")
        } else {
          console.log('currentScope not found in metadata.json');
        }
      } catch (error) {
        console.error('Error loading currentScope:', error);
      }
    };

    loadCurrentScope();
  }, [projectPath]);



  const handleSelectionChange = useCallback(
    (book: string, chapter: number, verse: number) => {
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setSelectedVerse(verse);
      if (selectedRef) {
        loadVerseText(book, chapter, verse);
      }
    },
    [loadVerseText, selectedRef],
  );

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      const newIsPortrait = height >= width;

      if (newIsPortrait !== isPortrait) {
        setIsPortrait(newIsPortrait);
        // Stop audio playback when orientation changes
        audioPlayerRef.current?.stopPlaying();
      }
    };
    const subscription = Dimensions.addEventListener(
      'change',
      updateOrientation,
    );
    updateOrientation();
    loadReferencesFromJson();
    return () => {
      subscription?.remove?.();
    };
  }, [loadReferencesFromJson, isPortrait]);

  useEffect(() => {
    if (selectedRef) {
      loadVerseText(selectedBook, selectedChapter, selectedVerse);
    }
  }, [
    selectedRef,
    selectedBook,
    selectedChapter,
    selectedVerse,
    loadVerseText,
  ]);

  const updateAppInfoJson = useCallback(async (selectedReference: ReferenceType) => {
    const appInfoPath = `${RNFS.ExternalStorageDirectoryPath}/Download/OBTRecorderApp/appInfo.json`;

    try {
      // Read the current appInfo.json
      const jsonContent = await RNFS.readFile(appInfoPath, 'utf8');
      const appInfo = JSON.parse(jsonContent);

      // Find the project and update it
      const updatedProjects = appInfo.projects.map((project: ProjectType) => {
        if (project.projectName === projectName) {
          return {
            ...project,
            ReferenceResource: selectedReference.title
          };
        }
        return project;
      });

      // Update the appInfo object
      appInfo.projects = updatedProjects;

      // Write the updated appInfo back to the file
      await RNFS.writeFile(appInfoPath, JSON.stringify(appInfo, null, 2), 'utf8');

      console.log('appInfo.json updated successfully');
    } catch (error) {
      console.error('Error updating appInfo.json:', error);
    }
  }, [projectName]);



  return (
    <View style={styles.container}>
      {/* <Appbar.Header style={styles.appbarStyle} dark> */}
      {/* <Appbar.Content title={`${projectName}`} /> */}
      {/* </Appbar.Header> */}


      <View>
        {currentScope &&
          <BookChapterVerseSelector onSelectionChange={handleSelectionChange} currentScope={currentScope} />
        }
      </View>
      {/* card code begins here */}
      <View
        style={{
          alignItems: 'center',
          height: isPortrait ? '90%' : '80%',
          // backgroundColor: '#ddd'
          // borderWidth:1
        }}>
        <View
          style={{
            width: '100%',
            height: '99%',
            alignItems: 'center',
            // padding: 5,
            flexDirection: isPortrait ? 'column' : 'row',
            justifyContent: 'space-evenly',
            // borderWidth: 1,
          }}>
          <View
            style={{
              height: isPortrait ? '45%' : '90%',
              width: isPortrait ? '95%' : '48%',
              marginTop: isPortrait ? 12 : 0,
              // bottom: isPortrait ? 0 : 35,
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 5,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
            <View
              style={
                // styles.cardTitleContainer,[]
                {

                  // border:1,
                  // padding: 3,
                  // backgroundColor:'#ecf0f1',
                  // borderBottomColor:'#95a5a6'
                  flexDirection:'row',
                  alignItems:'center',
                  height: 50,
                  // marginTop: 5,
                  width: '100%',
                  borderBottomWidth: 1,
                  borderColor: '#bdc3c7',
                  // alignContent:'center'
                }
              }>
          
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width:'100%'}}>
                <Text style={[styles.cardTitleText,]}>Reference</Text>
                <SelectDropdown
                  data={referenceType}
                  defaultValue={selectedRef}
                  onSelect={(selectedItem, index) => {
                    if (selectedItem.path) {
                      setSelectedRef(selectedItem);
                      updateAppInfoJson(selectedItem);
                    }
                  }}
                  buttonTextAfterSelection={(selectedItem) => {
                    return selectedItem ? selectedItem.title : 'Select Reference';
                  }}
                  rowTextForSelection={(item) => {
                    return item.title;
                  }}
                  renderButtonText={(selectedItem) => {
                    return selectedItem ? selectedItem.title : 'Select Reference';
                  }}
                  renderButton={(selectedItem, isOpened) => {
                    return (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>
                          {selectedItem ? selectedItem.title : 'Select Reference'}
                        </Text>
                        <Icon
                          name={isOpened ? 'chevron-up' : 'chevron-down'}
                          style={styles.dropdownButtonArrowStyle}
                        />
                      </View>
                    );
                  }}
                  renderItem={(item, index, isSelected) => {
                    return (
                      <View
                        style={{
                          ...styles.dropdownItemStyle,
                          ...(isSelected && { backgroundColor: '#D2D9DF' }),
                          ...(item.path === null && { backgroundColor: '#f0f0f0' }),
                        }}>
                        <Text
                          style={{
                            ...styles.dropdownItemTxtStyle,
                            ...(item.path === null && { color: '#888' }),
                          }}
                        >
                          {item.title}
                        </Text>
                      </View>
                    );
                  }}
                  buttonStyle={styles.dropdownButtonStyle}
                  buttonTextStyle={styles.dropdownButtonTxtStyle}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
                 
                {/* <View style={{borderWidth:1}}>               */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width:'14%' }}>

                <TouchableOpacity onPress={decreaseFontSize}
                  // style={{ borderWidth: 1, borderColor: '#a4b0be' }}
                >
                  <Icon1 name="text-decrease" onPress={decreaseFontSize} size={20} color={fontSize <= 14 ? '#d3d3d3' : '#40739e'} />

                </TouchableOpacity>
                <TouchableOpacity onPress={increaseFontSize}
                  // style={{ borderWidth: 1, borderColor: '#a4b0be' }}
                >
                  <Icon1 name="text-increase" size={20} color={fontSize >= 20 ? '#d3d3d3' : '#40739e'} />

                </TouchableOpacity>

               </View>
              </View>
            </View>
            <View style={[styles.cardContent, { marginTop: 10, }]}>
              <ScrollView persistentScrollbar={true}>
                {loading ? (
                  <ActivityIndicator size="large" color="#2980b9" />
                ) : verseText === '' ? (
                  <Text style={styles.emptySource}>
                    Please select the Source Reference{' '}
                  </Text>
                ) : (
                  <Text style={[styles.cardContentText, { fontSize }]}>{verseText} </Text>
                )}
              </ScrollView>

            </View>
            {/* {isPortrait && ( */}
            <View style={styles.audioPlayerContainerPortrait}>
              {referenceAudioUrl ?
                <AudioPlayer ref={audioPlayerRef} url={referenceAudioUrl} /> : <Text style={{ margin: 'auto' }}>Audio Not Available</Text>
              }

            </View>
            {/* )} */}
          </View>

          <View
            style={{
              height: isPortrait ? '48%' : '90%',
              width: isPortrait ? '95%' : '48%',
              marginTop: isPortrait ? 12 : 0,
              // bottom: isPortrait ? 0 : 35,

              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 5,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
            <View
              style={[
                styles.cardTitleTextContainer,
                {
                  padding: 5,
                  height: 50,
                  width: '100%',
                  borderBottomWidth: 1,
                  borderColor: '#bdc3c7'
                },
              ]}>
              {/* <Text style={styles.cardTitleText}> </Text> */}
              {/* <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', height: '40%' }}> */}
                {/* <TouchableOpacity onPress={decreaseFontSize}
                  style={{ borderWidth: 1, marginRight: 10, borderColor: '#a4b0be' }}
                >
                  <Icon name="format-font-size-decrease" onPress={decreaseFontSize} size={20} color={fontSize <= 14 ? '#d3d3d3' : '#ff9f1a'} />

                </TouchableOpacity>
                <TouchableOpacity onPress={increaseFontSize}
                  style={{ borderWidth: 1, marginRight: 10, borderColor: '#a4b0be' }}
                >
                  <Icon name="format-font-size-increase" size={20} color={fontSize >= 20 ? '#d3d3d3' : '#ff9f1a'} />

                </TouchableOpacity> */}

               {/* </View> */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

              <Text style={styles.cardTitleText}>{`${projectName}`}</Text>
              {/* <IconButton
                icon="pencil"
                size={isPortrait ? 24 : 20}
                onPress={() => {}}
              />*/}
              </View>
            </View>
            <View style={styles.cardContent}>
              {/* <ScrollView>
                <TextInput
                  numberOfLines={isPortrait ? 9 : 5}
                  multiline={true}
                  // placeholder="The king’s scribes were summoned at that time, in the third month, which is the month of Sivan, on the twenty-third day. And an edict was written, according to all that Mordecai commanded concerning the Jews, to the satraps and the governors and the officials of the provinces from India to Ethiopia, 127 provinces, to each province in its own script and to each people in its own language, and also to the Jews in their script and their language."
                  placeholder={verseText}
                  style={{textAlign:'justify'}}
                />
              </ScrollView> */}
            </View>
            {/* <AudioRecorder /> */}
            <View style={styles.audioRecorderContainer}>

              <AudioRecorder
                existingRecordingPath={projectAudioUrl ? projectAudioUrl : ""}
                projectPath={projectPath}
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                selectedVerse={selectedVerse} />
            </View>
          </View>
        </View>
        {/* </ScrollView>  */}
      </View>
      {/* <View style={styles.audioControlsContainer}> */}
      {/* {!isPortrait && (
            <View style={styles.audioPlayerContainerLandscape}>
              <AudioPlayer ref={audioPlayerRef}/>
            </View>
          )} */}
      {/* <View style={styles.audioRecorderContainer}>
            <AudioRecorder />
          </View> */}
      {/* </View> */}
      {/*      
      <CustomBottomSheet
        ref={bottomSheetRef}
        bottomSheetIndex={bottomSheetIndex}
        onChange={(index) => setBottomSheetIndex(index)}
        onOptionSelect={handleOptionSelect}
        selectedOption={selectedOption}
      /> */}
    </View>
    // </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ddd',
  },
  appbarStyle: {
    height: 45,
    // backgroundColor: 'black',
    backgroundColor: '#636e72',
  },
  importButton: {
    marginRight: 16,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    padding: 5,
  },
  importButtonText: {
    fontSize: 14,
    color: '#fff',
    // color: '',
  },
  dropdownButtonStyle: {
    width: 200,
    height: 30,
    borderColor: '#95a5a6',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    backgroundColor: '#fff'
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#2980b9',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
    color: '#22a6b3',
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  // modalContainer1: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'grey',
  //   width: '90%',
  //   height: 500,
  //   borderColor: 'black',
  //   borderWidth: 1,
  //   margin: 'auto',
  // },

  container1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardTitleContainer: {
    marginBottom: 16,
    // borderWidth: 1,
  },
  cardTitleTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderWidth: 1,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#40739e'
  },
  cardSubtitleText: {
    fontSize: 16,
    color: 'gray',
  },
  cardContent: {
    flex: 1,
    marginTop: 5,
  },
  emptySource: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    // color: '#fdcb6e',
    // backgroundColor: '#636e72',
    // marginVertical: 'auto',
  },
  cardContentText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
    lineHeight: 26,
    textAlign: 'justify',
    height: '100%'
    // borderWidth:1,
    // minHeight:300
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
    // justifyContent: 'space-between',
  },
  audioControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
  },
  audioPlayerContainerPortrait: {
    height: 50,
    marginTop: 5,
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#bdc3c7'
  },
  // audioPlayerContainerLandscape: {
  //   flex: 1,
  //   marginHorizontal: 10,

  //   borderWidth: 1,
  //   borderColor: '#bdc3c7',
  // },
  audioRecorderContainer: {
    // flex: 1,
    // marginHorizontal: 10,

    // borderWidth: 1,
    // borderColor: '#bdc3c7',
    height: 50,
    marginTop: 5,
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#bdc3c7'
  },

});

export default ProjectEditorScreen;
