  import React, { useRef, useState, useEffect } from 'react';

  import { SafeAreaView, TouchableOpacity, View, Text, Alert, Linking, StyleSheet } from 'react-native';
  import RNFS from 'react-native-fs';
  import Icon from 'react-native-vector-icons/MaterialIcons';
  import {
    Waveform,
    IWaveformRef,
    useAudioPermission,
    FinishMode,
    PermissionStatus,
    UpdateFrequency,
    RecorderState,
  } from '@simform_solutions/react-native-audio-waveform';
  import Crypto from 'react-native-quick-crypto';
  import { FFmpegKit } from 'ffmpeg-kit-react-native';

const calculateMD5 = async (filePath: string): Promise<string> => {
  try {
    const fileContent = await RNFS.readFile(filePath, 'base64');
    const hash = Crypto.createHash('md5');
    hash.update(fileContent);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error calculating MD5:', error);
    throw error;
  }
};

  interface AudioRecorderProps {
    projectPath: string;
    selectedBook: string;
    selectedChapter: number;
    selectedVerse: number;
    onRecordingComplete?: (filePath: string) => void;
    onRecordingDelete?: () => void;
    existingRecordingPath?: string;
    onMetadataUpdate?: () => void; 
  }

  const AudioRecorder: React.FC<AudioRecorderProps> = ({
    projectPath,
    selectedBook,
    selectedChapter,
    selectedVerse,
    onRecordingComplete,
    onRecordingDelete,
    existingRecordingPath,
    onMetadataUpdate
  }) => {
    const liveWaveformRef = useRef<IWaveformRef>(null);
    const staticWaveformRef = useRef<IWaveformRef>(null);
    const [recording, setRecording] = useState(false);
    const [audioFilePath, setAudioFilePath] = useState<string | null>(null);
    const [wavFilePath, setWavFilePath] = useState<string | null>(existingRecordingPath || null);
    const [playing, setPlaying] = useState(false);
    const { checkHasAudioRecorderPermission, getAudioRecorderPermission } = useAudioPermission();
    const [recordingCollection, setRecordingCollection] = useState<string[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isRecordingFinalized, setIsRecordingFinalized] = useState(!!existingRecordingPath);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const durationTimer = useRef<NodeJS.Timeout | null>(null);
    const [waveformKey, setWaveformKey] = useState(0); // Add key state for forcing re-render
    // Add timer functionality
    useEffect(() => {
      if (recording) {
        durationTimer.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } else {
        if (durationTimer.current) {
          clearInterval(durationTimer.current);
        }
      }
      return () => {
        if (durationTimer.current) {
          clearInterval(durationTimer.current);
        }
      };
    }, [recording]);

    // Format duration to MM:SS
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
      const updateWaveform = async () => {
        try {
          // If currently playing, stop playback
          if (playing) {
            await staticWaveformRef.current?.stopPlayer();
            setPlaying(false);
          }
          if (existingRecordingPath ) {
        
            setWavFilePath(existingRecordingPath);
            setIsRecordingFinalized(true);
            // Force re-render of waveform by updating key
            setWaveformKey(prev => prev + 1);
          } else {
            setWavFilePath(null);
            setIsRecordingFinalized(false);
          }
        } catch (error) {
          console.error('Error updating waveform:', error);
          setWavFilePath(null);
          setIsRecordingFinalized(false);
        }
      };

      updateWaveform();
    }, [existingRecordingPath, selectedBook, selectedChapter, selectedVerse]);

    

    const getAudioDirectoryPath = () => {
      return `${projectPath}/audio/ingredients/${selectedBook}/${selectedChapter}`;
    };

    const ensureDirectoryExists = async () => {
      const dirPath = getAudioDirectoryPath();
      try {
        const dirExists = await RNFS.exists(dirPath);
        if (!dirExists) {
          await RNFS.mkdir(dirPath, { NSURLIsExcludedFromBackupKey: true });
        }
      } catch (error) {
        console.error('Error creating directory:', error);
        Alert.alert('Error', 'Failed to create directory for recording.');
      }
    };

    const addEntryToMetadata = async (wavFilePath: string) => {
      const metadataFilePath = `${projectPath}/metadata.json`;
      
      try {
        const fileExists = await RNFS.exists(metadataFilePath);
        if (!fileExists) {
          throw new Error('Metadata file does not exist');
        }

        const content = await RNFS.readFile(metadataFilePath);
        const parsedMetadata = JSON.parse(content);
        if (!parsedMetadata.ingredients) {
          parsedMetadata.ingredients = {};
        }

        const fileStats = await RNFS.stat(wavFilePath);
        const metadataEntryPath = `audio/ingredients/${selectedBook}/${selectedChapter}/${selectedChapter}_${selectedVerse}_1_default.wav`;

        // Calculate MD5 hash of the WAV file
      const md5Hash = await calculateMD5(wavFilePath);


        parsedMetadata.ingredients[metadataEntryPath] = {
          checksum: {
            md5: md5Hash, // Add the calculated MD5 hash
          },
          mimeType: "audio/wav",
          size: fileStats.size,
          scope: {
            [selectedBook]: [`${selectedChapter}:${selectedVerse}`]
          }
        };

        await RNFS.writeFile(metadataFilePath, JSON.stringify(parsedMetadata, null, 2));
      } catch (error) {
        console.error('Error updating metadata:', error);
        Alert.alert('Warning', 'Failed to update metadata. Recording saved but metadata not updated.');
      }
    };

    const deleteEntryFromMetadata = async () => {
      const metadataFilePath = `${projectPath}/metadata.json`;
      
      try {
        const fileExists = await RNFS.exists(metadataFilePath);
        if (!fileExists) {
          throw new Error('Metadata file does not exist');
        }

        const content = await RNFS.readFile(metadataFilePath);
        const parsedMetadata = JSON.parse(content);
        const metadataEntryPath = `audio/ingredients/${selectedBook}/${selectedChapter}/${selectedChapter}_${selectedVerse}_1_default.wav`;

        if (parsedMetadata.ingredients?.[metadataEntryPath]) {
          delete parsedMetadata.ingredients[metadataEntryPath];
          await RNFS.writeFile(metadataFilePath, JSON.stringify(parsedMetadata, null, 2));
        }
      } catch (error) {
        console.error('Error deleting metadata entry:', error);
        Alert.alert('Warning', 'Failed to update metadata after deletion.');
      }
    };

    const requestAudioPermission = async () => {
      const hasPermission = await checkHasAudioRecorderPermission();
      if (hasPermission === PermissionStatus.granted) {
        return true;
      } else if (hasPermission === PermissionStatus.undetermined) {
        const permissionStatus = await getAudioRecorderPermission();
        return permissionStatus === PermissionStatus.granted;
      } else {
        Linking.openSettings();
        return false;
      }
    };

    const startRecording = async () => {
      const permissionGranted = await requestAudioPermission();
      if (!permissionGranted) {
        Alert.alert('Permission required', 'You need to allow microphone access.');
        return;
      }

      try {
        await ensureDirectoryExists();
        setRecording(true);
        setAudioFilePath(null);
        setWavFilePath(null);


        const recordingStarted = await liveWaveformRef.current?.startRecord({
          encoder: 1,
          sampleRate: 48000,
          bitRate: 1152000,
          fileNameFormat: `recording_${recordingCollection.length + 1}.m4a`,
          useLegacy: false,
          updateFrequency: UpdateFrequency.medium,
        });

        if (!recordingStarted) {
          throw new Error('Failed to start recording');
        }
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Error', 'Failed to start recording.');
        setRecording(false);
      }
    };

    const pauseRecording = async () => {
      try {
        if (liveWaveformRef.current && recording) {
          const tempFilePath = await liveWaveformRef.current.stopRecord();
          if (tempFilePath) {
            const destinationPath = `${getAudioDirectoryPath()}/temp_${recordingCollection.length + 1}.m4a`;
            await RNFS.moveFile(tempFilePath, destinationPath);
            setRecordingCollection(prev => [...prev, destinationPath]);
            setRecording(false);
            setIsPaused(true);
          }
        }
      } catch (error) {
        console.error('Error pausing recording:', error);
        Alert.alert('Error', 'Failed to pause the recording.');
      }
    };

    const resumeRecording = async () => {
      try {
        await startRecording();
      } catch (error) {
        console.error('Error resuming recording:', error);
        Alert.alert('Error', 'Failed to resume the recording.');
      }
    };

    const stopRecording = async () => {
      try {
        let finalRecordingPath = null;
        if (recording || isPaused) {
          finalRecordingPath = await liveWaveformRef.current?.stopRecord();
          if (finalRecordingPath) {
            const destinationPath = `${getAudioDirectoryPath()}/temp_${recordingCollection.length + 1}.m4a`;
            await RNFS.moveFile(finalRecordingPath, destinationPath);
            finalRecordingPath = destinationPath;
          }
        }

        const updatedRecordingCollection = finalRecordingPath 
          ? [...recordingCollection, finalRecordingPath]
          : recordingCollection;

        if (updatedRecordingCollection.length === 0) {
          throw new Error('No recordings to process');
        }

        const outputPath = `${getAudioDirectoryPath()}/${selectedChapter}_${selectedVerse}_1_default.m4a`;
        let ffmpegCommand = `-y `;
        updatedRecordingCollection.forEach(file => {
          ffmpegCommand += `-i "${file}" `;
        });
        ffmpegCommand += `-filter_complex concat=n=${updatedRecordingCollection.length}:v=0:a=1 -c:a aac "${outputPath}"`;

        await FFmpegKit.execute(ffmpegCommand);
        setIsRecordingFinalized(true);
        setAudioFilePath(outputPath);

        const wavPath = await convertToWav(outputPath);
        if (wavPath && onRecordingComplete) {
          onRecordingComplete(wavPath);
        }

        // Cleanup temporary files
        for (const file of updatedRecordingCollection) {
          await RNFS.unlink(file);
        }
        setRecordingCollection([]);
        setRecordingDuration(0);
        setRecording(false);
        setIsPaused(false);

      } catch (error) {
        console.error('Error stopping recording:', error);
        Alert.alert('Error', 'Failed to save the recording.');
      }
    };

    const convertToWav = async (inputPath: string) => {
      try {
        const outputPath = inputPath.replace('_1_default.m4a', '_1_default.wav');
        const command = `-i "${inputPath}" -af "afftdn=nf=-25" -acodec pcm_s24le -ar 48000 -ac 1 "${outputPath}"`;

        await FFmpegKit.execute(command);
        setWavFilePath(outputPath);
        await addEntryToMetadata(outputPath);

            // Add callback here after successful metadata update
      if (onMetadataUpdate) {
        onMetadataUpdate();
      }

        if (inputPath) {
          await RNFS.unlink(inputPath);
          setAudioFilePath(null);
        }

        return outputPath;
      } catch (error) {
        console.error('Error converting to WAV:', error);
        Alert.alert('Error', 'Failed to convert the recording to WAV format.');
        return null;
      }
    };

    const togglePlayback = async () => {
      if (wavFilePath) {
        if (playing) {
          const paused = await staticWaveformRef.current?.pausePlayer();
          if (!paused) {
            Alert.alert('Error', 'Failed to pause playback.');
          }
        } else {
          const started = await staticWaveformRef.current?.startPlayer({
            finishMode: FinishMode.stop,
          });
          if (!started) {
            Alert.alert('Error', 'Failed to start playback.');
          }
        }
        setPlaying(!playing);
      } else {
        Alert.alert('No Audio File', 'Please record an audio file first.');
      }
    };

    const stopPlaying = async () => {
      try {
        if (wavFilePath) {
          const stopped = await staticWaveformRef.current?.stopPlayer();
          if (!stopped) {
            Alert.alert('Error', 'Failed to stop playback.');
          }
          setPlaying(false);
        }
      } catch (error) {
        console.error('Error stopping playback:', error);
        Alert.alert('Error', 'Failed to stop the playback.');
      }
    };

    const deleteRecording = async () => {
      try {
        await deleteEntryFromMetadata();
        if (wavFilePath) {
          await RNFS.unlink(wavFilePath);
          setWavFilePath(null);
        }
        setIsRecordingFinalized(false);
        setPlaying(false);

        // Add callback here after successful metadata deletion
      if (onMetadataUpdate) {
        onMetadataUpdate();
      }
        
        if (onRecordingDelete) {
          onRecordingDelete();
        }

        Alert.alert('Success', 'Recording deleted successfully.');
      } catch (error) {
        console.error('Error deleting files:', error);
        Alert.alert('Error', 'Failed to delete the recording.');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waveformContainer}>
        {(recording || isPaused ) && <View>
        <Icon name="fiber-manual-record" size={22} color="#FF0000" style={styles.recordingIcon} />
        <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
      </View>}
    
          <View style={styles.waveformWrapper}>
            {recording ? (
              <Waveform
                ref={liveWaveformRef}
                mode="live"
                candleSpace={2}
                candleWidth={4}
                onRecorderStateChange={(recorderState: RecorderState) => console.log(recorderState)}
              />
            ) : wavFilePath ? (
              <Waveform
                key={`waveform-${waveformKey}`} 
                ref={staticWaveformRef}
                mode="static"
                path={wavFilePath}
                candleSpace={2}
                candleWidth={4}
                scrubColor="#FF9800"
                onPanStateChange={isMoving => console.log(isMoving)}
                onPlayerStateChange={(playerState) => {
                  if (playerState === 'stopped') {
                    setPlaying(false);
                  }
                }}
              />
            ):( isPaused ?
              <Text style={[styles.durationText,{textAlign:'center'}]}>Recording is Paused</Text>
            :(
              <></>
            ))}
              
          </View>

          <View style={styles.controlsContainer}>
            {!recording && !isPaused && !wavFilePath &&(
              <TouchableOpacity onPress={startRecording} style={[styles.controlButton,styles.recordButton]} disabled={isRecordingFinalized}>
                <Icon name="mic" size={28} color={isRecordingFinalized ? "#bdc3c7" : "#eb4d4b"} />
              </TouchableOpacity>
            )}
            {recording && (
              <TouchableOpacity onPress={pauseRecording} style={styles.controlButton}>
                <Icon name="pause" size={28} color="#FF9800" />
              </TouchableOpacity>
            )}
            {isPaused && !recording && (
              <TouchableOpacity onPress={resumeRecording} style={styles.controlButton}>
                <Icon name="mic" size={28} color="#eb4d4b" />
              </TouchableOpacity>
            )}
            {(recording || isPaused) && (
              <TouchableOpacity onPress={stopRecording} style={styles.controlButton}>
                <Icon name="stop" size={28} color="#FF5252" />
              </TouchableOpacity>
            )}
            {wavFilePath && !recording && (
              <>
                <TouchableOpacity onPress={togglePlayback} style={styles.controlButton}>
                  <Icon name={playing ? 'pause' : 'play-arrow'} size={28} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={stopPlaying} style={styles.controlButton}>
                  <Icon name="restart-alt" size={28} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteRecording} style={styles.controlButton}>
                  <Icon name="delete" size={28} color="#FF5252" />
                  </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: 45,
      marginHorizontal: 5,
    },
    waveformContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      borderRadius: 10,
      padding: 5,
      shadowColor: "#000",
      alignItems: 'center',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    waveformWrapper: {
      width: '70%',
    },
    recordingIcon: {
      marginLeft: 8,
    },
    durationText: {
      color: '#128C7E',
      fontSize: 12,
      marginLeft: 4,
      fontWeight: '500',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    controlButton: {
      // marginHorizontal: 5,
    },
    recordButton:{
      borderWidth:1,
      borderColor: '#0097e6',
      borderRadius: 20,
      elevation:2,
      backgroundColor:'#fff'
    }
  });

  export default AudioRecorder;
