import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Interface to define the expected props for the Loader component
interface LoaderProps {
  visible: boolean;  // Determines if the loader should be visible
  message?: string;  // Optional message to display, defaults to 'Loading' if not provided
}

const Loader: React.FC<LoaderProps> = ({ visible, message = 'Loading' }) => {
  // Ref to store the animated value for the loader's dot animation
  const sharedValue = useRef(new Animated.Value(0)).current;

  // useEffect hook to handle animation when visibility changes
  useEffect(() => {
    if (visible) {
      // Animated loop for the dot animation (creating a loading effect)
      const animation = Animated.loop(
        Animated.timing(sharedValue, {
          toValue: 3,  // End value (dot cycle completes after 3 steps)
          duration: 1200, // Duration of one full cycle (in milliseconds)
          useNativeDriver: true,  // Optimizes performance by using native driver for animations
        })
      );
      animation.start();   // Start the animation when visible is true
      return () => animation.stop();  // Cleanup the animation when the component unmounts or visibility changes
    }
  }, [visible, sharedValue]);

  // Interpolating sharedValue to control opacity of the three dots
  const dot1Opacity = sharedValue.interpolate({
    inputRange: [0, 1, 3],  // Input range of the animation
    outputRange: [1, 0, 0],  // Output opacity values for each step
    extrapolate: 'clamp',  // Prevent values outside the input range
  });

  const dot2Opacity = sharedValue.interpolate({
    inputRange: [0, 1, 2, 3],  // Input range for the second dot
    outputRange: [0, 1, 0, 0],  // Opacity changes for each animation step
    extrapolate: 'clamp',  // Clamp values to input range
  });

  const dot3Opacity = sharedValue.interpolate({
    inputRange: [0, 2, 3],  // Input range for the third dot
    outputRange: [0, 0, 1],  // Opacity changes for each animation step
    extrapolate: 'clamp',  // Prevent values outside the input range
  });

  // SVG logo definition for the loader, to be used as an icon during loading

  const logo = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" stroke="#f7f1e3" stroke-width="2">
      <path d="m6.667 33.334 16.667-16.667m0 0V8.333L16.667 15m6.667 1.667h8.333m-15-1.667v8.334H25M16.667 15 10 21.667V30h8.334"></path>
      <path d="M23.333 8.333c1.06-1.055 2.522-1.667 4.138-1.667a5.859 5.859 0 0 1 5.862 5.857c0 1.619-.603 3.084-1.667 4.143L25 23.334 18.333 30"></path>
    </svg>
  `;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.loader}>
          <SvgXml xml={logo} width="40" height="40" />
          <View style={styles.textContainer}>
            <Text style={styles.text}>{message}</Text>
            <View style={styles.dotsContainer}>
              <Animated.Text style={[styles.dot, { opacity: dot1Opacity }]}>
                .
              </Animated.Text>
              <Animated.Text style={[styles.dot, { opacity: dot2Opacity }]}>
                .
              </Animated.Text>
              <Animated.Text style={[styles.dot, { opacity: dot3Opacity }]}>
                .
              </Animated.Text>
            </View>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loader: {
    width: 150,
    padding: 20,
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    color: '#ddd',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 2,
  },
  dot: {
    fontSize: 16,
    color: '#ddd',
    marginLeft: 2,
  },
});

export default Loader;
