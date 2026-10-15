import { auth, db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FaceDetection from '@react-native-ml-kit/face-detection';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const TAMANHO_FOTO = (width - 48) / 3;
const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

type Foto = {
  id: string;
  uri: string;
  data: string;
  mes: string;
  ano: string;
};

type GrupoMes = {
  chave: string;
  label: string;
  fotos: Foto[];
};

export default function MemoriasScreen() {
  const [permissaoCamera, requestPermissaoCamera] = useCameraPermissions();
  const [permissaoGaleria, requestPermissaoGaleria] = MediaLibrary.usePermissions();
  const [modoCamera, setModoCamera] = useState(false);
  const [sorrindo, setSorrindo] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [fotoSelecionada, setFotoSelecionada] = useState<Foto | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<GrupoMes | null>(null);
  const [streak, setStreak] = useState(0);
  const [fotoParaExcluir, setFotoParaExcluir] = useState<Foto | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const tirouFotoRef = useRef(false);

  const usuario = auth.currentUser;
  const hoje = new Date();
  const mesAtual = `${hoje.getMonth()}-${hoje.getFullYear()}`;
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const fimDoMes = hoje.getDate() === ultimoDiaMes;

  
  useFocusEffect(
    useCallback(() => {
      buscarFotos();
      calcularStreak();
    }, [])
  );

  useEffect(() => {
    if (!modoCamera) return;
    tirouFotoRef.current = false;
    const intervalo = setInterval(async () => {
      if (tirouFotoRef.current || !cameraRef.current) return;
      try {
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (!foto) return;
        const faces = await FaceDetection.detect(foto.uri, {
          performanceMode: 'fast',
          classificationMode: 'all',
        });
        if (faces.length > 0) {
          const sorriso = (faces[0].smilingProbability ?? 0) > 0.7;
          setSorrindo(sorriso);
          if (sorriso && !tirouFotoRef.current) {
            tirouFotoRef.current = true;
            clearInterval(intervalo);
            setFotoPreview(foto.uri);
            setModoCamera(false);
            setSorrindo(false);
          }
        }
      } catch (e) {
        console.log('Erro detecção:', e);
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [modoCamera]);

  async function calcularStreak() {
    try {
      const ultimoDia = await AsyncStorage.getItem('memorias_ultimo_dia');
      const streakAtual = parseInt(await AsyncStorage.getItem('memorias_streak') || '0');
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      if (ultimoDia === hoje.toDateString() || ultimoDia === ontem.toDateString()) {
        setStreak(streakAtual);
      } else {
        setStreak(0);
      }
    } catch (e) {}
  }

  async function atualizarStreak() {
    try {
      const ultimoDia = await AsyncStorage.getItem('memorias_ultimo_dia');
      const streakAtual = parseInt(await AsyncStorage.getItem('memorias_streak') || '0');
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const hojeStr = hoje.toDateString();
      if (ultimoDia === hojeStr) return;
      const novoStreak = ultimoDia === ontem.toDateString() ? streakAtual + 1 : 1;
      await AsyncStorage.setItem('memorias_streak', String(novoStreak));
      await AsyncStorage.setItem('memorias_ultimo_dia', hojeStr);
      setStreak(novoStreak);
    } catch (e) {}
  }

  async function buscarFotos() {
    if (!usuario) return;
    try {
      const snap = await getDocs(
        query(collection(db, 'usuarios', usuario.uid, 'memorias'), orderBy('criadaEm', 'desc'))
      );
      setFotos(snap.docs.map(d => ({
        id: d.id,
        uri: d.data().uri,
        data: d.data().data,
        mes: d.data().mes,
        ano: d.data().ano,
      })));
    } catch (e) {
      console.log('Erro ao buscar fotos:', e);
    }
  }

  async function confirmarFoto() {
    if (!fotoPreview || !usuario) return;
    try {
      const agora = new Date();
      const dataStr = agora.toLocaleDateString('pt-BR');
      const mes = String(agora.getMonth());
      const ano = String(agora.getFullYear());
      await addDoc(collection(db, 'usuarios', usuario.uid, 'memorias'), {
        uri: fotoPreview,
        data: dataStr,
        mes,
        ano,
        criadaEm: Date.now(),
      });
      setFotos(f => [{ id: Date.now().toString(), uri: fotoPreview!, data: dataStr, mes, ano }, ...f]);
      await atualizarStreak();
      setFotoPreview(null);
    } catch (e) {
      console.log('Erro ao salvar foto:', e);
    }
  }

  async function abrirCamera() {
    if (fimDoMes) {
      Alert.alert('Mês encerrado!', 'O mês acabou! Veja sua colagem mensal.');
      return;
    }
    if (!permissaoCamera?.granted) {
      const result = await requestPermissaoCamera();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera.');
        return;
      }
    }
    if (!permissaoGaleria?.granted) await requestPermissaoGaleria();
    tirouFotoRef.current = false;
    setModoCamera(true);
  }

  async function excluirFoto(foto: Foto) {
    if (!usuario) return;
    try {
      await deleteDoc(doc(db, 'usuarios', usuario.uid, 'memorias', foto.id));
      setFotos(f => f.filter(x => x.id !== foto.id));
      if (mesSelecionado) {
        setMesSelecionado(m => m ? { ...m, fotos: m.fotos.filter(x => x.id !== foto.id) } : null);
      }
      setFotoParaExcluir(null);
    } catch (e) {
      console.log('Erro ao excluir foto:', e);
    }
  }

  async function compartilharFoto(uri: string) {
    try {
      await Share.share({ url: uri, message: 'Minha memória do dia! 😊' });
    } catch (e) {
      console.log('Erro ao compartilhar:', e);
    }
  }

  function agruparPorMes(): GrupoMes[] {
    const grupos: Record<string, GrupoMes> = {};
    fotos.forEach(f => {
      const chave = `${f.mes}-${f.ano}`;
      if (!grupos[chave]) {
        grupos[chave] = { chave, label: `${MESES_NOMES[parseInt(f.mes)]} ${f.ano}`, fotos: [] };
      }
      grupos[chave].fotos.push(f);
    });
    return Object.values(grupos).sort((a, b) => b.chave.localeCompare(a.chave));
  }

  const grupos = agruparPorMes();

  if (modoCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraFrame} />
          <Text style={styles.cameraInstrucao}>
            {sorrindo ? '😊 Sorrindo! Capturando...' : '😐 Sorria pra tirar a foto!'}
          </Text>
          <TouchableOpacity style={styles.btnFecharCamera} onPress={() => setModoCamera(false)}>
            <Text style={styles.btnFecharCameraTexto}>✕ Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (fotoPreview) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitulo}>Ficou bom? 😊</Text>
          <View style={styles.polaroid}>
            <Image source={{ uri: fotoPreview }} style={styles.polaroidFoto} />
            <Text style={styles.polaroidData}>{hoje.toLocaleDateString('pt-BR')}</Text>
          </View>
          <View style={styles.previewBtns}>
            <TouchableOpacity style={styles.btnDescartar} onPress={() => { setFotoPreview(null); tirouFotoRef.current = false; }}>
              <Text style={styles.btnDescartarTexto}>Tirar outra</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarFoto}>
              <Text style={styles.btnConfirmarTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnExcluirPreview} onPress={() => setFotoPreview(null)}>
            <Text style={styles.btnExcluirPreviewTexto}>Descartar foto</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mesSelecionado) {
    const ehMesAtual = mesSelecionado.chave === mesAtual;
    return (
      <View style={styles.container}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => setMesSelecionado(null)}>
            <Text style={styles.voltar}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>{mesSelecionado.label}</Text>
          {ehMesAtual && !fimDoMes ? (
            <TouchableOpacity style={styles.btnCamera} onPress={abrirCamera}>
              <Text style={styles.btnCameraTexto}>📷</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {fimDoMes && ehMesAtual && (
          <View style={styles.fimDoMesBanner}>
            <Text style={styles.fimDoMesTexto}>🎉 Mês encerrado! {streak > 0 ? `🔥 ${streak} dias seguidos!` : ''}</Text>
          </View>
        )}

        <FlatList
          data={mesSelecionado.fotos}
          numColumns={3}
          keyExtractor={f => f.id}
          contentContainerStyle={styles.galeria}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFotoSelecionada(item)}
              onLongPress={() => setFotoParaExcluir(item)}
              delayLongPress={400}
            >
              <View style={styles.polaroidThumb}>
                <Image source={{ uri: item.uri }} style={styles.polaroidThumbFoto} />
                <Text style={styles.polaroidThumbData}>{item.data}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <Modal visible={!!fotoSelecionada} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setFotoSelecionada(null)} />
            {fotoSelecionada && (
              <View style={styles.modalCard}>
                <View style={styles.polaroidGrande}>
                  <Image source={{ uri: fotoSelecionada.uri }} style={styles.polaroidGrandeFoto} />
                  <Text style={styles.polaroidGrandeData}>{fotoSelecionada.data}</Text>
                </View>
               <View style={styles.modalBtns}>
  <TouchableOpacity style={styles.btnCompartilhar} onPress={() => compartilharFoto(fotoSelecionada.uri)}>
    <Text style={styles.btnCompartilharTexto}>Compartilhar</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.btnExcluirModal} 
    onPress={() => {
      setFotoSelecionada(null);
      setFotoParaExcluir(fotoSelecionada);
    }}
  >
    <Text style={styles.btnExcluirModalTexto}>Excluir</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.btnFecharModal} onPress={() => setFotoSelecionada(null)}>
    <Text style={styles.btnFecharModalTexto}>Fechar</Text>
  </TouchableOpacity>
</View>
              </View>
            )}
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setFotoSelecionada(null)} />
          </View>
        </Modal>

        <Modal visible={!!fotoParaExcluir} transparent animationType="slide">
          <TouchableOpacity style={styles.overlayExcluir} onPress={() => setFotoParaExcluir(null)} />
          <View style={styles.painelExcluir}>
            <View style={styles.painelBarra} />
            <TouchableOpacity style={styles.btnExcluir} onPress={() => fotoParaExcluir && excluirFoto(fotoParaExcluir)}>
              <Text style={styles.btnExcluirTexto}>Excluir foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancelarExcluir} onPress={() => setFotoParaExcluir(null)}>
              <Text style={styles.btnCancelarExcluirTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.titulo}>Memórias que Sorriem</Text>
      </View>

      {!fimDoMes && (
        <TouchableOpacity style={styles.bannerCamera} onPress={abrirCamera} activeOpacity={0.85}>
          <Image source={require('@/imagens/camera.png')} style={styles.bannerCameraIcon} />
          <View>
            <Text style={styles.bannerCameraTitulo}>Tirar foto do dia</Text>
            <Text style={styles.bannerCameraSubtitulo}>Sorria pra registrar esse momento! 😊</Text>
          </View>
        </TouchableOpacity>
      )}

      {fotos.length === 0 ? (
        <View style={styles.vazio}>
              <Image source={require('@/imagens/camera.png')} style={styles.diarioicone} />
          <Text style={styles.vazioTitulo}>Nenhuma memória ainda</Text>
          <Text style={styles.vazioTexto}>Sorria pra câmera e capture seus momentos felizes!</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16 }}
          directionalLockEnabled={true}
          nestedScrollEnabled={true}
        >
          {grupos.map(grupo => (
            <TouchableOpacity key={grupo.chave} style={styles.cardMes} onPress={() => setMesSelecionado(grupo)}>
              <View style={styles.cardMesHeader}>
                <Text style={styles.cardMesLabel}>{grupo.label}</Text>
                <Text style={styles.cardMesCount}>{grupo.fotos.length} foto{grupo.fotos.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.cardMesFotos}>
                {grupo.fotos.slice(0, 3).map(f => (
                  <Image key={f.id} source={{ uri: f.uri }} style={styles.cardMesFotoThumb} />
                ))}
                {grupo.fotos.length > 3 && (
                  <View style={styles.cardMesMais}>
                    <Text style={styles.cardMesMaisTexto}>+{grupo.fotos.length - 3}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btnExcluirModal: {  flex: 1, backgroundColor: '#fff5f5', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 0.5,  borderColor: '#e08a8a' },
btnExcluirModalTexto: {   color: '#a32d2d', fontWeight: '600' , fontSize: 19, justifyContent: 'center', alignItems: 'center', },
  container: { flex: 1, backgroundColor: '#dff0f4' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  titulo: { fontSize: 18, fontWeight: '600', color: '#2a6b7c', flex: 1, textAlign: 'center' },
  voltar: { fontSize: 16, color: '#5a8a96' },
  btnCamera: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#b6dae0', alignItems: 'center', justifyContent: 'center' },
  btnCameraTexto: { fontSize: 22 },
  diarioicone: {width: 128,  height: 128,opacity: 0.4,},
  bannerCamera: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#2a6b7c', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16 },
  bannerCameraEmoji: { fontSize: 36 },
  bannerCameraTitulo: { fontSize: 16, fontWeight: '600', color: '#fff' },
  bannerCameraSubtitulo: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  vazioEmoji: { fontSize: 56, opacity: 0.5 },
  vazioTitulo: { fontSize: 18, fontWeight: '600', color: '#2a6b7c' },
  vazioTexto: { fontSize: 14, color: '#5a8a96', textAlign: 'center', lineHeight: 22 },
  cardMes: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#b6dae0' },
  cardMesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardMesLabel: { fontSize: 16, fontWeight: '600', color: '#2a6b7c' },
  cardMesCount: { fontSize: 12, color: '#5a8a96' },
  cardMesFotos: { flexDirection: 'row', gap: 8 },
  cardMesFotoThumb: { width: (width - 104) / 4, height: (width - 104) / 4, borderRadius: 8 },
  cardMesMais: { width: (width - 104) / 4, height: (width - 104) / 4, borderRadius: 8, backgroundColor: '#dff0f4', alignItems: 'center', justifyContent: 'center' },
  cardMesMaisTexto: { fontSize: 16, color: '#2a6b7c', fontWeight: '600' },
  galeria: { padding: 16 },
  polaroidThumb: { backgroundColor: '#fff', padding: 4, paddingBottom: 8, borderRadius: 4, margin: 4, width: TAMANHO_FOTO, alignItems: 'center', elevation: 2 },
  polaroidThumbFoto: { width: TAMANHO_FOTO - 8, height: TAMANHO_FOTO - 8, borderRadius: 2 },
  polaroidThumbData: { fontSize: 8, color: '#5a8a96', marginTop: 4, fontStyle: 'italic' },
  cameraOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32, alignItems: 'center', gap: 16 },
  cameraFrame: { position: 'absolute', top: '20%', left: '15%', right: '15%', bottom: '30%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 120 },
  cameraInstrucao: { backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, textAlign: 'center' },
  btnFecharCamera: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  btnFecharCameraTexto: { color: '#fff', fontSize: 14 },
  previewContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  previewTitulo: { fontSize: 22, fontWeight: '600', color: '#2a6b7c' },
  polaroid: { backgroundColor: '#fff', padding: 12, paddingBottom: 24, borderRadius: 4, elevation: 4, alignItems: 'center' },
  polaroidFoto: { width: width - 96, height: width - 96, borderRadius: 2 },
  polaroidData: { fontSize: 14, color: '#5a8a96', marginTop: 12, fontStyle: 'italic' },
  previewBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  btnDescartar: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#b6dae0', alignItems: 'center' },
  btnDescartarTexto: { color: '#5a8a96', fontSize: 15 },
  btnConfirmar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#b6dae0', alignItems: 'center' },
  btnConfirmarTexto: { color: '#2a6b7c', fontSize: 15, fontWeight: '600' },
  fimDoMesBanner: { backgroundColor: '#b6dae0', padding: 12, alignItems: 'center' },
  fimDoMesTexto: { fontSize: 14, color: '#2a6b7c', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#f0f8fa', borderRadius: 20, padding: 16, alignItems: 'center', gap: 12, margin: 24 },
  polaroidGrande: { backgroundColor: '#fff', padding: 12, paddingBottom: 24, borderRadius: 4, alignItems: 'center', elevation: 3 },
  polaroidGrandeFoto: { width: width - 120, height: width - 120, borderRadius: 2 },
  polaroidGrandeData: { fontSize: 13, color: '#5a8a96', marginTop: 10, fontStyle: 'italic' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  btnCompartilhar: { flex: 1, backgroundColor: '#2a6b7c', borderRadius: 12, padding: 8, alignItems: 'center' },
  btnCompartilharTexto: { color: '#fff', fontWeight: '600', fontSize: 18, justifyContent: 'center', alignItems: 'center',  },
  btnFecharModal: { flex: 1, backgroundColor: '#b6dae0', borderRadius: 12, padding: 8, alignItems: 'center',  },
  btnFecharModalTexto: { color: '#2a6b7c', fontWeight: '600',  fontSize: 18, justifyContent: 'center', alignItems: 'center',  },
  overlayExcluir: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  painelExcluir: { backgroundColor: '#f0f8fa', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, gap: 12, alignItems: 'center' },
  painelBarra: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#b6dae0', marginBottom: 8 },
  btnExcluir: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff5f5', borderWidth: 0.5, borderColor: '#e08a8a' },
  btnExcluirTexto: { color: '#a32d2d', fontSize: 16, fontWeight: '600' },
  btnCancelarExcluir: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f0f8fa' },
  btnCancelarExcluirTexto: { color: '#5a8a96', fontSize: 15 },
  btnExcluirPreview: { marginTop: 4, padding: 10, alignItems: 'center', width: '70%', backgroundColor: '#e08a8a', borderWidth: 1, borderRadius: 12, borderColor: '#0000' },
  btnExcluirPreviewTexto: { color: '#131111', fontSize: 14 },
  bannerCameraIcon: { width: 50, height: 50},
});