import React, {useState, useEffect} from 'react';
import {Image, Text} from 'react-native';
import {View, Switch, StyleSheet} from 'react-native';
import {useColorScheme} from 'react-native';

interface ToggleButtonProps {
  onToggle: (isDarkMode: boolean) => void;
}

const DarkLightToggle: React.FC<ToggleButtonProps> = ({onToggle}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
    onToggle(!isDarkMode);
  };

  return (
    <View style={styles.main}>
      <View
        style={[
          styles.container,
          {backgroundColor: isDarkMode ? '#000' : '#fff'},
        ]}>
        {/* <Text style={styles.label}>Light Mode</Text> */}
        {isDarkMode ? (
          <Text style={styles.text}>Light</Text>
        ) : (
          <Image
            source={require('../assets/images/sun.png')}
            style={styles.icon}
          />
        )}
        <Switch
          value={isDarkMode}
          onValueChange={handleToggle}
          trackColor={{false: '#767577', true: '#d1ccc0'}}
          thumbColor={isDarkMode ? '#0984e3' : '0984e3'}
          style={styles.toggle}
        />
        {/* <Text style={styles.label}>Dark Mode</Text> */}

        {isDarkMode ? (
          <>
            <Image
              source={require('../assets/images/moon1.png')}
              style={styles.icon}
            />
          </>
        ) : (
          <Text style={styles.text}>Dark</Text>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  main: {
    // width: '100%',
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    // alignItems: 'center',
    marginTop: 30,
    height: 50,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    // backgroundColor:{isDar '#fff'},
    width: '75%',
    maxWidth: 150,
    borderRadius: 20,
  },
  label: {
    fontSize: 16,
    color: 'white',
  },
  toggle: {
    transform: [{scaleX: 1.0}, {scaleY: 1.0}],

  },
  icon: {
    width: 31,
    height: 31,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  text: {
    color: '#b2bec3',
    fontWeight: '500',
  },
});
export default DarkLightToggle;
