import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  View,
  FlatList,
  Modal,
} from 'react-native';
import {Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import books from '../assets/versification.json';

interface Props {
  onSelectionChange: (book: string, chapter: number, verse: number) => void;
  currentScope: {[key: string]: any};

}
const BookChapterVerseSelector: React.FC<Props> = ({onSelectionChange,currentScope}) => {
  const [selectedTestament, setSelectedTestament] = useState<string | null>(
    'Old Testament',
  );
  const [expandedBook, setExpandedBook] = useState<string | null>('');
  const [expandedChapter, setExpandedChapter] = useState<number | null>(1);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(1);
  const [isPortrait, setIsPortrait] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [book, setBook] = useState<string>('');
  const [chapter, setChapter] = useState<number>(1);
  const [verse, setVerse] = useState<number>(1);
  // const test = {
  //   currentScope: {EST: [], EXO: [], LUK: [], MRK: [], PSA: [], ACT: []},
  // };

  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  useEffect(() => {
    const updateOrientation = () => {
      const {width, height} = Dimensions.get('window');
      setIsPortrait(height >= width);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateOrientation,
    );
    updateOrientation(); // Check orientation on initial load

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);
   useEffect(() => {
    if (currentScope && Object.keys(currentScope).length > 0) {
      const scopeBooks = Object.keys(currentScope);
      const oldTestamentBooks = Object.keys(books.maxVerses).slice(0, 39).filter(book => scopeBooks.includes(book));
      const newTestamentBooks = Object.keys(books.maxVerses).slice(39, 66).filter(book => scopeBooks.includes(book));

      const combinedBooks = [...oldTestamentBooks, ...newTestamentBooks];
      setAvailableBooks(combinedBooks);
      
      if (combinedBooks.length > 0) {
        setExpandedBook(combinedBooks[0]);
        setBook(combinedBooks[0]);
        setExpandedChapter(1);
        setChapter(1);
        setSelectedVerse(1);
        setVerse(1);
      }
    }
  }, [currentScope]);


  useEffect(() => {
    if (book && chapter && verse) {
      onSelectionChange(book, chapter, verse);
    }
  }, [book, chapter, verse]);

  const toggleTestament = (testament: string) => {
    if (selectedTestament === testament) {
      setSelectedTestament(null); // Collapse when same testament is clicked
    } else {
      setSelectedTestament(testament);
      setExpandedBook(null); // Collapse any expanded book when switching testaments
      setExpandedChapter(null); // Collapse any expanded chapter when switching testaments
      setSelectedVerse(null); // Clear selected verse
    }
  };

  const toggleBook = (book1: string) => {
    if (expandedBook === book1) {
      setExpandedBook(null);
      setExpandedChapter(null); // Collapse chapter when book is collapsed
      setSelectedVerse(null); // Clear selected verse
    } else {
      setExpandedBook(book1);
      setBook(book1);
      setExpandedChapter(1); // Collapse chapter when new book is expanded
      setChapter(1);
      setSelectedVerse(1); // Clear selected verse
      setVerse(1);
    }
  };
  const toggleChapter = (chapter1: number) => {
    if (expandedChapter === chapter1) {
      setExpandedChapter(null);
      setSelectedVerse(null); // Clear selected verse
    } else {
      setExpandedChapter(chapter1);
      setChapter(chapter1);
      setSelectedVerse(1);
      setVerse(1);
    }
  };

  const renderVerses = (chapters: string[]) => {
    const maxVerses = parseInt(
      chapters[(expandedChapter as number) - 1] || '0',
      10,
    );
    return (
      <View style={styles.versesWrapper}>
        <Text style={styles.heading}>Select Verse</Text>
        <FlatList
          data={Array.from({length: maxVerses}, (_, i) => i + 1)}
          renderItem={({item}) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setSelectedVerse(item);
                setVerse(item);
              }}
              style={[
                styles.gridItem,
                selectedVerse === item && {backgroundColor: '#45aaf2'}, // Highlight selected verse
              ]}>
              <Text style={styles.gridItemText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.toString()}
          numColumns={4} // Display items in a grid with 4 columns
          contentContainerStyle={styles.versesContentContainer}
        />
      </View>
    );
  };

  const renderChapters = (chapters: string[]) => {
    const chapterList = Array.from({length: chapters.length}, (_, i) => i + 1);
    const rows = chapterList.reduce(
      (resultArray: number[][], item: number, index: number) => {
        const chunkIndex = Math.floor(index / 4);
        if (!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = [];
        }
        resultArray[chunkIndex].push(item);
        return resultArray;
      },
      [],
    );

    return (
      <View>
        <View style={styles.chapterWrapper}>
          <Text style={styles.heading}>Select Chapter</Text>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex}>
              <FlatList
                data={row}
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={() => toggleChapter(item)}
                    style={[
                      styles.gridItem,
                      expandedChapter === item && {backgroundColor: '#2d98da'}, // Highlight selected chapter
                    ]}>
                    <Text style={styles.gridItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.toString()}
                numColumns={4} // Display items in a grid with 4 columns
                contentContainerStyle={styles.chaptersContentContainer}
              />
              {/* Render verses only if this row's chapter is expanded */}
              {expandedChapter !== null &&
                expandedChapter >= row[0] &&
                expandedChapter <= row[row.length - 1] &&
                renderVerses(books.maxVerses[expandedBook as string])}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBooks = () => {
    // Use availableBooks instead of filtering again
    const oldTestamentBooks = availableBooks.filter(book => Object.keys(books.maxVerses).indexOf(book) < 39);
    const newTestamentBooks = availableBooks.filter(book => Object.keys(books.maxVerses).indexOf(book) >= 39);

    const booksToRender =
      selectedTestament === 'Old Testament'
        ? oldTestamentBooks
        : newTestamentBooks;

    return (
      <FlatList
        data={booksToRender}
        renderItem={({item}) => (
          <View key={item}>
            <TouchableOpacity
              onPress={() => toggleBook(item)}
              style={[
                styles.bookButton,
                expandedBook === item && {backgroundColor: '#f0f0f0'},
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
      />
    );
  };
  
  const navigatePrev = () => {
    const currentIndex = availableBooks.indexOf(expandedBook);
    if (currentIndex === -1) return; // If the current book is not found in the availableBooks

    const currentBook = expandedBook;
    const currentChapter = expandedChapter;
    const currentVerse = selectedVerse;

    if (currentVerse > 1) {
      setSelectedVerse(currentVerse - 1);
      setVerse(currentVerse - 1);
    } else if (currentChapter > 1) {
      setExpandedChapter(currentChapter - 1);
      setChapter(currentChapter - 1);
      setSelectedVerse(
        parseInt(books.maxVerses[currentBook][currentChapter - 2], 10),
      );
      setVerse(parseInt(books.maxVerses[currentBook][currentChapter - 2], 10));
    } else if (currentIndex > 0) {
      const prevBook = availableBooks[currentIndex - 1];
      const prevChapter = books.maxVerses[prevBook].length;
      const prevVerse = parseInt(
        books.maxVerses[prevBook][prevChapter - 1],
        10,
      );

      setExpandedBook(prevBook);
      setBook(prevBook);
      setExpandedChapter(prevChapter);
      setChapter(prevChapter);
      setSelectedVerse(prevVerse);
      setVerse(prevVerse);
    }
  };
  const navigateNext = () => {
    const currentIndex = availableBooks.indexOf(expandedBook);
    if (currentIndex === -1) return; // If the current book is not found in the availableBooks

    const currentBook = expandedBook;
    const currentChapter = expandedChapter;
    const currentVerse = selectedVerse;
    const maxVerses = parseInt(
      books.maxVerses[currentBook][currentChapter - 1] || '0',
      10,
    );

    if (currentVerse < maxVerses) {
      setSelectedVerse(currentVerse + 1);
      setVerse(currentVerse + 1);
    } else if (currentChapter < books.maxVerses[currentBook].length) {
      setExpandedChapter(currentChapter + 1);
      setChapter(currentChapter + 1);
      setSelectedVerse(1);
      setVerse(1);
    } else if (currentIndex < availableBooks.length - 1) {
      const nextBook = availableBooks[currentIndex + 1];
      setExpandedBook(nextBook);
      setBook(nextBook);
      setExpandedChapter(1);
      setChapter(1);
      setSelectedVerse(1);
      setVerse(1);
    }
  };

  return (
    <>
      <View
        style={
          isPortrait
            ? styles.dropdownContainer
            : styles.dropdownContainerLandscape
        }>
        <TouchableOpacity
          style={[
            styles.navigateButton,
            expandedBook === availableBooks[0] &&
            expandedChapter === 1 &&
              selectedVerse === 1 &&
              styles.disabledButton,
          ]}
          onPress={navigatePrev}
          disabled={
            expandedBook === availableBooks[0] &&
            expandedChapter === 1 &&
            selectedVerse === 1
          }>
          {!(
            expandedBook === availableBooks[0] &&
            expandedChapter === 1 &&
            selectedVerse === 1
          ) ? (
            <Icon name="chevron-left" size={24} color="#F8EFBA" />
          ) : (
            <Icon name="chevron-left" size={24} color="#F8EFBA" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={isPortrait ? styles.dropdown : styles.dropdownLandscape}
          onPress={() => setDropdownVisible(true)}>
            <View style={{flexDirection:'row',justifyContent:'space-evenly',width:'55%'}}>
          <Text style={styles.dropdownText}>
            {book}
          </Text> 
          <Text style={styles.dropdownText}>
             {chapter} :  {verse}
          </Text> 
          </View>
          <Icon
            name="arrow-drop-down"
            style={styles.dropdownIcon}
            size={28}
            color="black"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={navigateNext}
          disabled={
            expandedBook === availableBooks[availableBooks.length - 1] &&
            expandedChapter ===
              books.maxVerses[availableBooks[availableBooks.length - 1]]
                .length &&
            selectedVerse ===
              parseInt(
                books.maxVerses[availableBooks[availableBooks.length - 1]][
                  books.maxVerses[availableBooks[availableBooks.length - 1]]
                    .length - 1
                ],
                10,
              )
          }>
          {!(
            expandedBook === availableBooks[availableBooks.length - 1] &&
            expandedChapter ===
              books.maxVerses[availableBooks[availableBooks.length - 1]]
                .length &&
            selectedVerse ===
              parseInt(
                books.maxVerses[availableBooks[availableBooks.length - 1]][
                  books.maxVerses[availableBooks[availableBooks.length - 1]]
                    .length - 1
                ],
                10,
              )
          ) ? (
            <Icon name="chevron-right" size={24} color="#F8EFBA" />
          ) : (
            <Icon name="chevron-right" size={24} color="#a5b1c2" />
          )}
        </TouchableOpacity>
      </View>
      <Modal
        visible={dropdownVisible}
        onRequestClose={() => setDropdownVisible(false)}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.testamentsContainer}>
            <TouchableOpacity
              style={[
                styles.testamentButton,
                selectedTestament === 'Old Testament' &&
                  styles.selectedTestament,
              ]}
              onPress={() => toggleTestament('Old Testament')}>
              <Text style={styles.testamentText}>Old Testament</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testamentButton,
                selectedTestament === 'New Testament' &&
                  styles.selectedTestament,
              ]}
              onPress={() => toggleTestament('New Testament')}>
              <Text style={styles.testamentText}>New Testament</Text>
            </TouchableOpacity>
          </View>
          {selectedTestament && renderBooks()}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setDropdownVisible(false)}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default BookChapterVerseSelector;

const styles = StyleSheet.create({
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor:'#fff'
  },
  dropdownContainerLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor:'#fff'

    // height:
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
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
    borderRadius: 8,
  },
  disabledButton: {
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
    width: 50,
  },
  gridItemText: {
    fontSize: 14,
    color: '#d1d8e0',
  },
  chapterWrapper: {
    padding: 10,
    left: 6,
    width: '80%',
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  versesWrapper: {
    padding: 15,
    left: 6,
    width: '85%',
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
});
