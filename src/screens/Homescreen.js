import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import FeaturesSection from './homeComponent/FeatureSection';
import GDPRSection from './homeComponent/GDPRSection';
import Hero from './homeComponent/hero';
import HowItWorks from './homeComponent/HowitWorks';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
        
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <Header/>
        <Hero />
        <HowItWorks/>
        <FeaturesSection/>
        <GDPRSection/>
        
        

      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

  },
  container: {
    flex: 1,
    backgroundColor: '#262626'
  },
});