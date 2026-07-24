import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Bem-vindo! 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dff0f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: 24,
    color: '#2a6b7c',
    fontWeight: '600',
  },
});