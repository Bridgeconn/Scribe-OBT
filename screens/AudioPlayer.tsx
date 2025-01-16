import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from 'react';
import { SafeAreaView, TouchableOpacity, View, Text, Alert, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  Waveform,
  IWaveformRef,
  FinishMode,
} from '@simform_solutions/react-native-audio-waveform';

// Define the interface for the parent component to call the stopPlaying function
export interface AudioPlayerRef {
  stopPlaying: () => Promise<void>;
}


// Define the interface for component props
interface AudioPlayerProps {
  url: string;
}

// AudioPlayerComponent: Renders the audio player with waveform and controls

const AudioPlayerComponent: ForwardRefRenderFunction<AudioPlayerRef, AudioPlayerProps> = ({ url }, ref) => {
  const waveformRef = useRef<IWaveformRef>(null); // Reference to the Waveform component
  const [playing, setPlaying] = useState(false); // State to track playback status
  const [key, setKey] = useState(0); // Key state to force re-rendering of the waveform when URL changes

   // Effect to reset player state when the URL changes
  useEffect(() => {
    setPlaying(false);  // Stop playback
    if (waveformRef.current) {
      waveformRef.current.stopPlayer();  // Stop the player if running
    }
    setKey(prevKey => prevKey + 1); // Increment the key to force re-render of Waveform

  }, [url]);

   // Expose the stopPlaying function to parent components using a ref
  useImperativeHandle(ref, () => ({
    stopPlaying: async () => {
      await stopPlaying();
    },
  }));

   // Function to toggle playback (play or pause)
  const togglePlayback = async () => {
    if (url) {
      if (playing) {
        const paused = await waveformRef.current?.pausePlayer();
        if (!paused) {
          Alert.alert('Error', 'Failed to pause playback.');
        }
      } else {
        const started = await waveformRef.current?.startPlayer({
          finishMode: FinishMode.stop,
        });
        if (!started) {
          Alert.alert('Error', 'Failed to start playback.');
        }
      }
      setPlaying(!playing);
    } else {
      Alert.alert('No Audio File', 'Please load an audio file first.');
    }
  };

    // Function to stop audio playback
  const stopPlaying = async () => {
    try {
      if (url) {
        const stopped = await waveformRef.current?.stopPlayer();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.waveformContainer}>
        <View style={styles.controlsContainer}>
          {url && (
            <>
              <TouchableOpacity onPress={togglePlayback} style={styles.controlButton}>
                <Icon name={playing ? 'pause' : 'play-arrow'} size={28} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={stopPlaying} style={styles.controlButton}>
                <Icon name="restart-alt" size={28} color="#2196F3" />
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.waveformWrapper}>
          {url ? (
            <Waveform
              key={key} // Add this line to use the key state
              ref={waveformRef}
              mode="static"
              path={url}
              candleSpace={2}
              candleWidth={4}
              scrubColor="#22a6b3"
              onPlayerStateChange={(playerState) => {
                console.log(playerState, "playerstate");
                if (playerState === 'stopped') {
                  setPlaying(false);
                }
              }}
            />
          ) : (
            <Text>No audio file loaded</Text>
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
    width: '75%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlButton: {
    marginHorizontal: 5,
  },
});
const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(AudioPlayerComponent);
export default AudioPlayer;