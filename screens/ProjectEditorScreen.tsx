import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  // TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Icon1 from 'react-native-vector-icons/MaterialCommunityIcons';
import {Appbar, Text, TextInput, IconButton} from 'react-native-paper';
// import ImportReferenceModal from './importRefernceModal';
import BookChapterVerseSelector from './BookChapterVerseSelector';
import RNFS from 'react-native-fs';
// import CardTitle from 'react-native-paper/lib/typescript/components/Card/CardTitle';

// const {height} = Dimensions.get('window'); // Get screen height

const ProjectEditorScreen: React.FC<{route: any}> = ({route}) => {
  const [isPortrait, setIsPortrait] = useState(true);
  const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
  const jsonFilePath = `${baseFolderPath}/appInfo.json`;
  const [referenceType, setReferenceType] = useState([]);
  const [selectedRef, setSelectedRef] = useState('');
  const {projectId, projectName} = route.params;
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [verseText, setVerseText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [cachedData, setCachedData] = useState<any>({});

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
        }
      } else {
        console.log('JSON file does not exist.');
      }
    } catch (error) {
      console.log('Error reading JSON file:', error);
    }
  }, [jsonFilePath]);

  const loadVerseText = useCallback(
    async (book: string, chapter: number, verse: number) => {
      if (!selectedRef) return;
      const bookPath = `${selectedRef.path}/text-1/ingredients/${book}.json`;

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
          setVerseText('File not found');
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
      const {width, height} = Dimensions.get('window');
      setIsPortrait(height >= width);
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
  }, [loadReferencesFromJson]);

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

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarStyle} dark>
        <Appbar.Content title={`${projectName}`} />
        <SelectDropdown
          data={referenceType}
          onSelect={(selectedItem, index) => {
            // console.log(selectedItem, index);
            setSelectedRef(selectedItem);
          }}
          // defaultValueByIndex={0}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                {selectedItem && (
                  <Icon1
                    name={selectedItem.icon}
                    style={styles.dropdownButtonIconStyle}
                  />
                )}
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && selectedItem.title) || 'Select Reference'}
                </Text>
                <Icon1
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
                  ...(isSelected && {backgroundColor: '#D2D9DF'}),
                }}>
                <Icon1 name={item.icon} style={styles.dropdownItemIconStyle} />
                <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
      </Appbar.Header>

      {/* <BookChapterVerseSelector /> */}
      <View>
        <BookChapterVerseSelector onSelectionChange={handleSelectionChange} />
        {/* <Text>
          Selected: {selectedBook} {selectedChapter}:{selectedVerse}
        </Text> */}
      </View>
      {/* <ImportReferenceModal visible={isModalVisible} onClose={closeModal} /> */}
      {/* card code begins here */}
      <View
        style={{
          alignItems: 'center',
          height: '75%',
        }}>
        <View
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            // padding: 5,
            flexDirection: isPortrait ? 'column' : 'row',
            justifyContent: isPortrait ? '' : 'space-evenly',
            // borderWidth: 1,
          }}>
          <View
            style={{
              height: isPortrait ? '48%' : '65%',
              width: isPortrait ? '95%' : '45%',
              marginTop: isPortrait ? 12 : 0,
              bottom: isPortrait ? 0 : 35,
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 16,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            <View
              style={[
                styles.cardTitleContainer,
                {
                  flexDirection: isPortrait ? '' : 'row',
                  justifyContent: isPortrait ? '' : 'space-between',
                  alignItems: isPortrait ? '' : 'center',
                },
              ]}>
              {/* <Text style={styles.cardSubtitleText}>{selectedRef?.title}</Text> */}
            </View>
            <View style={styles.cardContent}>
              <ScrollView persistentScrollbar={true}>
                {loading ? (
                  <ActivityIndicator size="large" color="#2980b9" />
                ) : verseText === '' ? (
                  <Text style={[styles.cardContentText, styles.emptySource]}>
                    Please select the Source Reference{' '}
                  </Text>
                ) : (
                  <Text style={styles.cardContentText}>{verseText} </Text>
                )}
              </ScrollView>
            </View>
          </View>

          <View
            style={{
              height: isPortrait ? '48%' : '65%',
              width: isPortrait ? '95%' : '45%',
              marginTop: isPortrait ? 12 : 0,
              bottom: isPortrait ? 0 : 35,

              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 16,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
            {/* <View style={[styles.cardTitleTextContainer,{height:isPortrait ? '':'20%',borderWidth: 1, fontSize: 18,fontWeight: 'bold',}]}> */}
            <View
              style={[
                styles.cardTitleTextContainer,
                {
                  height: isPortrait ? '' : '20%',
                  fontSize: isPortrait ? 20 : 18,
                  fontWeight: 'bold',
                },
              ]}>
              {/* <Text style={styles.cardTitleText}> </Text> */}
              <Text style={styles.cardTitleText}>Editor</Text>
              <IconButton
                icon="pencil"
                size={isPortrait ? 24 : 20}
                onPress={() => {}}
              />
            </View>
            <View style={styles.cardContent}>
              <ScrollView>
                <TextInput
                  numberOfLines={isPortrait ? 9 : 5}
                  multiline={true}
                  // placeholder="The king’s scribes were summoned at that time, in the third month, which is the month of Sivan, on the twenty-third day. And an edict was written, according to all that Mordecai commanded concerning the Jews, to the satraps and the governors and the officials of the provinces from India to Ethiopia, 127 provinces, to each province in its own script and to each people in its own language, and also to the Jews in their script and their language."
                  placeholder={verseText}
                />
              </ScrollView>
            </View>
          </View>
        </View>
        {/* </ScrollView>  */}
      </View>
    </View>
    // </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  appbarStyle: {
    height: 50,
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
    backgroundColor: '#ddd',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
    color: '#000',
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
  },
  cardSubtitleText: {
    fontSize: 16,
    color: 'gray',
  },
  cardContent: {
    flex: 1,
  },
  emptySource: {
    textAlign: 'center',
    // color: '#fdcb6e',
    // backgroundColor: '#636e72',
    // marginVertical: 'auto',
  },
  cardContentText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
    // justifyContent: 'space-between',
  },
});

export default ProjectEditorScreen;
