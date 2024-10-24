import React, { forwardRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Button ,Keyboard} from 'react-native';
import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import { RadioButton } from 'react-native-paper';
import AudioRecorder from './AudioRecorder';

interface CustomBottomSheetProps extends Omit<BottomSheetProps, 'children'> {
  bottomSheetIndex: number;
  onOptionSelect: (option: string) => void;
  selectedOption: string;
}

const CustomBottomSheet = forwardRef<BottomSheet, CustomBottomSheetProps>(
  ({ bottomSheetIndex, onOptionSelect, selectedOption, ...props }, ref) => {
    const [isPortrait, setIsPortrait] = useState(true);
    const [snapPoints, setSnapPoints] = useState(['10%', '48%']);

    useEffect(() => {
      const updateOrientation = () => {
        const { width, height } = Dimensions.get('window');
        const newIsPortrait = height > width;
        setIsPortrait(newIsPortrait);
        setSnapPoints(newIsPortrait ? ['10%', '48%'] : ['15%', '70%']);
      };

      const subscription = Dimensions.addEventListener('change', updateOrientation);
      updateOrientation();

      return () => subscription?.remove();
    }, []);

    const renderOption = (option: string) => (
      <TouchableOpacity
        key={option}
        style={styles.optionRow}
        onPress={() =>{
            Keyboard.dismiss();  // Dismiss the keyboard
            onOptionSelect(option);
          }}
     
      >
        <RadioButton
          value={option}
          status={selectedOption === option ? 'checked' : 'unchecked'}
          onPress={() => onOptionSelect(option)}
          color='#227093'
        />
        <Text style={styles.optionText}>{option}</Text>
        <AudioRecorder/>
      </TouchableOpacity>
    );

    const renderCollapsedView = () => (
      <View style={styles.collapsedView}>
        {/* Show A without radio button when collapsed */}
        {/* <Text style={styles.collapsedOptionText}>A</Text> */}
        <AudioRecorder />
        {/* Confirm button on the right side */}
        {/* <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            // Handle confirmation
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
          <Text style={styles.checkmarkText}>✓</Text>
        </TouchableOpacity> */}
      </View>
    );

    const renderExpandedView = () => (
      <View
        style={[
          styles.bottomSheetContent,
          isPortrait ? {} : styles.bottomSheetContentLandscape,
        ]}
      >
        <View
          style={[
            styles.optionsContainer,
            isPortrait ? {} : styles.optionsContainerLandscape,
          ]}
        >
          {['A', 'B', 'C'].map(renderOption)}
        </View>
        {/* Confirm button at the bottom when expanded */}
        <TouchableOpacity
          style={[styles.confirmButton, {margin:'auto'},!isPortrait && styles.confirmButtonLandscape]}
          onPress={() => {
            // Handle confirmation
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
          <Text style={styles.checkmarkText}>✓</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <BottomSheet
        ref={ref}
        index={bottomSheetIndex}
        snapPoints={snapPoints}
        style={styles.bottomSheet}
        {...props}
      >
        {/* Conditionally render based on bottom sheet state */}
        {bottomSheetIndex === 0 ? renderCollapsedView() : renderExpandedView()}
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    // borderTopWidth:1,
    // borderTopColor:'#ddd',
    // // borderTopLeftRadius:4,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.5,
    // shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetContent: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor: '#dff9fb',
  },
  bottomSheetContentLandscape: {
    flexDirection: 'row', // Two columns in landscape
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align content at the top
    padding: 16, // Adjust padding for landscape view
  },
  optionsContainer: {
    width: '100%',
  },
  optionsContainerLandscape: {
    width: '70%', // 70% for radio button options in landscape mode
  },
  collapsedView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
     paddingHorizontal:6,
    backgroundColor: '#ffffff',
    // paddingBottom: 4,
    // borderWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  collapsedOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  confirmButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    //  margin: 'auto',
  },
  confirmButtonLandscape: {
    width: '25%',
    alignSelf: 'flex-end',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 20,
  },
  optionRow: {
    width: '100%',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#2980b9',
  },
});

export default CustomBottomSheet;
