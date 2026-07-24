import { auth } from '@/config/firebase';
import { router } from 'expo-router';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAIoGfd_HFsRvrVSmimyvFfedelbzBqdz4",
  authDomain: "expotec-ta-tudo-bem.firebaseapp.com",
  projectId: "expotec-ta-tudo-bem",
  storageBucket: "expotec-ta-tudo-bem.firebasestorage.app",
  messagingSenderId: "272494947580",
  appId: "1:272494947580:web:e5efbf80e699f83556bb79"
};


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);

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
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Erro', 'Email ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>☀</Text>
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
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#a0b8bf"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dff0f4',
    padding: 24,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#b6dae0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#8bb8c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2a6b7c',
  },
  logoSub: {
    fontSize: 14,
    color: '#5a8a96',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f0f8fa',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#8bb8c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#5a8a96',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#b6dae0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    color: '#2a6b7c',
  },
  lembrarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#b6dae0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxAtivo: {
    backgroundColor: '#b6dae0',
    borderColor: '#8bb8c2',
  },
  checkmark: {
    color: '#2a6b7c',
    fontSize: 14,
    fontWeight: '700',
  },
  lembrarText: {
    fontSize: 13,
    color: '#5a8a96',
  },
  btnPrimary: {
    backgroundColor: '#b6dae0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    shadowColor: '#8bb8c2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#2a6b7c',
    fontSize: 15,
    fontWeight: '600',
  },
  linkText: {
    color: '#4a8a96',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  linkDestaque: {
    color: '#2a6b7c',
    fontWeight: '700',
  },
});