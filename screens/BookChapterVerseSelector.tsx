import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  View,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import books from '../assets/versification.json';
import Loader from './Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  onSelectionChange: (book: string, chapter: number, verse: number) => void;
  currentScope: { [key: string]: any };
  audioScope: { [key: string]: string[] };
  projectName: string;
}
const BookChapterVerseSelector: React.FC<Props> = ({ onSelectionChange, currentScope, audioScope, projectName }) => {
  const [selectedTestament, setSelectedTestament] = useState<string>('Old Testament');
  const [expandedBook, setExpandedBook] = useState<string>('');
  const [expandedChapter, setExpandedChapter] = useState<number>();
  const [selectedVerse, setSelectedVerse] = useState<number>();
  const [isPortrait, setIsPortrait] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>();
  const [verse, setVerse] = useState<number>();
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Add new state for temporary selections
  const [tempBook, setTempBook] = useState<string>('');
  const [tempChapter, setTempChapter] = useState<number | null>(null);
  const [tempVerse, setTempVerse] = useState<number | null>(null);


  // Add new state to track if verse is manually selected
  const [isVerseManuallySelected, setIsVerseManuallySelected] = useState<boolean>(false);

  // Keep track of last confirmed selection
  const [lastSelection, setLastSelection] = useState<{
    book: string;
    chapter: number;
    verse: number;
  }>(null);

  // Add state to track pending selection
  const [pendingSelection, setPendingSelection] = useState<{
    book: string;
    chapter: number;
    verse: number;
  }>(null);

  const saveBCVSelection = async (book: string, chapter: number, verse: number) => {
    try {
      const bcvSelection = JSON.stringify([book, chapter, verse]);
      await AsyncStorage.setItem(`bcv_selection_${projectName}`, bcvSelection);
    } catch (error) {
      console.error('Error saving BCVselection:', error);
    }
  };

  // Function to load BCVselection from AsyncStorage
  const loadBCVSelection = async (availableBooks: string[]) => {
    try {
      const savedSelection = await AsyncStorage.getItem(`bcv_selection_${projectName}`);
      if (savedSelection) {
        const [savedBook, savedChapter, savedVerse] = JSON.parse(savedSelection);

        // Verify if the saved book is still in available books
        if (availableBooks.includes(savedBook)) {
          const maxChapters = books.maxVerses[savedBook].length;
          if (savedChapter <= maxChapters) {
            const maxVerses = parseInt(books.maxVerses[savedBook][savedChapter - 1], 10);
            if (savedVerse <= maxVerses) {
              return {
                book: savedBook,
                chapter: savedChapter,
                verse: savedVerse,
                found: true
              };
            }
          }
        }
      }
      return { found: false };
    } catch (error) {
      console.error('Error loading BCVselection:', error);
      return { found: false };
    }
  };

  // New helper functions for audio verification
  const hasAudioForVerse = useCallback((bookCode: string, chapter: number, verse: number) => {
    if (!audioScope[bookCode]) return false;
    return audioScope[bookCode].includes(`${chapter}:${verse}`);
  }, [audioScope]);

  const hasAudioForEntireChapter = useCallback((bookCode: string, chapter: number) => {
    if (!audioScope[bookCode]) return false;
    const maxVersesInChapter = parseInt(books.maxVerses[bookCode][chapter - 1], 10);
    const versesWithAudio = audioScope[bookCode]
      .filter(ref => ref.startsWith(`${chapter}:`))
      .length;
    return versesWithAudio === maxVersesInChapter;
  }, [audioScope]);


  // Memoize the filtered testament books
  const { oldTestamentBooks, newTestamentBooks } = useMemo(() => {
    const old = availableBooks.filter(book => Object.keys(books.maxVerses).indexOf(book) < 39);
    const new_ = availableBooks.filter(book => Object.keys(books.maxVerses).indexOf(book) >= 39);
    return { oldTestamentBooks: old, newTestamentBooks: new_ };
  }, [availableBooks]);

  // Handle orientation changes
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsPortrait(height >= width);
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    updateOrientation();

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);



  // Modified initialize effect to check AsyncStorage first
  useEffect(() => {
    if (currentScope && Object.keys(currentScope).length > 0) {
      setIsLoading(true);

      const scopeBooks = Object.keys(currentScope);
      const oldTestamentBooks = Object.keys(books.maxVerses)
        .slice(0, 39)
        .filter(book => scopeBooks.includes(book));
      const newTestamentBooks = Object.keys(books.maxVerses)
        .slice(39, 66)
        .filter(book => scopeBooks.includes(book));

      const combinedBooks = [...oldTestamentBooks, ...newTestamentBooks];
      setAvailableBooks(combinedBooks);

      // Load saved selection or use default
      const initializeSelection = async () => {
        const savedSelection = await loadBCVSelection(combinedBooks);
        console.log(savedSelection.book,
          'chapter', savedSelection.chapter,
          'verse', savedSelection.verse)
        let initialSelection;
        if (savedSelection.found) {
          initialSelection = {
            book: savedSelection.book,
            chapter: savedSelection.chapter,
            verse: savedSelection.verse
          };
        } else {
          initialSelection = {
            book: combinedBooks[0],
            chapter: 1,
            verse: 1
          };
          // Save initial selection to AsyncStorage
          // await saveBCVSelection(initialSelection.book, initialSelection.chapter, initialSelection.verse);
        }

        // Set all the state values
        setLastSelection(initialSelection);
        setBook(initialSelection.book);
        setChapter(initialSelection.chapter);
        setVerse(initialSelection.verse);
        setExpandedBook(initialSelection.book);

        setExpandedChapter(initialSelection.chapter);
        setSelectedVerse(initialSelection.verse);
        setTempBook(initialSelection.book);
        setTempChapter(initialSelection.chapter);
        setTempVerse(initialSelection.verse);

        onSelectionChange(initialSelection.book, initialSelection.chapter, initialSelection.verse);
        setIsLoading(false);
      };

      initializeSelection();
    }
  }, [currentScope, onSelectionChange, projectName]);

  // Modified navigation functions to update all necessary state
  const navigatePrev = useCallback(() => {
    const currentIndex = availableBooks.indexOf(expandedBook);
    if (currentIndex === -1) return;

    let newBook = expandedBook;
    let newChapter = expandedChapter;
    let newVerse = selectedVerse;

    if (selectedVerse > 1) {
      newVerse = selectedVerse - 1;
    } else if (expandedChapter > 1) {
      newChapter = expandedChapter - 1;
      newVerse = parseInt(books.maxVerses[expandedBook][newChapter - 1], 10);
    } else if (currentIndex > 0) {
      newBook = availableBooks[currentIndex - 1];
      newChapter = books.maxVerses[newBook].length;
      newVerse = parseInt(books.maxVerses[newBook][newChapter - 1], 10);
    }

    // Update all state and notify parent
    setExpandedBook(newBook);
    setBook(newBook);
    setExpandedChapter(newChapter);
    setChapter(newChapter);
    setSelectedVerse(newVerse);
    setVerse(newVerse);

    const newSelection = {
      book: newBook,
      chapter: newChapter,
      verse: newVerse
    };

    setLastSelection(newSelection);
    setPendingSelection(newSelection);
    onSelectionChange(newBook, newChapter, newVerse);
    saveBCVSelection(newBook, newChapter, newVerse);
  }, [expandedBook, expandedChapter, selectedVerse, availableBooks, onSelectionChange]);

  const navigateNext = useCallback(() => {

    const currentIndex = availableBooks.indexOf(expandedBook);
    if (currentIndex === -1) return;

    const maxVerses = parseInt(books.maxVerses[expandedBook][expandedChapter - 1] || '0', 10);

    let newBook = expandedBook;
    let newChapter = expandedChapter;
    let newVerse = selectedVerse;

    if (selectedVerse < maxVerses) {
      newVerse = selectedVerse + 1;
    } else if (expandedChapter < books.maxVerses[expandedBook].length) {
      newChapter = expandedChapter + 1;
      newVerse = 1;
    } else if (currentIndex < availableBooks.length - 1) {
      newBook = availableBooks[currentIndex + 1];
      newChapter = 1;
      newVerse = 1;
    }

    // Update all state and notify parent
    setExpandedBook(newBook);
    setBook(newBook);
    setExpandedChapter(newChapter);
    setChapter(newChapter);
    setSelectedVerse(newVerse);
    setVerse(newVerse);

    const newSelection = {
      book: newBook,
      chapter: newChapter,
      verse: newVerse
    };

    setLastSelection(newSelection);
    setPendingSelection(newSelection);
    onSelectionChange(newBook, newChapter, newVerse);
    saveBCVSelection(newBook, newChapter, newVerse);
  }, [expandedBook, expandedChapter, selectedVerse, availableBooks, onSelectionChange]);


  // Instead, only notify when we have a complete selection and modal is closed
  useEffect(() => {
    if (pendingSelection?.book &&
      pendingSelection?.chapter &&
      pendingSelection?.verse &&
      !dropdownVisible) {
      const { book, chapter, verse } = pendingSelection;
      onSelectionChange(book, chapter, verse);
    }
  }, [pendingSelection, dropdownVisible, onSelectionChange]);

  // Memoized callbacks for better performance

  const toggleTestament = useCallback((testament: string) => {
    if (selectedTestament !== testament) {
      setIsLoading(true);
      setSelectedTestament(testament);
      setTimeout(() => setIsLoading(false), 800); // Add a slight delay for a better UX
    }
  }, [selectedTestament]);

  const getTestament = (book: string) => {
    if (oldTestamentBooks.includes(book)) {

      return 'Old Testament';
    } else {

      return 'New Testament';
    }

  };

  // Add effect to handle modal opening
  useEffect(() => {
    if (dropdownVisible && lastSelection) {
      // When modal opens, set expanded states to current selection
      setExpandedBook(lastSelection.book);
      setExpandedChapter(lastSelection.chapter);
      setSelectedVerse(lastSelection.verse);
      // Set temporary states to current selection
      setTempBook(lastSelection.book);
      setTempChapter(lastSelection.chapter);
      setTempVerse(lastSelection.verse);
    }
  }, [dropdownVisible, lastSelection]);

  // Modified toggleBook to maintain chapter and verse visibility
  const toggleBook = useCallback((selectedBook: string) => {
    setIsLoading(true);
    if (expandedBook === selectedBook) {
      // If clicking the same book, maintain current chapter and verse
      setTempBook(selectedBook);
    } else {
      // If selecting a new book, reset chapter and verse
      setExpandedBook(selectedBook);
      setTempBook(selectedBook);
      setTempChapter(null);
      setTempVerse(null);
      setExpandedChapter(null);
      setSelectedVerse(null);
    }
    setIsLoading(false);
  }, [expandedBook]);

  // Modified toggleChapter to maintain verse visibility
  const toggleChapter = useCallback((chapterNum: number) => {
    if (expandedChapter === chapterNum) {
      // If clicking the same chapter, just toggle expansion
      setExpandedChapter(null);
    } else {
      // If selecting a new chapter, show it and its verses
      setExpandedChapter(chapterNum);
      setTempChapter(chapterNum);
      // Only reset verse if it's a different chapter
      if (tempChapter !== chapterNum) {
        setTempVerse(null);
        setSelectedVerse(null);
      }
    }
  }, [expandedChapter, tempChapter]);



  // Modify handleVerseSelection to save to AsyncStorage
  const handleVerseSelection = useCallback((verseNum: number) => {
    if (!tempBook || !tempChapter) return;

    const newSelection = {
      book: tempBook,
      chapter: tempChapter,
      verse: verseNum
    };

    // Update all selection states
    setLastSelection(newSelection);
    setPendingSelection(newSelection);
    setBook(tempBook);
    setChapter(tempChapter);
    setVerse(verseNum);
    setSelectedVerse(verseNum);

    // Save to AsyncStorage
    saveBCVSelection(tempBook, tempChapter, verseNum);

    // Close modal and notify parent
    setDropdownVisible(false);
    onSelectionChange(tempBook, tempChapter, verseNum);
  }, [tempBook, tempChapter, onSelectionChange]);

  // Modify modal close handling
  const handleModalClose = useCallback(() => {
    if (!isVerseManuallySelected && lastSelection) {
      // Revert to last confirmed selection
      const { book: lastBook, chapter: lastChapter, verse: lastVerse } = lastSelection;
      setExpandedBook(lastBook);
      setBook(lastBook);
      setExpandedChapter(lastChapter);
      setChapter(lastChapter);
      setSelectedVerse(lastVerse);
      setVerse(lastVerse);

      // Reset pending selection to last confirmed selection
      setPendingSelection(lastSelection);
    }
    setDropdownVisible(false);
  }, [isVerseManuallySelected, lastSelection]);


  // Modified renderVerses to show correct verse selection
  const renderVerses = useCallback((chapters: string[]) => {
    const maxVerses = parseInt(chapters[expandedChapter - 1] || '0', 10);
    const versesData = Array.from({ length: maxVerses }, (_, i) => i + 1);

    return (
      <View style={styles.versesWrapper}>
        <Text style={styles.heading}>Select Verse</Text>
        <FlatList
          data={versesData}
          renderItem={({ item }) => {
            const hasAudio = hasAudioForVerse(expandedBook, expandedChapter, item);
            const isSelected = expandedBook === book &&
              expandedChapter === chapter &&
              item === verse;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => handleVerseSelection(item)}
                style={[
                  styles.gridItem,
                  isSelected && { backgroundColor: '#45aaf2', borderWidth: 3, borderColor: '#227093' },
                  hasAudio && styles.audioAvailableVerse,
                  isSelected && hasAudio && styles.selectedAudioVerse,
                ]}>
                <Text style={styles.gridItemText}>{item}</Text>
                {hasAudio && <Icon name="volume-up" size={20} />}
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.toString()}
          numColumns={4}
          contentContainerStyle={styles.versesContentContainer}
        />
      </View>
    );
  }, [expandedBook, expandedChapter, book, chapter, verse, hasAudioForVerse, handleVerseSelection]);


  const renderChapters = useCallback((chapters: string[]) => {
    const chapterList = Array.from({ length: chapters.length }, (_, i) => i + 1);
    const rows = chapterList.reduce((resultArray: number[][], item: number, index: number) => {
      const chunkIndex = Math.floor(index / 4);
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [];
      }
      resultArray[chunkIndex].push(item);
      return resultArray;
    }, []);

    return (
      <View>
        <View style={styles.chapterWrapper}>
          <Text style={styles.heading}>Select Chapter</Text>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex}>
              <FlatList
                data={row}
                renderItem={({ item }) => {
                  const hasFullChapterAudio = hasAudioForEntireChapter(expandedBook, item);
                  const isSelected = expandedBook === book && item === chapter;
                  const isTempSelected = tempBook === expandedBook && item === tempChapter;

                  return (
                    <TouchableOpacity
                      onPress={() => toggleChapter(item)}
                      style={[
                        styles.gridItem,
                        isSelected && { backgroundColor: '#2d98da', borderWidth: 3, borderColor: '#227093' },
                        // Temporary selection style
                        !isSelected && isTempSelected && {
                          backgroundColor: '#74b9ff',  // Lighter blue for temp selection
                          borderWidth: 2,
                          borderColor: '#0984e3'
                        },
                        hasFullChapterAudio && styles.audioAvailableChapter,
                        isSelected && hasFullChapterAudio && styles.selectedAudioChapter,

                      ]}>
                      <Text style={styles.gridItemText}>{item}</Text>
                      {hasFullChapterAudio && <Icon name="volume-up" size={20} />}
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={item => item.toString()}
                numColumns={4}
                contentContainerStyle={styles.chaptersContentContainer}
              />
              {expandedChapter && row.includes(expandedChapter) && renderVerses(chapters)}
            </View>
          ))}
        </View>
      </View>
    );
  }, [expandedBook, expandedChapter, book, chapter, toggleChapter, hasAudioForEntireChapter, renderVerses]);

  return (
    <>

      <View style={isPortrait ? styles.dropdownContainer : styles.dropdownContainerLandscape}>
        <TouchableOpacity
          style={[
            styles.navigateButton,
            expandedBook === availableBooks[0] &&
            expandedChapter === 1 &&
            selectedVerse === 1

          ]}
          onPress={navigatePrev}
          disabled={
            expandedBook === availableBooks[0] &&
            expandedChapter === 1 &&
            selectedVerse === 1
          }>
          <Icon
            name="chevron-left"
            size={24}
            color={expandedBook === availableBooks[0] &&
              expandedChapter === 1 &&
              selectedVerse === 1 ? "#8395a7" : "#ECDFCC"}
          />
        </TouchableOpacity>

        {console.log("project name inside bcv modal", projectName)}

        <TouchableOpacity
          style={isPortrait ? styles.dropdown : styles.dropdownLandscape}
          onPress={() => {
            const testament = getTestament(book); // Determine the testament
            setSelectedTestament(testament); // Set the selected testament
            setDropdownVisible(true); // Show the dropdown
          }}>
          <View style={{ flexDirection: 'row', }}>
            <Text style={styles.dropdownText}>{book}</Text>
            <Text style={styles.dropdownText}>{chapter} : {verse}</Text>
          </View>
          <Icon
            name="arrow-drop-down"
            style={styles.dropdownIcon}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={navigateNext}
          disabled={
            expandedBook === availableBooks[availableBooks.length - 1] &&
            expandedChapter === books.maxVerses[availableBooks[availableBooks.length - 1]].length &&
            selectedVerse === parseInt(
              books.maxVerses[availableBooks[availableBooks.length - 1]][
              books.maxVerses[availableBooks[availableBooks.length - 1]].length - 1
              ],
              10,
            )
          }>
          <Icon
            name="chevron-right"
            size={24}
            color={expandedBook === availableBooks[availableBooks.length - 1] &&
              expandedChapter === books.maxVerses[availableBooks[availableBooks.length - 1]].length &&
              selectedVerse === parseInt(
                books.maxVerses[availableBooks[availableBooks.length - 1]][
                books.maxVerses[availableBooks[availableBooks.length - 1]].length - 1
                ],
                10,
              ) ? "#181C14" : "#ECDFCC"}

          />
        </TouchableOpacity>
      </View>


      <Modal
        visible={dropdownVisible}
        onRequestClose={handleModalClose}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.testamentsContainer}>
            <TouchableOpacity
              style={[
                styles.testamentButton,
                selectedTestament === 'Old Testament' && styles.selectedTestament,
              ]}
              onPress={() => toggleTestament('Old Testament')}>
              <Text style={styles.testamentText}>Old Testament</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testamentButton,
                selectedTestament === 'New Testament' && styles.selectedTestament,
              ]}
              onPress={() => toggleTestament('New Testament')}>
              <Text style={styles.testamentText}>New Testament</Text>
            </TouchableOpacity>
          </View>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Loader visible={true} />
              {/* <Text>Loading...</Text> */}
            </View>
          )}
          <FlatList
            data={selectedTestament === 'Old Testament' ? oldTestamentBooks : newTestamentBooks}
            renderItem={({ item }) => (
              <View key={item}>
                <TouchableOpacity
                  onPress={() => toggleBook(item)}
                  style={[
                    styles.bookButton,
                    expandedBook === item && { backgroundColor: '#f0f0f0' },
                  ]}>
                  <Text style={styles.bookText}>{item}</Text>
                  <Icon
                    name={expandedBook === item ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedBook === item && renderChapters(books.maxVerses[item])}
              </View>
            )}
            keyExtractor={item => item}
            contentContainerStyle={styles.booksContainer}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
          />


          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={handleModalClose}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({

  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between
    padding: 5,
    // marginTop:3,
    // borderTopWidth: 1,
    //     borderTopColor: '#ddd',
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
    backgroundColor: '#fff'
    // backgroundColor:'#0F0F0F'
  },
  dropdownContainerLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between
    padding: 5,
    // marginTop:3,

    // borderTopWidth: 1,
    // borderTopColor: '#ddd',
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
    backgroundColor: '#fff'

    // height:
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    // backgroundColor: '#697565',
    backgroundColor: '#2d98da',

    borderRadius: 10,
    justifyContent: 'center', // Center the dropdown content
    width: '50%',
    // borderWidth: 1,
    // borderColor: '#1e3799',
  },
  dropdownLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    // backgroundColor: '#697565',//   
    backgroundColor: '#2d98da',

    borderRadius: 10,
    justifyContent: 'space-evenly', // Center the dropdown content
    width: '50%',
    height: 40,
  },
  dropdownText: {
    // width: '50%',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 5,
    // color: '#ECDFCC',
    color: '#fff',
    // textAlign: 'center',
    // borderWidth: 1,
  },
  dropdownIcon: {
    // width: 30,
    // borderWidth: 1,
    alignItems: 'center',
    color: '#fff',
  },
  navigateButton: {
    padding: 10,
    // borderWidth: 1,
    backgroundColor: '#2C3A47',
    // backgroundColor: '#3C3D37',

    borderRadius: 8,
  },
  disabledButton: {
    // backgroundColor: '#181C14',
    backgroundColor: '#8395a7',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  testamentsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  testamentButton: {
    padding: 10,
    backgroundColor: '#4b6584',
    // backgroundColor: '#a5b1c2',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedTestament: {
    backgroundColor: '#a5b1c2',
  },
  testamentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dfe6e9',
  },
  bookButton: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookText: {
    fontSize: 16,
    color: 'black',
  },
  chaptersContentContainer: {
    padding: 10,
  },
  versesContentContainer: {
    paddingHorizontal: 10,
  },
  gridItem: {
    padding: 10,
    margin: 2,
    backgroundColor: '#4b6584',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 50,
    borderWidth: 3,
    borderColor: '#4b6584'
  },
  gridItemText: {
    fontSize: 14,
    color: '#fff',
  },
  chapterWrapper: {
    padding: 10,
    left: 6,
    width: '88%',
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  versesWrapper: {
    padding: 15,
    left: 6,
    width: '98%',
    borderWidth: 1,
    borderColor: '#b2bec3',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  selectedReferenceWrapper: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    color: 'black',
  },
  selectedReferenceText: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 15,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },

  loadingText: {
    color: '#ddd',
    marginTop: 100,
    fontSize: 16,
  },
  audioAvailableVerse: {
    // backgroundColor: '#2ecc71', // Green color for verses with audio
    // borderWidth:3,
    // borderColor:'#2ecc71'
  },
  selectedAudioVerse: {
    // backgroundColor: '#2ecc71', // Darker green for selected verses with audio
    // borderWidth:3,
    // borderColor:'#227093'
  },
  audioAvailableChapter: {
    backgroundColor: '#2ecc71', // Green color for chapters with complete audio
    borderWidth: 3,
    borderColor: '#2ecc71'
  },
  selectedAudioChapter: {
    backgroundColor: '#2ecc71', // Darker green for selected chapters with audio
    borderWidth: 3,
    borderColor: '#227093'
  },
});
export default BookChapterVerseSelector;
