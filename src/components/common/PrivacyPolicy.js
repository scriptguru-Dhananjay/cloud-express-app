import { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class TermService extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Privacy Policy</Text>
      </View>
    )
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center",     
  },

  text: {
    textAlign: "center",
  },
});