import { auth, db } from '@/config/firebase';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Formatacao = {
  negrito: boolean;
  italico: boolean;
  sublinhado: boolean;
  alinhamento: 'left' | 'center' | 'right';
  tamanho: number;
  lista: boolean;
};

export default function FolhaScreen() {
  const { id, titulo: tituloParam, dataISO } = useLocalSearchParams<{ id: string; titulo: string; dataISO: string }>();
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState(tituloParam || 'Nova folha');
  const [conteudo, setConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [fmt, setFmt] = useState<Formatacao>({
    negrito: false,
    italico: false,
    sublinhado: false,
    alinhamento: 'left',
    tamanho: 16,
    lista: false,
  });
  const [pickerAberto, setPickerAberto] = useState(false);
  const [senhaAtiva, setSenhaAtiva] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');

  const toastY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  const toastPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -5,
      onPanResponderMove: (_, g) => { if (g.dy < 0) toastY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) fecharToast();
        else Animated.spring(toastY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  function fecharToast() {
    Animated.timing(toastY, { toValue: -100, duration: 200, useNativeDriver: true }).start(() => {
      setMensagem(null);
      toastY.setValue(0);
    });
  }

  function mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro') {
    setMensagem({ texto, tipo });
    toastY.setValue(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fecharToast(), 3000);
  }

  useEffect(() => {
    async function carregarFolha() {
      const usuario = auth.currentUser;
      if (!usuario || !id) { setCarregando(false); return; }
      try {
        const ref = doc(db, 'usuarios', usuario.uid, 'folhas', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const dados = snap.data();
          setTitulo(dados.titulo || 'Nova folha');
          setConteudo(dados.conteudo || '');
          if (dados.formatacao) setFmt(dados.formatacao);
          if (dados.pin) setSenhaAtiva(true);
        }
      } catch (error) {
        console.log('Erro ao carregar folha:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregarFolha();
  }, [id]);

  const tamanhos = Array.from({ length: 99 }, (_, i) => i + 2);

  async function salvar() {
    const usuario = auth.currentUser;
    if (!usuario) {
      mostrarMensagem('Você precisa estar logado para salvar.', 'erro');
      return;
    }
    setSalvando(true);
    try {
      const ref = doc(db, 'usuarios', usuario.uid, 'folhas', id || Date.now().toString());
      const snap = await getDoc(ref);
      const dadosExistentes = snap.exists() ? snap.data() : {};
      await setDoc(ref, {
        ...dadosExistentes,
        titulo,
        conteudo,
        dataISO: dataISO || dadosExistentes.dataISO || new Date().toISOString().split('T')[0],
        formatacao: fmt,
        ultimaAbertura: Date.now(),
        criadaEm: dadosExistentes.criadaEm || Date.now(),
      });
      mostrarMensagem('Folha salva!', 'sucesso');
    } catch (error) {
      mostrarMensagem('Erro ao salvar. Tente novamente.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarPin() {
    if (pin.length !== 4) {
      mostrarMensagem('O PIN precisa ter 4 dígitos.', 'erro');
      return;
    }
    if (pin !== confirmarPin) {
      mostrarMensagem('Os PINs não coincidem.', 'erro');
      return;
    }
    const usuario = auth.currentUser;
    if (!usuario) return;
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid, 'folhas', id), { pin });
      setSenhaAtiva(true);
      setPin('');
      setConfirmarPin('');
      setPinModal(false);
      mostrarMensagem('PIN criado!', 'sucesso');
    } catch (error) {
      mostrarMensagem('Erro ao salvar PIN.', 'erro');
    }
  }

  async function removerPin() {
    const usuario = auth.currentUser;
    if (!usuario) return;
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid, 'folhas', id), { pin: '' });
      setSenhaAtiva(false);
      setPinModal(false);
      mostrarMensagem('PIN removido!', 'sucesso');
    } catch (error) {
      mostrarMensagem('Erro ao remover PIN.', 'erro');
    }
  }

  function toggleFmt(key: keyof Formatacao) {
    setFmt(f => ({ ...f, [key]: !f[key] }));
  }

  function setAlinhamento(al: 'left' | 'center' | 'right') {
    setFmt(f => ({ ...f, alinhamento: al }));
  }

  const estiloTexto: any = {
    fontWeight: fmt.negrito ? 'bold' : 'normal',
    fontStyle: fmt.italico ? 'italic' : 'normal',
    textDecorationLine: fmt.sublinhado ? 'underline' : 'none',
    textAlign: fmt.alinhamento,
    fontSize: fmt.tamanho,
    color: '#2a6b7c',
    lineHeight: fmt.tamanho * 1.5,
  };

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTexto}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mensagem && (
        <Animated.View
          style={[
            styles.toast,
            mensagem.tipo === 'sucesso' ? styles.toastSucesso : styles.toastErro,
            { transform: [{ translateY: toastY }] }
          ]}
          {...toastPan.panHandlers}
        >
          <Text style={styles.toastTexto}>{mensagem.texto}</Text>
          <Text style={styles.toastDica}>↑ arraste pra fechar</Text>
        </Animated.View>
      )}

      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={salvar} disabled={salvando}>
          <Text style={styles.salvar}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.titulo}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Título da folha"
        placeholderTextColor="#a0b8bf"
        maxLength={60}
      />

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, fmt.negrito && styles.toolBtnAtivo]}
          onPress={() => toggleFmt('negrito')}
        >
          <Text style={[styles.toolTexto, fmt.negrito && styles.toolTextoAtivo, { fontWeight: 'bold' }]}>N</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, fmt.italico && styles.toolBtnAtivo]}
          onPress={() => toggleFmt('italico')}
        >
          <Text style={[styles.toolTexto, fmt.italico && styles.toolTextoAtivo, { fontStyle: 'italic' }]}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, fmt.sublinhado && styles.toolBtnAtivo]}
          onPress={() => toggleFmt('sublinhado')}
        >
          <Text style={[styles.toolTexto, fmt.sublinhado && styles.toolTextoAtivo, { textDecorationLine: 'underline' }]}>S</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity
          style={[styles.toolBtn, fmt.alinhamento === 'left' && styles.toolBtnAtivo]}
          onPress={() => setAlinhamento('left')}
        >
          <Text style={styles.toolTexto}>≡</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, fmt.alinhamento === 'center' && styles.toolBtnAtivo]}
          onPress={() => setAlinhamento('center')}
        >
          <Text style={styles.toolTexto}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, fmt.alinhamento === 'right' && styles.toolBtnAtivo]}
          onPress={() => setAlinhamento('right')}
        >
          <Text style={styles.toolTexto}>↦</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity
          style={[styles.toolBtn, fmt.lista && styles.toolBtnAtivo]}
          onPress={() => toggleFmt('lista')}
        >
          <Text style={styles.toolTexto}>•≡</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.tamanhoBtn} onPress={() => setPickerAberto(true)}>
          <Text style={styles.tamanhoBtnTexto}>{fmt.tamanho}px</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity
          style={[styles.toolBtn, senhaAtiva && styles.toolBtnAtivo]}
          onPress={() => setPinModal(true)}
        >
          <Text style={styles.toolTexto}>{senhaAtiva ? '🔒' : '🔓'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.editor} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.editorInput, estiloTexto]}
          value={conteudo}
          onChangeText={setConteudo}
          placeholder="Escreva aqui..."
          placeholderTextColor="#a0b8bf"
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <Modal visible={pickerAberto} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setPickerAberto(false)} />
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitulo}>Tamanho da fonte</Text>
            <TouchableOpacity onPress={() => setPickerAberto(false)}>
              <Text style={styles.pickerFechar}>OK</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 60 }}>
            {tamanhos.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.pickerItem, fmt.tamanho === t && styles.pickerItemAtivo]}
                onPress={() => setFmt(f => ({ ...f, tamanho: t }))}
              >
                <Text style={[styles.pickerItemTexto, fmt.tamanho === t && styles.pickerItemTextoAtivo]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={pinModal} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => { setPinModal(false); setPin(''); setConfirmarPin(''); }} />
        <View style={styles.pinContainer}>
          <TouchableOpacity onPress={() => { setPinModal(false); setPin(''); setConfirmarPin(''); }}>
            <View style={styles.pinBarra} />
          </TouchableOpacity>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitulo}>{senhaAtiva ? 'PIN configurado' : 'Criar PIN'}</Text>
            <TouchableOpacity onPress={() => { setPinModal(false); setPin(''); setConfirmarPin(''); }}>
              <Text style={styles.pickerFechar}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            {senhaAtiva ? (
              <>
                <Text style={{ color: '#5a8a96', fontSize: 13, textAlign: 'center' }}>
                  Esta folha já tem um PIN. Deseja remover?
                </Text>
                <TouchableOpacity style={styles.btnRemoverPin} onPress={removerPin}>
                  <Text style={styles.btnRemoverPinTexto}>Remover PIN</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.labelPin}>PIN (4 dígitos)</Text>
                <TextInput
                  style={styles.inputPin}
                  value={pin}
                  onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  placeholder="••••"
                  placeholderTextColor="#a0b8bf"
                />
                <Text style={styles.labelPin}>Confirmar PIN</Text>
                <TextInput
                  style={styles.inputPin}
                  value={confirmarPin}
                  onChangeText={t => setConfirmarPin(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  placeholder="••••"
                  placeholderTextColor="#a0b8bf"
                />
                <TouchableOpacity style={styles.btnPinSalvar} onPress={salvarPin}>
                  <Text style={styles.btnPinSalvarTexto}>Criar PIN</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#dff0f4' },
  loadingContainer: { flex: 1, backgroundColor: '#dff0f4', alignItems: 'center', justifyContent: 'center' },
  loadingTexto: { fontSize: 14, color: '#5a8a96' },
  toast: { position: 'absolute', top: 56, left: 24, right: 24, borderRadius: 12, padding: 14, zIndex: 99 },
  toastSucesso: { backgroundColor: '#b6dae0', borderWidth: 0.5, borderColor: '#8bb8c2' },
  toastErro: { backgroundColor: '#f5c4c4', borderWidth: 0.5, borderColor: '#e08a8a' },
  toastTexto: { fontSize: 13, color: '#2a6b7c', textAlign: 'center' },
  toastDica: { fontSize: 10, color: '#5a8a96', textAlign: 'center', marginTop: 4 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  voltar: { fontSize: 16, color: '#5a8a96' },
  salvar: { fontSize: 14, color: '#2a6b7c', fontWeight: '600' },
  titulo: { fontSize: 20, fontWeight: '600', color: '#2a6b7c', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#b6dae0' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f0f8fa', borderBottomWidth: 0.5, borderBottomColor: '#b6dae0', gap: 4, flexWrap: 'wrap' },
  toolBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toolBtnAtivo: { backgroundColor: '#b6dae0' },
  toolTexto: { fontSize: 14, color: '#5a8a96' },
  toolTextoAtivo: { color: '#2a6b7c' },
  separador: { width: 0.5, height: 24, backgroundColor: '#b6dae0', marginHorizontal: 4 },
  tamanhoBtn: { paddingHorizontal: 8, height: 32, borderRadius: 8, backgroundColor: '#e0f0f4', alignItems: 'center', justifyContent: 'center' },
  tamanhoBtnTexto: { fontSize: 12, color: '#2a6b7c', fontWeight: '500' },
  editor: { flex: 1, padding: 20 },
  editorInput: { flex: 1, minHeight: 400 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  pickerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f0f8fa', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 0.5, borderColor: '#b6dae0', height: 300 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#b6dae0' },
  pickerTitulo: { fontSize: 14, fontWeight: '600', color: '#2a6b7c' },
  pickerFechar: { fontSize: 14, color: '#2a6b7c', fontWeight: '600' },
  pickerScroll: { flex: 1 },  
  pickerItem: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 16 },
  pickerItemAtivo: { backgroundColor: '#b6dae0' },
  pickerItemTexto: { fontSize: 16, color: '#5a8a96' },
  pickerItemTextoAtivo: { color: '#2a6b7c', fontWeight: '600' },
  pinContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, top: '25%', backgroundColor: '#f0f8fa', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 0.5, borderColor: '#b6dae0' },
  pinBarra: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#b6dae0', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  labelPin: { fontSize: 13, color: '#5a8a96', marginBottom: 4 },
  inputPin: { borderWidth: 1, borderColor: '#b6dae0', borderRadius: 12, padding: 12, fontSize: 24, textAlign: 'center', backgroundColor: '#ffffff', color: '#2a6b7c' },
  btnPinSalvar: { backgroundColor: '#b6dae0', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnPinSalvarTexto: { color: '#2a6b7c', fontSize: 15, fontWeight: '600' },
  btnRemoverPin: { backgroundColor: '#f5c4c4', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnRemoverPinTexto: { color: '#a32d2d', fontSize: 15, fontWeight: '600' },
});

