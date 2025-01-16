import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';

interface LoaderProps {
  visible: boolean;
  message?: string;
  progress?: number;
}

const Loader2: React.FC<LoaderProps> = ({ visible, progress = 0 }) => {
  const logo =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" stroke="#f7f1e3" stroke-width="2">  <path d="m6.667 33.334 16.667-16.667m0 0V8.333L16.667 15m6.667 1.667h8.333m-15-1.667v8.334H25M16.667 15 10 21.667V30h8.334"></path>  <path d="M23.333 8.333c1.06-1.055 2.522-1.667 4.138-1.667a5.859 5.859 0 0 1 5.862 5.857c0 1.619-.603 3.084-1.667 4.143L25 23.334 18.333 30"></path></svg>';

  // Animated value for controlling the progress animation (i.e., the loader bar)
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // useEffect hook to trigger progress animation when progress value changes
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 50,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.container}>
        <View style={styles.loader}>
          <SvgXml xml={logo} width="40" height="40" />
          <Text style={styles.message}>{progress === 0 ? 'Please wait !!! \n Deleting Project...' : 'Please wait !!! \n Importing Project'}</Text>
          {progress > 0 && <><View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
            <Text style={styles.message}>{`Completed ${(progress * 100).toFixed(2)}% `}</Text>
          </>
          }

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    width: 250,
    padding: 20,
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginTop: 10,
    width: '100%',
    height: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f7f1e3',
    borderRadius: 5,
  },
});

export default Loader2;