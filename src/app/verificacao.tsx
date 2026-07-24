import { router } from 'expo-router';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const auth = getAuth();

export default function VerificacaoScreen() {
  const user = auth.currentUser;

  async function handleReenviar() {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      Alert.alert('Email enviado!', 'Verifique sua caixa de entrada.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reenviar o email.');
    }
  }

  async function handleJaVerifiquei() {
    if (!user) {
      router.replace('/');
      return;
    }
    await user.reload();
    if (user.emailVerified) {
      router.replace('/home');
    } else {
      Alert.alert('Atenção', 'Seu email ainda não foi verificado. Verifique sua caixa de entrada.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoIcon}>
        <Text style={styles.logoEmoji}>✉️</Text>
      </View>

      <Text style={styles.titulo}>Confirme seu email</Text>
      <Text style={styles.descricao}>
        Enviamos um link de confirmação para{'\n'}
        <Text style={styles.email}>{user?.email}</Text>
        {'\n\n'}
        Clique no link para ativar sua conta.
      </Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleJaVerifiquei}>
        <Text style={styles.btnPrimaryText}>Já confirmei, entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecundario} onPress={handleReenviar}>
        <Text style={styles.btnSecundarioText}>Reenviar email</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/')}>
        <Text style={styles.linkText}>Voltar para o login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dff0f4',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#b6dae0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#8bb8c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2a6b7c',
    marginBottom: 16,
    textAlign: 'center',
  },
  descricao: {
    fontSize: 14,
    color: '#5a8a96',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  email: {
    fontWeight: '700',
    color: '#2a6b7c',
  },
  btnPrimary: {
    backgroundColor: '#b6dae0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
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
  btnSecundario: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#b6dae0',
    marginBottom: 12,
  },
  btnSecundarioText: {
    color: '#2a6b7c',
    fontSize: 15,
  },
  linkText: {
    color: '#4a8a96',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});