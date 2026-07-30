import { auth } from '@/config/firebase';
import { router } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
} from 'firebase/auth';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';


export default function CadastroScreen() {
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  async function handleCadastro() {
    if (!usuario || !email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 8) {
      Alert.alert('Atenção', 'A senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    setCarregando(true);
    try {
      const credencial = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(credencial.user, { displayName: usuario });
      await sendEmailVerification(credencial.user);
      router.replace('/verificacao');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este email já está cadastrado.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Erro', 'Email inválido.');
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>☀</Text>
          </View>
          <Text style={styles.logoTitle}>Criar conta</Text>
          <Text style={styles.logoSub}>Bem-vindo! Preencha os dados abaixo.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
  style={styles.input}
  placeholder="como quer ser chamado?"
  placeholderTextColor="#a0b8bf"
  value={usuario}
  onChangeText={setUsuario}
  maxLength={30}
/>
  
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
    style={[styles.input, { flex: 1, marginBottom: 0 }]}
    placeholder="mínimo 8 caracteres"
    placeholderTextColor="#a0b8bf"
    value={senha}
    onChangeText={setSenha}
    secureTextEntry={!mostrarSenha}
  />
  <TouchableOpacity style={styles.olhinho} onPress={() => setMostrarSenha(!mostrarSenha)}>
    <Text>{mostrarSenha ? '👁️' : '🙈'}</Text>
  </TouchableOpacity>
</View>

<Text style={styles.label}>Confirmar senha</Text>
<View style={styles.inputRow}>
  <TextInput
    style={[styles.input, { flex: 1, marginBottom: 0 }]}
    placeholder="repita a senha"
    placeholderTextColor="#a0b8bf"
    value={confirmarSenha}
    onChangeText={setConfirmarSenha}
    secureTextEntry={!mostrarConfirmarSenha}
  />
  <TouchableOpacity style={styles.olhinho} onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
    <Text>{mostrarConfirmarSenha ? '👁️' : '🙈'}</Text>
  </TouchableOpacity>
</View>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleCadastro}
            disabled={carregando}
          >
            <Text style={styles.btnPrimaryText}>
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>
              Já possui uma conta?{' '}
              <Text style={styles.linkDestaque}>Entrar.</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dff0f4',
  },
  inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#b6dae0',
  borderRadius: 12,
  backgroundColor: '#ffffff',
  marginBottom: 16,
},
olhinho: {
  padding: 12,
},
  scroll: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
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