import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import ListBiblePage from './ListBiblePage';
import ListAudioPage from './ListAudioPage';
import ImportResourcePage from './ImportResourcePage';
import {Portal, Provider} from 'react-native-paper';


  const ImportReferenceModal: React.FC = ({}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<
    'Audio' | 'Bible' | 'Collection'
  >('Audio');

  const addIcon = (isSelected: boolean) =>
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${
      isSelected ? 'white' : 'grey'
    }" aria-hidden="true" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>`;

  const renderSubTabs = () => (
    <View style={styles.subTabsContainer}>
      <TouchableOpacity
        style={[
          styles.subTabButton,
          selectedSubTab === 'Audio' && styles.activeSubTab,
        ]}
        onPress={() => setSelectedSubTab('Audio')}>
        <Text
          style={[
            styles.subTabText,
            selectedSubTab === 'Audio' && styles.activeSubTabText,
          ]}>
          Audio
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.subTabButton,
          selectedSubTab === 'Bible' && styles.activeSubTab,
        ]}
        onPress={() => setSelectedSubTab('Bible')}>
        <Text
          style={[
            styles.subTabText,
            selectedSubTab === 'Bible' && styles.activeSubTabText,
          ]}>
          Bible
        </Text>
      </TouchableOpacity>
     
      <TouchableOpacity
        style={[
          styles.subTabButton,
          selectedSubTab === 'Collection' && styles.activeSubTab,
        ]}
        onPress={() => setSelectedSubTab('Collection')}>
        <SvgXml
          xml={addIcon(selectedSubTab === 'Collection')}
          width="15"
          height="15"
        />
        <Text
          style={[
            styles.subTabText,
            selectedSubTab === 'Collection' && styles.activeSubTabText,
          ]}>
          Collection
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Provider>
     

      <View style={styles.modalContent}>
        <View style={styles.tabsWrapper}>
          <View style={styles.contentContainer}>
            {renderSubTabs()}
            <View style={styles.contentDisplayContainer}>
              {selectedSubTab === 'Bible' ? (
                <ListBiblePage />
              ) : selectedSubTab === 'Audio' ? (
                <ListAudioPage />
              ) : selectedSubTab === 'Collection' ? (
                <ImportResourcePage />
              ) : (
              
                <></>
              )}
            </View>
          </View>
        </View>
      </View>

      
    </Provider>
  );
};

const styles = StyleSheet.create({
 
  modalContent: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    width: '100%',
    height: '99%',
    flexDirection: 'row',
  },
  
  tabsWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 10,
  },
  subTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    // marginBottom: 10,
    paddingTop: 1,
    paddingLeft: 1,
    paddingRight: 1,

  },
  subTabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
  },
  activeSubTab: {
    backgroundColor: '#3498db',

  },
  subTabText: {
    fontSize: 16,
    color: '#fff',
    marginHorizontal: 2,
    fontWeight: '600',
  },
  activeSubTabText: {
    color: '#F8EFBA',
  },
  contentContainer: {
    flex: 1,
  },
  contentDisplayContainer: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderColor: '#ecf0f1',
  },
  contentText: {
    fontSize: 18,
    color: '#2980b9',
    textAlign: 'center',
  },
});

export default ImportReferenceModal;
