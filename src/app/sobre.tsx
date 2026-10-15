import { router } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const EQUIPE = [
  { nome: 'Elana Fernandes', foto: require('@/imagens/marci.jpeg'), papel: 'Design' },
  { nome: 'Willian Diniz', foto: require('@/imagens/will.jpeg'), papel: 'Programação e idealizador do projeto' },
  { nome: 'Danillo Santos', foto: require('@/imagens/danillo.jpeg'), papel: 'Programação' },
];

export default function Sobre() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>

     <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: 36,
          left: 20,
          backgroundColor: '#2a6b7c',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
        }}
      >
         <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>‹ Voltar</Text>  
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Sobre o app</Text>
     <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 16 }}>
        {EQUIPE.map((pessoa) => (
          <View key={pessoa.nome} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
            <Image source={pessoa.foto} style={{ width: 120, height: 120, borderRadius: 64, marginTop: 130 }} />
            <Text style={{ fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginTop: 4 }}>{pessoa.nome}</Text>
            <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 4 }}>{pessoa.papel}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}