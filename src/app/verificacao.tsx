import { auth } from '@/config/firebase';
import { router } from 'expo-router';
import { sendEmailVerification } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';



export default function VerificacaoScreen() {
  const user = auth.currentUser;
  const [contador, setContador] = useState(0);
  const [mensagem, setMensagem] = useState<{texto: string; tipo: 'sucesso' | 'erro' | 'aviso'} | null>(null);

  useEffect(() => {
    if (contador <= 0) return;
    const timer = setInterval(() => {
      setContador(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [contador]);

  function mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro' | 'aviso') {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 3500);
  }

  async function handleReenviar() {
    if (!user || contador > 0) return;
    try {
      await sendEmailVerification(user);
      setContador(60);
      mostrarMensagem('Email enviado! Verifique também a pasta de spam.', 'sucesso');
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        setContador(120);
        mostrarMensagem('Aguarde alguns minutos antes de reenviar.', 'aviso');
      } else {
        mostrarMensagem('Não foi possível reenviar. Tente mais tarde.', 'erro');
      }
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
      mostrarMensagem('Seu email ainda não foi verificado. Clique no link enviado.', 'aviso');
    }
  }

  return (
    <View style={styles.container}>
      {mensagem && (
        <View style={[styles.toast, mensagem.tipo === 'sucesso' ? styles.toastSucesso : mensagem.tipo === 'erro' ? styles.toastErro : styles.toastAviso]}>
          <Text style={styles.toastTexto}>{mensagem.texto}</Text>
        </View>
      )}

      <View style={styles.logoIcon}>
        <Text style={styles.logoEmoji}>✉️</Text>
      </View>

      <Text style={styles.titulo}>Confirme seu email</Text>
      <Text style={styles.descricao}>
        Enviamos um link de confirmação para{'\n'}
        <Text style={styles.email}>{user?.email}</Text>
        {'\n\n'}
        Clique no link para ativar sua conta.{'\n'}
        Não encontrou? Verifique o spam.
      </Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleJaVerifiquei}>
        <Text style={styles.btnPrimaryText}>Já confirmei, entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnSecundario, contador > 0 && styles.btnDesabilitado]}
        onPress={handleReenviar}
        disabled={contador > 0}
      >
        <Text style={styles.btnSecundarioText}>
          {contador > 0 ? `Reenviar em ${contador}s` : 'Reenviar email'}
        </Text>
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
  toast: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    borderRadius: 12,
    padding: 14,
    zIndex: 99,
  },
  toastSucesso: {
    backgroundColor: '#b6dae0',
    borderWidth: 0.5,
    borderColor: '#8bb8c2',
  },
  toastAviso: {
    backgroundColor: '#fde9b0',
    borderWidth: 0.5,
    borderColor: '#e8c96a',
  },
  toastErro: {
    backgroundColor: '#f5c4c4',
    borderWidth: 0.5,
    borderColor: '#e08a8a',
  },
  toastTexto: {
    fontSize: 13,
    color: '#2a6b7c',
    textAlign: 'center',
  },
  logoIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#b6dae0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  btnDesabilitado: {
    opacity: 0.5,
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