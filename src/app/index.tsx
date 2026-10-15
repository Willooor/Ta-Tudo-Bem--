import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';

import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleLogin() {
  if (!email || !senha) {
    Alert.alert('Atenção', 'Preencha email e senha.');
    return;
  }
  setCarregando(true);
  try {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    if (!credencial.user.emailVerified) {
      Alert.alert('Email não verificado', 'Verifique seu email antes de entrar.');
      return;
    }
    if (lembrar) {
      await AsyncStorage.setItem('email_salvo', email);
      await AsyncStorage.setItem('lembrar', 'true');
    } else {
      await AsyncStorage.removeItem('email_salvo');
      await AsyncStorage.removeItem('lembrar');
    }
    router.replace('/tabs/home');
  } catch (error: any) {
    Alert.alert('Erro', 'Email ou senha incorretos.');
  } finally {
    setCarregando(false);
  }
}

useEffect(() => {
  async function carregarEmail() {
    const emailSalvo = await AsyncStorage.getItem('email_salvo');
    const lembrarSalvo = await AsyncStorage.getItem('lembrar');
    if (emailSalvo && lembrarSalvo === 'true') {
      setEmail(emailSalvo);
      setLembrar(true);
    }
  }
  carregarEmail();
}, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
         <Image
              source={require('@/imagens/robo_reto.jpeg')}
              style={styles.roboImagem}
            />
        </View>
        <Text style={styles.logoTitle}>Tá tudo bem?</Text>
        <Text style={styles.logoSub}>Às vezes, só escrever o que pensa é o melhor remédio.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seuemail@exemplo.com"
          placeholderTextColor="#a0b8bf"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

      <Text style={styles.label}>Senha</Text>
<View style={styles.inputRow}>
  <TextInput
    style={[styles.inputSemBorda, { flex: 1 }]}  
    placeholder="••••••••"
    placeholderTextColor="#a0b8bf"
    value={senha}
    onChangeText={setSenha}
    secureTextEntry ={!mostrarSenha}
  />
  <TouchableOpacity style={styles.olhinho} onPress={() => setMostrarSenha(!mostrarSenha)}>
    <Image
      source={mostrarSenha ? require('@/imagens/olho.jpeg') : require('@/imagens/olho_fechado.jpeg')}
      style={{ width: 24, height: 24 }}
    />
  </TouchableOpacity>
</View>
        <TouchableOpacity
          style={styles.lembrarRow}
          onPress={() => setLembrar(!lembrar)}
        >
          <View style={[styles.checkbox, lembrar && styles.checkboxAtivo]}>
            {lembrar && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.lembrarText}>Lembre-se de mim</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleLogin}
          disabled={carregando}
        >
          <Text style={styles.btnPrimaryText}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.linkText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/cadastro')}>
          <Text style={styles.linkText}>
            Não possui uma conta?{' '}
            <Text style={styles.linkDestaque}>Registre-se.</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => router.push('/sobre')}
  style={{ marginTop: 16, alignSelf: 'center', padding: 10 }}
>
  <Text style={{ fontSize: 14, color: '#5a8a96' }}>
     <Text style={{ fontWeight: 'bold', color: '#2a6b7c' }}>Sobre o APP</Text>
  </Text>
</TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  inputSemBorda: {
  padding: 12,
  fontSize: 15,
  color: '#2a6b7c',
},
  container: {
    flex: 1,
    backgroundColor: '#dff0f4',
    padding: 24,
    justifyContent: 'center',
  },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoIcon: {
    width: 78, height: 78, borderRadius: 36,
    backgroundColor: '#b6dae0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, elevation: 4,
  },
  logoEmoji: { fontSize: 36 },
  logoTitle: { fontSize: 28, fontWeight: '600', color: '#2a6b7c' },
  logoSub: { fontSize: 14, color: '#5a8a96', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#f0f8fa', borderRadius: 20, padding: 24,
    elevation: 3,
  },
  label: { fontSize: 13, color: '#5a8a96', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#b6dae0', borderRadius: 12,
    padding: 12, fontSize: 15, marginBottom: 16,
    backgroundColor: '#ffffff', color: '#2a6b7c',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#b6dae0', borderRadius: 12,
    backgroundColor: '#ffffff', marginBottom: 16,
  },
  olhinho: { padding: 12 },
  lembrarRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, gap: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#b6dae0',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  checkboxAtivo: { backgroundColor: '#b6dae0', borderColor: '#8bb8c2' },
  checkmark: { color: '#2a6b7c', fontSize: 14, fontWeight: '700' },
  lembrarText: { fontSize: 13, color: '#5a8a96' },
  btnPrimary: {
    backgroundColor: '#b6dae0', borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 4, marginBottom: 12, elevation: 3,
  },
  btnPrimaryText: { color: '#2a6b7c', fontSize: 15, fontWeight: '600' },
  linkText: { color: '#4a8a96', fontSize: 13, textAlign: 'center', marginTop: 8 },
  linkDestaque: { color: '#2a6b7c', fontWeight: '700' },
  roboImagem: { width: 72, height: 72, borderRadius: 36 },
});