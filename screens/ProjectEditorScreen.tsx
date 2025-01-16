//ProjectEditorScreen.tsx
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
import AudioPlayer, { AudioPlayerRef } from './AudioPlayer';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App'; // Adjust the import based on your project structure
import Loader from './Loader';

const grammar = require('usfm-grammar');


// Define types for references, metadata, projects, and app info structure
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
  // projectPath:string;
  // add other properties if needed
}

interface AppInfo {
  projects: ProjectType[];
  // add other properties if needed
}

// Navigation and route props for the ProjectEditorScreen
type ProjectEditorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProjectEditor'>;
type ProjectEditorScreenRouteProp = RouteProp<RootStackParamList, 'ProjectEditor'>;

type Props = {
  navigation: ProjectEditorScreenNavigationProp;
  route: ProjectEditorScreenRouteProp;
};


const ProjectEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isPortrait, setIsPortrait] = useState(true);
  // const baseFolderPath = '/storage/emulated/0/Download/OBTRecorderApp';
  const baseFolderPath = RNFS.DocumentDirectoryPath;

  const jsonFilePath = `${baseFolderPath}/appInfo.json`;
  const [referenceType, setReferenceType] = useState<ReferenceType[]>([]);
  const [selectedRef, setSelectedRef] = useState<ReferenceType | null>(null);
  const { projectId, projectName, projectPath, referenceResource } = route.params;
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>();
  const [selectedVerse, setSelectedVerse] = useState<number>();
  const [verseText, setVerseText] = useState<string>('');
  const [targetVerseText, setTargetVerseText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingRef, setIsLoadingRef] = useState<boolean>(false);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [currentScope, setCurrentScope] = useState<{ [key: string]: any }>({});
  const [audioScopes, setAudioScopes] = useState<{ [key: string]: string[] }>({});

  // const [audioUrl, setAudioUrl] = useState(null);  
  // const [metadata, setMetadata] = useState(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [projectAudioUrl, setProjectAudioUrl] = useState<string | null>(null);
  const [referenceMetadata, setReferenceMetadata] = useState<MetadataType | null>(null);
  const [projectMetadata, setProjectMetadata] = useState<MetadataType | null>(null);
  const [refreshMetadata, setRefreshMetadata] = useState(true);

  const [cachedData, setCachedData] = useState<any>({});
  const [cachedTargetData, setCachedTargetData] = useState<any>({});
  // console.log(projectPath,"Project pathname")

  //font size 

  const [resFontSize, setResFontSize] = useState(16); // State for font size

  // Increase the source text size
  const increaseFontSize = () => {
    setResFontSize(prevSize => (prevSize < 20 ? prevSize + 1 : prevSize));
  };

  // Decrease the source text size
  const decreaseFontSize = () => {
    setResFontSize(prevSize => (prevSize > 14 ? prevSize - 1 : prevSize));
  };


  const [targetFontSize, setTargetFontSize] = useState(16); // State for font size

  //Increase the target text size
  const increaseTarFontSize = () => {
    setTargetFontSize(prevSize => (prevSize < 20 ? prevSize + 1 : prevSize));
  };

  //Decrease the target text size
  const decreaseTarFontSize = () => {
    setTargetFontSize(prevSize => (prevSize > 14 ? prevSize - 1 : prevSize));
  };


  // Load metadata for the selected reference
  useEffect(() => {
    const loadReferenceMetadata = async () => {
      if (selectedRef) {
        const metadataPath = `${selectedRef.path}/metadata.json`;
        const fileExists = await RNFS.exists(metadataPath);
        if (fileExists) {
          try {
            const content = await RNFS.readFile(metadataPath, 'utf8');
            const parsedMetadata = JSON.parse(content);
            setReferenceMetadata(parsedMetadata);
          } catch (error) {
            console.error('Error reading reference metadata:', error);
            setReferenceMetadata(null);
          }
        } else {
          setReferenceMetadata(null);
        }
      }
    };

    loadReferenceMetadata();
  }, [selectedRef]);


  // Update metadata refresh state
  const updateMetadata = (booleanData: boolean) => {
    setRefreshMetadata(!booleanData);
  };


  // Function to extract audio scopes from metadata
  const getAudioScopes = useCallback((metadata: any) => {
    const scopes: { [key: string]: string[] } = {};

    if (metadata?.ingredients) {
      for (const [path, info] of Object.entries(metadata.ingredients)) {
        if (info.mimeType === 'audio/wav') {
          if (info.scope) {
            for (const [book, verses] of Object.entries(info.scope)) {
              if (!scopes[book]) {
                scopes[book] = [];
              }
              // Ensure no duplicate verses are added
              verses.forEach((verse: string) => {
                if (!scopes[book].includes(verse)) {
                  scopes[book].push(verse);
                }
              });
            }
          }
        }
      }
    }

    return scopes;
  }, []);


  // Load metadata for the project
  const loadProjectMetadata = useCallback(async () => {
    const metadataPath = `${projectPath}/metadata.json`;
    try {
      const content = await RNFS.readFile(metadataPath, 'utf8');
      const parsedMetadata = JSON.parse(content);
      setProjectMetadata(parsedMetadata);
      const scopes = getAudioScopes(parsedMetadata);
      setAudioScopes(scopes);
    } catch (error) {
      console.error('Error reading project metadata:', error);
      setProjectMetadata(null);
    }
  }, [projectPath, getAudioScopes]);



  // Add this function to handle metadata updates from AudioRecorder
  const handleMetadataUpdate = useCallback(() => {
    loadProjectMetadata();
  }, [loadProjectMetadata]);

  // Modify the useEffect to use the new loadProjectMetadata function
  useEffect(() => {
    if (refreshMetadata) {
      loadProjectMetadata();
      updateMetadata(!refreshMetadata);
    }
  }, [refreshMetadata, loadProjectMetadata]);

  // Generates audio URLs for the selected reference and project based on the current book, chapter, and verse.
  const generateAudioUrls = useCallback(() => {
    setReferenceAudioUrl(null);
    if (selectedBook && selectedChapter && selectedVerse) {
      const formattedChapter = selectedChapter.toString();
      const formattedVerse = selectedVerse.toString();
      audioPlayerRef.current?.stopPlaying();

      // Reference audio path generation (remains the same)
      console.log(selectedRef, "selectedRef in generate url")
      if (selectedRef && referenceMetadata) {

        // Find matching audio file in ingredients
        const matchingPath = Object.entries(referenceMetadata.ingredients).find(([path, info]: [string, any]) => {
          // Check if this is an audio file
          if (info.scope) {
            // Check if the scope matches current selection
            return Object.entries(info.scope).some(([book, verses]: [string, string[]]) => {
              return book === selectedBook &&
                verses.includes(`${selectedChapter}:${selectedVerse}`);
            });
          }
          return false;
        });

        if (matchingPath) {
          const [audioPath] = matchingPath;
          console.log('audio file:', audioPath);

          setReferenceAudioUrl(`${selectedRef.path}/${audioPath}`);
          console.log('Found matching reference audio file:', audioPath);

          // setReferenceAudioUrl(`${selectedRef.path}/${matchingPath}`);
        } else {
          console.log('No matching refernce audio file found ');

          setReferenceAudioUrl(null);
        }
      }

      // Project audio path generation based on metadata ingredients
      if (projectMetadata?.ingredients) {
        // Find matching audio file in ingredients
        const matchingAudioFile = Object.entries(projectMetadata.ingredients).find(([path, info]: [string, any]) => {
          // Check if this is an audio file
          if (info.scope) {
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
          // console.log('audio file:', audioPath, 'matching audio file ',matchingAudioFile);

          setProjectAudioUrl(`${projectPath}/${audioPath}`);
          console.log('Found matching audio file:', audioPath);
        } else {

          setProjectAudioUrl(null);

          console.log('No matching audio file found');

        }
      } else {
        setProjectAudioUrl(null);
      }
    } else {
      setReferenceAudioUrl(null);
      setProjectAudioUrl(null);
    }
  }, [selectedRef, selectedBook, selectedChapter, selectedVerse, referenceMetadata, projectMetadata, projectPath]);

  // Automatically regenerate audio URLs when dependencies change.
  useEffect(() => {
    generateAudioUrls();
  }, [generateAudioUrls]);

  // Loads reference metadata from a JSON file and formats it for use in the application.
  const loadReferencesFromJson = useCallback(async () => {
    try {
      const fileExists = await RNFS.exists(jsonFilePath);
      if (fileExists) {
        const jsonData = await RNFS.readFile(jsonFilePath, 'utf8');
        const parsedData = JSON.parse(jsonData);
        if (parsedData.references.length > 0) {
          const formattedReferences = parsedData.references.map((ref: any) => ({
            title: ref.referenceName,
            path: ref.referencePath,
          }));
          setReferenceType(formattedReferences);
          console.log(formattedReferences, "formattedReferences", referenceResource)
          const defaultRef = formattedReferences.find((ref: { title: string; }) => ref.title === referenceResource);
          console.log(defaultRef, "defaultRef")
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
    // }, [jsonFilePath, referenceResource]);
  }, [projectName]);

  // Converts a USFM or SFM file to JSON format, saves it, and deletes the original file.
  const convertRefUsfmToJson = async (sourcePath: string, destinationPath: string) => {
    console.log(sourcePath, 'src', destinationPath, 'dest')
    const usfmContent = await RNFS.readFile(sourcePath, 'utf8');
    // const usfmParser = new grammar.USFMParser(usfmContent, grammar.LEVEL.RELAXED);
    const usfmParser = new grammar.USFMParser(usfmContent, grammar.FILTER.SCRIPTURE);

    const usfmJson = usfmParser.toJSON();
    console.log(usfmJson, 'usfmJson')
    const jsonContent = JSON.stringify(usfmJson, null, 2);
    const jsonFilePath = destinationPath.replace(/\.(usfm|SFM)$/i, '.json');
    await RNFS.writeFile(jsonFilePath, jsonContent, 'utf8');
    // setConvertingFileMessage("");

    // Delete the original USFM file after JSON file is written
    await RNFS.unlink(sourcePath);
    console.log('USFM file deleted successfully.');

  };


  const loadVerseText = useCallback(

    async (book: string, chapter: number, verse: number) => {
      // If no reference is selected, exit early
      if (!selectedRef) return;
      // Set loading state only on initial load
      if (!hasLoadedInitially) {

        setIsLoadingRef(true);
      }

      try {
        console.log(selectedRef.path, 'selectedRef 1')
        // Define paths for metadata, ingredients, and manifest

        let metadataPath = `${selectedRef.path}/metadata.json`;
        let usfmFilePath = `${selectedRef.path}`; selectedRef
        let ingredientsPath = `${selectedRef.path}/ingredients`;
        let manifestPath = `${selectedRef.path}/manifest.yaml`;

        // Check if metadata.json and ingredients exist

        let metadataExists = (await RNFS.exists(metadataPath) && await RNFS.exists(ingredientsPath));
        let manifestExists = await RNFS.exists(manifestPath)
        // If metadata is not found in the root, look in the text-1 subdirectory

        if (!metadataExists) {
          usfmFilePath = `${selectedRef.path}/text-1`;

          metadataPath = `${selectedRef.path}/text-1/metadata.json`;
          console.log(metadataPath, 'metadatapath')
          metadataExists = await RNFS.exists(metadataPath);
        }
        // If neither metadata nor ingredients are found, fall back to the manifest.yml
        if (!metadataExists && manifestExists) {
          try {
            const manifestContent = await RNFS.readFile(manifestPath, 'utf8');
            const manifest = require('js-yaml').load(manifestContent);

            // Find the project in the manifest for the specified book
            const bookProject = manifest.projects?.find(
              (project: any) => project.identifier.toLowerCase() === book.toLowerCase()
            );

            if (bookProject) {
              // Resolve the USFM file path from the manifest
              const usfmPath = `${selectedRef.path}/${bookProject.path.replace('./', '')}`;
              const jsonPath = usfmPath.replace(/\.(usfm|SFM)$/i, '.json');

              // Check if JSON data is already cached
              if (cachedData[jsonPath]) {
                const bookData = cachedData[jsonPath];
                // Find the requested chapter and verse in the cached data
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
                setIsLoadingRef(false);
                setHasLoadedInitially(true);
                return;
              }

              // Check if JSON file already exists on disk
              const jsonExists = await RNFS.exists(jsonPath);
              if (jsonExists) {
                try {
                  const jsonData = await RNFS.readFile(jsonPath, 'utf8');
                  const bookData = JSON.parse(jsonData);

                  // Cache the JSON data for future use
                  setCachedData((prevCache: any) => ({
                    ...prevCache,
                    [jsonPath]: bookData,
                  }));

                  const selectedChapterObj = bookData.chapters.find(
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
                  return;
                } catch (jsonError) {
                  console.error('Error reading existing JSON file:', jsonError);
                  // Continue to USFM conversion if JSON reading fails
                }
              }

              // If USFM file exists, convert it to JSON
              const usfmExists = await RNFS.exists(usfmPath);
              if (!usfmExists) {
                console.log('USFM file not found:', usfmPath);
                setVerseText('Content Not Available');
                return;
              }


              // Proceed with USFM to JSON conversion
              try {
                setIsLoading(true)
                await convertRefUsfmToJson(usfmPath, jsonPath);

                // Read the converted JSON
                const jsonData = await RNFS.readFile(jsonPath, 'utf8');
                const bookData = JSON.parse(jsonData);

                // Cache the converted data
                setCachedData((prevCache: any) => ({
                  ...prevCache,
                  [jsonPath]: bookData,
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
                setIsLoading(false)
                return;
              } catch (conversionError) {
                console.error('Error converting USFM to JSON from manifest:', conversionError);
                setVerseText('Error converting content format');
                return;
              }
            }
          } catch (manifestError) {
            console.error('Error parsing manifest:', manifestError);
          }
        }


        // If no valid metadata or manifest is found, exit
        if (!metadataExists) {
          console.log('No metadata.json found in either location');
          setVerseText('Content Not Available');
          return;
        }

        // Read metadata and find matching USFM ingredient
        const metadataContent = await RNFS.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);

        if (!metadata.ingredients) {
          console.log('No ingredients found in metadata');
          setVerseText('Content Not Available');
          return;
        }

        // Find matching ingredient entry
        const matchingIngredient = Object.entries(metadata.ingredients).find(([path, info]: [string, any]) => {
          return (
            info.mimeType === "text/x-usfm" &&
            info.scope &&
            Object.keys(info.scope).includes(book)
          );
        });




        if (!matchingIngredient) {
          console.log('No matching USFM file found for book:', book);
          setVerseText('Content Not Available');
          return;
        }

        const [ingredientPath] = matchingIngredient;
        const usfmPath = `${usfmFilePath}/${ingredientPath}`;
        const jsonPath = usfmPath.replace(/\.(usfm|SFM)$/i, '.json');

        // Check if converted JSON already exists in cache
        if (cachedData[jsonPath]) {
          const bookData = cachedData[jsonPath];
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
          setIsLoadingRef(false);
          setHasLoadedInitially(true);
          return;
        }

        // New: Check if JSON file already exists on disk
        const jsonExists = await RNFS.exists(jsonPath);
        if (jsonExists) {
          try {
            const jsonData = await RNFS.readFile(jsonPath, 'utf8');
            const bookData = JSON.parse(jsonData);

            // Cache the existing JSON data
            setCachedData((prevCache: any) => ({
              ...prevCache,
              [jsonPath]: bookData,
            }));

            const selectedChapterObj = bookData.chapters.find(
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
            return;
          } catch (jsonError) {
            console.error('Error reading existing JSON file:', jsonError);
            // Continue to USFM conversion if JSON reading fails
          }
        }

        // Read or convert USFM to JSON if not cached
        const usfmExists = await RNFS.exists(usfmPath);
        if (!usfmExists) {
          console.log('USFM file not found:', usfmPath);
          setVerseText('Content Not Available');
          return;
        }

        // Convert USFM to JSON
        try {
          setIsLoading(true)
          await convertRefUsfmToJson(usfmPath, jsonPath);

          // Read the converted JSON
          const jsonData = await RNFS.readFile(jsonPath, 'utf8');
          const bookData = JSON.parse(jsonData);

          // Cache the converted data
          setCachedData((prevCache: any) => ({
            ...prevCache,
            [jsonPath]: bookData,
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
          setIsLoading(false)
        } catch (conversionError) {
          console.error('Error converting USFM to JSON:', conversionError);
          setVerseText('Error converting content format');
        }

      } catch (error) {
        console.log('Error in loadTargetVerseText:', error);
        setVerseText('Error loading verse.');
      } finally {
        setIsLoadingRef(false);
        setHasLoadedInitially(true);
      }
    },
    [selectedRef, cachedData, hasLoadedInitially],
  );

  /**
   * Converts a USFM file to JSON format and deletes the original USFM file.
   * @param sourcePath - The path of the source USFM file.
   * @param destinationPath - The path where the converted JSON file will be saved.
   */
  const convertUsfmToJson = async (sourcePath: string, destinationPath: string) => {
    console.log(sourcePath, 'src', destinationPath, 'dest')
    const usfmContent = await RNFS.readFile(sourcePath, 'utf8');
    const usfmParser = new grammar.USFMParser(usfmContent);
    const usfmJson = usfmParser.toJSON();
    // console.log(usfmJson, 'usfmJson')
    const jsonContent = JSON.stringify(usfmJson, null, 2);
    const jsonFilePath = destinationPath.replace(/\.(usfm|SFM)$/i, '.json');

    await RNFS.writeFile(jsonFilePath, jsonContent, 'utf8');
    await RNFS.unlink(sourcePath);
    console.log('USFM file deleted successfully.');
  };

  /**
   * Loads the target verse text by reading metadata, finding the relevant USFM file,
   * converting it to JSON if needed, and extracting the desired verse text.
   * @param book - The book of the Bible.
   * @param chapter - The chapter number.
   * @param verse - The verse number.
   */

  const loadTargetVerseText = useCallback(
    async (book: string, chapter: number, verse: number) => {
      console.log("loadTargetVerseText", book, chapter, verse)
      if (!projectPath) return;

      // Set loading state only on initial load
      if (!hasLoadedInitially) {
        setIsLoadingTarget(true);
      }

      try {

        // First try root metadata.json, then text-1/metadata.json
        let metadataPath = `${projectPath}/metadata.json`;
        let usfmFilePath = `${projectPath}`;
        let ingredientsPath = `${projectPath}/ingredients`;
        let metadataExists = (await RNFS.exists(metadataPath) && await RNFS.exists(ingredientsPath));

        if (!metadataExists) {
          usfmFilePath = `${projectPath}/text-1`;

          metadataPath = `${projectPath}/text-1/metadata.json`;
          metadataExists = await RNFS.exists(metadataPath);
        }

        if (!metadataExists) {
          console.log('No metadata.json found in either location');
          setTargetVerseText('Content Not Available');
          return;
        }

        const metadataContent = await RNFS.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);

        if (!metadata.ingredients) {
          console.log('No ingredients found in metadata');
          setTargetVerseText('Content Not Available');
          return;
        }

        // Find matching ingredient entry
        const matchingIngredient = Object.entries(metadata.ingredients).find(([path, info]: [string, any]) => {
          return (
            info.mimeType === "text/x-usfm" &&
            info.scope &&
            Object.keys(info.scope).includes(book)
          );
        });
        if (!matchingIngredient) {
          console.log('No matching USFM file found for book:', book);
          setTargetVerseText('Content Not Available');
          return;
        }
        const [ingredientPath] = matchingIngredient;
        const usfmPath = `${usfmFilePath}/${ingredientPath}`;
        const jsonPath = usfmPath.replace(/\.(usfm|SFM)$/i, '.json');

        // Check if converted JSON already exists in cache
        if (cachedTargetData[jsonPath]) {
          const bookData = cachedTargetData[jsonPath];
          const selectedChapterObj = bookData?.chapters.find(
            (chapterObj: any) => chapterObj.chapterNumber === chapter.toString(),
          );

          if (selectedChapterObj) {
            const content = selectedChapterObj.contents.find(
              (verseObj: any) => verseObj.verseNumber === verse.toString(),
            );
            setTargetVerseText(content ? content.verseText : 'Verse not found');
          } else {
            setTargetVerseText('Chapter not found');
          }
          setIsLoadingTarget(false);
          setHasLoadedInitially(true);
          return;
        }

        // New: Check if JSON file already exists on disk
        const jsonExists = await RNFS.exists(jsonPath);
        if (jsonExists) {
          try {
            const jsonData = await RNFS.readFile(jsonPath, 'utf8');
            const bookData = JSON.parse(jsonData);

            // Cache the existing JSON data
            setCachedTargetData((prevCache: any) => ({
              ...prevCache,
              [jsonPath]: bookData,
            }));

            const selectedChapterObj = bookData.chapters.find(
              (chapterObj: any) => chapterObj.chapterNumber === chapter.toString(),
            );

            if (selectedChapterObj) {
              const content = selectedChapterObj.contents.find(
                (verseObj: any) => verseObj.verseNumber === verse.toString(),
              );
              setTargetVerseText(content ? content.verseText : 'Verse not found');
            } else {
              setTargetVerseText('Chapter not found');
            }
            return;
          } catch (jsonError) {
            console.error('Error reading existing JSON file:', jsonError);
            // Continue to USFM conversion if JSON reading fails
          }
        }
        else {
          // Check if USFM file exists
          const usfmExists = await RNFS.exists(usfmPath);
          if (!usfmExists) {
            console.log('USFM file not found:', usfmPath);
            setTargetVerseText('Content Not Available');
            return;
          }
          else {
            // Convert USFM to JSON
            try {
              setIsLoading(true)
              await convertUsfmToJson(usfmPath, jsonPath);

              console.log('read after usfm to json conversion')
              // Read the converted JSON
              const jsonData = await RNFS.readFile(jsonPath, 'utf8');
              const bookData = JSON.parse(jsonData);

              // Cache the converted data
              setCachedTargetData((prevCache: any) => ({
                ...prevCache,
                [jsonPath]: bookData,
              }));

              const selectedChapterObj = bookData.chapters.find(
                (chapterObj: any) =>
                  chapterObj.chapterNumber === chapter.toString(),
              );

              if (selectedChapterObj) {
                const content = selectedChapterObj.contents.find(
                  (verseObj: any) => verseObj.verseNumber === verse.toString(),
                );
                setTargetVerseText(content ? content.verseText : 'Verse not found');
              } else {
                setTargetVerseText('Chapter not found');
              }
              setIsLoading(false)
            } catch (conversionError) {
              console.error('Error converting USFM to JSON:', conversionError);
              setTargetVerseText('Error converting content format');
            }
          }
        }
      } catch (error) {
        console.log('Error in loadTargetVerseText:', error);
        setTargetVerseText('Error loading verse.');
      } finally {
        setIsLoadingTarget(false);
        setHasLoadedInitially(true);
      }

    },
    [projectPath, cachedTargetData],
  );


  /**
   * Loads the current scope information from metadata.json and sets it in state.
   */
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


  /**
   * Handles changes in selection of book, chapter, and verse, updating the state.
   */
  const handleSelectionChange = useCallback(
    (book: string, chapter: number, verse: number) => {

      // Only update state if the values have actually changed
      setSelectedBook((prevBook) =>
        prevBook !== book ? book : prevBook
      );
      setSelectedChapter((prevChapter) =>
        prevChapter !== chapter ? chapter : prevChapter
      );
      setSelectedVerse((prevVerse) =>
        prevVerse !== verse ? verse : prevVerse
      );
    },
    [] // Remove dependencies as state updaters are stable
  );



  useEffect(() => {
    // Function to handle orientation updates
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      const newIsPortrait = height >= width;

      if (newIsPortrait !== isPortrait) {
        setIsPortrait(newIsPortrait);
        // Stop audio playback when orientation changes
        audioPlayerRef.current?.stopPlaying();
      }
    };
    // Subscribe to orientation changes

    const subscription = Dimensions.addEventListener(
      'change',
      updateOrientation,
    );
    // Initial calls

    updateOrientation();
    loadReferencesFromJson();
    return () => {
      // Clean up subscription

      subscription?.remove?.();
    };
  }, [loadReferencesFromJson, isPortrait]);

  useEffect(() => {
    // Check if all conditions are met to load verse texts

    if (selectedRef && selectedBook && selectedChapter && selectedVerse) {

      loadVerseText(selectedBook, selectedChapter, selectedVerse);
    }
    if (selectedBook && selectedChapter && selectedVerse) {
      console.log('calling load target text with cond -selectedBook && selectedChapter && selectedVerse')
      loadTargetVerseText(selectedBook, selectedChapter, selectedVerse);
    }

  }, [
    selectedRef,
    selectedBook,
    selectedChapter,
    selectedVerse,
    loadVerseText,
    loadTargetVerseText
  ]);


  /**
 * Updates appInfo.json with the selected reference resource for the current project.
 * @param selectedReference - The reference resource to update in appInfo.json.
 */
  const updateAppInfoJson = useCallback(async (selectedReference: ReferenceType) => {
    // const appInfoPath = `${RNFS.ExternalStorageDirectoryPath}/Download/OBTRecorderApp/appInfo.json`;

    const appInfoPath = `${RNFS.DocumentDirectoryPath}/appInfo.json`;

    try {
      // Read the current appInfo.json
      const jsonContent = await RNFS.readFile(appInfoPath, 'utf8');
      const appInfo = JSON.parse(jsonContent);

      // Find the project and update it
      const updatedProjects = appInfo.projects.map((project: ProjectType) => {
        if (project.projectName === projectName) {
          return {
            ...project,
            referenceResource: selectedReference.title
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
      {(isLoading || isLoadingRef || isLoadingTarget) && <Loader visible={true} />}

      <View>
        {currentScope &&
          <BookChapterVerseSelector onSelectionChange={handleSelectionChange} currentScope={currentScope}
            audioScope={audioScopes} // Pass the audio scopes to the selector 
            projectName={projectName}
          />
        }
      </View>
      {/* card code begins here */}
      <View
        style={{
          alignItems: 'center',
          height: isPortrait ? '90%' : '80%',
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
            }}
          >
            <View
              style={
                // styles.cardTitleContainer,[]
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 50,
                  // marginTop: 5,
                  width: '100%',
                  borderBottomWidth: 2,
                  borderColor: '#f7f1e3',
                  // alignContent:'center'
                }
              }>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={[styles.cardTitleText,]}>Reference</Text>
                <SelectDropdown
                  data={referenceType}
                  defaultValue={selectedRef}
                  onSelect={(selectedItem, index) => {
                    if (selectedItem.path) {
                      setSelectedRef(selectedItem);
                      setVerseText(" ");
                      setIsLoadingRef(true);
                      updateAppInfoJson(selectedItem);
                    }
                  }}
                  buttonTextAfterSelection={(selectedItem: { title: any; }) => {
                    return selectedItem ? selectedItem.title : 'Select Reference';
                  }}
                  rowTextForSelection={(item: { title: any; }) => {
                    return item.title;
                  }}
                  renderButtonText={(selectedItem: { title: any; }) => {
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '14%' }}>

                  <TouchableOpacity onPress={decreaseFontSize}
                  // style={{ borderWidth: 1, borderColor: '#a4b0be' }}
                  >
                    <Icon1 name="text-decrease" onPress={decreaseFontSize} size={20} color={resFontSize <= 14 ? '#d3d3d3' : '#40739e'} />

                  </TouchableOpacity>
                  <TouchableOpacity onPress={increaseFontSize}
                  // style={{ borderWidth: 1, borderColor: '#a4b0be' }}
                  >
                    <Icon1 name="text-increase" size={20} color={resFontSize >= 20 ? '#d3d3d3' : '#40739e'} />

                  </TouchableOpacity>

                </View>
              </View>
            </View>
            <View style={[styles.cardContent, { marginTop: 10, }]}>
              {isLoadingRef ? (
                <View style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="#2980b9" />
                </View>

              ) : (
                <ScrollView persistentScrollbar={true}>
                  {verseText === '' ? (
                    <Text style={styles.emptySource}>
                      Please select the Source Reference{' '}
                    </Text>
                  ) : (
                    <Text style={[styles.cardContentText, { fontSize: resFontSize }]}>{verseText} </Text>
                  )}
                </ScrollView>
              )}
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
            }}
          >
            <View
              style={[
                styles.cardTitleTextContainer,
                {
                  padding: 5,
                  height: 50,
                  width: '100%',
                  borderBottomWidth: 2,
                  borderColor: '#f7f1e3'
                },
              ]}>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>

                <Text style={styles.cardTitleText}>{`${projectName}`}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '14%' }}>

                  <TouchableOpacity onPress={decreaseTarFontSize}
                  // style={{ borderWidth: 1, borderColor: '#a4b0be' }}
                  >
                    <Icon1 name="text-decrease" size={20} color={targetFontSize <= 14 ? '#d3d3d3' : '#40739e'} />

                  </TouchableOpacity>
                  <TouchableOpacity onPress={increaseTarFontSize}
                  // style={{ borderWidth: 1, borderColor: '#a4b0be' }}
                  >
                    <Icon1 name="text-increase" size={20} color={targetFontSize >= 20 ? '#d3d3d3' : '#40739e'} />

                  </TouchableOpacity>

                </View>
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
              {isLoadingTarget ? (
                <View style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="#2980b9" />
                </View>

              ) : (

                <ScrollView persistentScrollbar={true} >

                  <Text style={[styles.cardContentText, { fontSize: targetFontSize }]}>{targetVerseText === '...' ? 'Content not Available' : targetVerseText} </Text>

                </ScrollView>
              )}
            </View>

            <View style={styles.audioRecorderContainer}>

              <AudioRecorder
                existingRecordingPath={projectAudioUrl ? projectAudioUrl : ""}
                projectPath={projectPath}
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                selectedVerse={selectedVerse}
                onMetadataUpdate={handleMetadataUpdate} // Add this prop
              />

            </View>
          </View>
        </View>

      </View>

    </View>
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
    borderColor: '#b2bec3',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 2,
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
    borderTopWidth: 2,
    borderColor: '#f7f1e3'
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
    borderTopWidth: 2,
    borderColor: '#f7f1e3'
  },

});

export default ProjectEditorScreen;
