import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {Directions} from 'react-native-gesture-handler';
import {Button, Checkbox} from 'react-native-paper';
// import SelectDropdown from 'react-native-select-dropdown';
import {SvgXml} from 'react-native-svg';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import {Dropdown} from 'react-native-element-dropdown';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {MultiSelect} from 'react-native-element-dropdown'; // Assuming you are using a library like this
import langNames from '../utils/langNames.json';

const ImportResourcePage: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [languageOptions, setLanguageOptions] = useState<
    {label: string; value: string}[]
  >([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // For multiple selection
  const typeOptions = [
    {label: 'Aligned Bible', value: 'Aligned Bible'},
    {label: 'Bible', value: 'Bible'},
  ];
  const [isPortrait, setIsPortrait] = useState(true);

  const downloadIcon =
    '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7L12 14M12 14L15 11M12 14L9 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17H12H8" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/></svg>';
  useEffect(() => {
    const options = langNames.map(lang => ({
      label: lang.ang !== '' ? lang.ang : lang.ln, // Use ln (language name) as the label
      value: lang.lc, // Use lc (language code) as the value
    }));
    setLanguageOptions(options);
  }, []);

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
  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(
          'https://git.door43.org/api/v1/catalog/search?metadataType=rc&metadataType=sb&lang=en&subject=Aligned%20Bible',
        );
        const data = await response.json();

        // Check if the response contains the array of resources
        if (Array.isArray(data.data)) {
          setResources(data.data);
        } else {
          setResources([]); // Default to empty array if no valid resources
        }
      } catch (error) {
        setError('Error fetching data');
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchResources();
  }, []);
  const handleClearSelection = () => {
    // Reset the checked states, selectedLanguage, and selectedTypes
    setChecked(false);
    setSelectedLanguages([]);
    setSelectedTypes([]);
  };
  const handleFilter = async () => {
    try {
      let baseUrl =
        'https://git.door43.org/api/v1/catalog/search?metadataType=rc&metadataType=sb';

      // Add languages
      selectedLanguages.forEach(lang => {
        baseUrl += `&lang=${lang}`;
      });

      // Add subjects
      selectedTypes.forEach(type => {
        baseUrl += `&subject=${encodeURIComponent(type)}`;
      });

      // If pre-release is checked, add stage=preprod
      if (checked) {
        baseUrl += '&stage=preprod';
      }

      // Make API call
      const response = await fetch(baseUrl);
      const data = await response.json();

      // Update resources with fetched data
      if (Array.isArray(data.data)) {
        setResources(data.data);
      } else {
        setResources([]); // Default to empty array if no valid resources
      }
    } catch (error) {
      console.error('Error fetching filtered resources:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Dropdowns */}
      <View style={styles.mainDropdownContainer}>
        <View
          style={[
            styles.dropdownContainer,
            {width: isPortrait ? '100%' : '45%'},
          ]}>
          {/* <Text style={styles.dropDownLabel}> Language</Text> */}
          <MultiSelect
            style={[styles.dropdown, {width: '100%'}]}
            data={languageOptions} // Data from the JSON
            search
            // inputSearchStyle={styles.inputSearchStyle}
            labelField="label" // Field for the label
            valueField="value" // Field for the value
            placeholder="Select Language" // Placeholder text
            searchPlaceholder="Search..." // Placeholder text for search
            value={selectedLanguages} // Selected values
            onChange={item => {
              setSelectedLanguages(item); // Update selected languages
            }}
            renderLeftIcon={() => (
              <AntDesign
                style={styles.icon}
                color="black"
                name="Safety"
                size={20}
              />
            )}
            // itemContainerStyle={styles.itemContainerStyle}
            itemTextStyle={styles.itemTextStyle}
            selectedStyle={styles.selectedStyle}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
          />
        </View>

        <View
          style={[
            styles.dropdownContainer,
            {width: isPortrait ? '100%' : '45%'},
          ]}>
          {/* <Text style={styles.dropDownLabel}> Type</Text> */}
          <MultiSelect
            style={[styles.dropdown, {width: '100%'}]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            // inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            // search
            data={typeOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Type"
            itemTextStyle={styles.itemTextStyle} // Custom item text style
            selectedStyle={styles.selectedStyle}
            // searchPlaceholder="Search..."
            activeColor="#ecf0f1"
            value={selectedTypes}
            onChange={item => {
              setSelectedTypes(item);
            }}
            renderLeftIcon={() => (
              <AntDesign
                style={styles.icon}
                color="black"
                name="Safety"
                size={20}
              />
            )}
          />
          {/* Display selected items */}
          {/* <Text style={styles.selectedItemsText}>
          Selected Types: {selectedTypes.join(', ')}
        </Text> */}
        </View>
      </View>
      <View style={styles.checkButtonsContainer}>
        <View style={styles.checkboxContainer}>
          <Text style={styles.dropDownLabel}>Pre-release</Text>
          <Checkbox
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => {
              setChecked(!checked);
            }}
            // color="#f6e58d"
          />
        </View>
        <View
          style={{
            // borderWidth: 1,
            width: '50%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            // borderWidth: 1,
          }}>
          <Button
            mode="contained"
            onPress={() => handleClearSelection()}
            style={styles.buttonClear}
            buttonColor="#eb4d4b"
            textColor="#fff">
            Clear
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleFilter()}
            style={styles.buttonFilter}
            textColor="#fff"
            buttonColor="#6ab04c">
            Filter
          </Button>
        </View>
      </View>

      {/* Error Message */}
      {error && <Text style={{color: 'red'}}>{error}</Text>}

      {/* Loading Spinner */}
      {loading ? (
        <ActivityIndicator size="large" color="#1dd1a1" />
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>RESOURCE</Text>
            <Text style={styles.tableHeaderText}>TYPE</Text>
            <Text style={styles.tableHeaderText}>ORGANIZATION</Text>
            <Text style={styles.tableHeaderText}>VERSION/RELEASE</Text>
          </View>
          {/* {console.log(resources, 'resource')} */}
          {/* Display resources */}
          {resources.length > 0 ? (
            resources.map((resource, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowHighlighted,
                ]}>
                <Text style={styles.tableRowText}>{resource.name}</Text>
                <Text style={styles.tableRowText}>{resource.subject}</Text>
                <Text style={styles.tableRowText}>{resource.owner}</Text>
                <Text style={styles.tableRowText}>
                  {resource.release.published_at.substring(0, 10)} (
                  {resource.release.name})
                </Text>
                <TouchableOpacity style={styles.downloadButton}>
                  <SvgXml xml={downloadIcon} width={20} height={20} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text>No resources available</Text>
          )}
        </ScrollView>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    backgroundColor: '#fff',
    height: '100%',
  },
  buttonClear: {
    width: '45%',
    borderColor: '#ff7979',
    borderRadius: 4,
  },
  buttonFilter: {
    width: '45%',
    borderColor: '#badc58',
    borderRadius: 4,
  },
  checkButtonsContainer: {
    marginBottom: 4,
    // borderWidth: 1,
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // borderWidth: 1,
    width: '50%',
  },
  mainDropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  dropdownContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dropDownLabel: {
    color: '#000',
    padding: 5,
  },
  dropdownButtonStyle: {
    width: '100%',
    height: 40,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dropdownButtonTxtStyle: {
    fontSize: 14,
    color: '#495057',
  },
  dropdownButtonArrowStyle: {
    paddingHorizontal: 5,
  },
  dropdownMenuStyle: {
    // width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 5,
    backgroundColor: '#fff',
  },
  dropdown: {
    height: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#000',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 12,
    borderColor: '#E9ECEF',
    paddingHorizontal: 10,
    color: '#000',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  icon: {
    marginRight: 5,
  },
  itemTextStyle: {
    fontSize: 16,
    color: '#2980b9', // Text color for the items
  },
  selectedStyle: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 5,
  },
  selectedItemsText: {
    marginTop: 5,
    fontSize: 12,
    color: '#6c757d',
  },
  tableContainer: {
    // borderWidth: 1,
    borderTopColor: '#ddd',
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#2980b9',
    padding: 10,
    // marginLeft: 5,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: '25%',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    // flexWrap: 'wrap',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRowHighlighted: {
    backgroundColor: '#f0f0f0',
  },
  tableRowText: {
    flex: 1,
    flexWrap: 'wrap',
    color: '#000',
    minWidth: '10%',
    maxWidth: '25%',
    marginHorizontal: 5,
  },
  downloadButton: {
    alignContent: 'center',
    justifyContent: 'center',
  },
});

export default ImportResourcePage;
