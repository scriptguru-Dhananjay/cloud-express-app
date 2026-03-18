import { Component } from 'react'
import { Text, View, StyleSheet } from 'react-native'

export default class TermService extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Terms and services</Text>
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