import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeaturesSection from './homeComponent/FeatureSection';
import GDPRSection from './homeComponent/GDPRSection';
import Hero from './homeComponent/hero';
import HowItWorks from './homeComponent/HowitWorks';


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
        
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        
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