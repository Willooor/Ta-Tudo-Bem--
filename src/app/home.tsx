import { auth, db } from '@/config/firebase';
import { router, useFocusEffect } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTO = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DIAS_SEMANA_LABEL = ['D','S','T','Q','Q','S','S'];
const DIAS_SEMANA_FULL = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const hoje = new Date();

type Folha = {
  id: string;
  titulo: string;
  dataISO: string;
  favorita: boolean;
  ultimaAbertura: number;
  pin?: string;
};

type Ordenacao = 'recente' | 'favorita' | 'nome' | 'criacao';

const ORDEM_LABELS: Record<Ordenacao, string> = {
  recente: 'Abertura recente',
  favorita: 'Favoritas primeiro',
  nome: 'Nome (A-Z)',
  criacao: 'Data de criação',
};

export default function HomeScreen() {
  const [diaSel, setDiaSel] = useState(hoje.getDate());
  const [mesSel, setMesSel] = useState(hoje.getMonth());
  const [anoSel, setAnoSel] = useState(hoje.getFullYear());
  const [calAberto, setCalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'diario' | 'memorias' | 'hobbies'>('diario');
  const [fabAberto, setFabAberto] = useState(false);
  const [modoDelete, setModoDelete] = useState(false);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recente');
  const [ordenacaoAberta, setOrdenacaoAberta] = useState(false);
  const [folhas, setFolhas] = useState<Folha[]>([]);
  const [pinModalAberto, setPinModalAberto] = useState(false);
  const [folhaPendente, setFolhaPendente] = useState<Folha | null>(null);
  const [pinDigitado, setPinDigitado] = useState('');
  const [pinErro, setPinErro] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function buscarFolhas() {
        const usuario = auth.currentUser;
        if (!usuario) return;
        try {
          const snap = await getDocs(collection(db, 'usuarios', usuario.uid, 'folhas'));
          setFolhas(snap.docs.map(d => ({
            id: d.id,
            titulo: d.data().titulo || 'Sem título',
            dataISO: d.data().dataISO || '',
            favorita: d.data().favorita || false,
            ultimaAbertura: d.data().ultimaAbertura || 0,
            pin: d.data().pin || '',
          })));
        } catch (e) {
          console.log('Erro ao buscar folhas:', e);
        }
      }
      buscarFolhas();
    }, [])
  );

  const chave = `${anoSel}-${mesSel}-${diaSel}`;
  const nomeDia = DIAS_SEMANA_FULL[new Date(anoSel, mesSel, diaSel).getDay()];
  const dataFormatada = `${nomeDia}, ${diaSel} ${MESES_CURTO[mesSel]}`;

  const folhasDoDia = folhas
    .filter(f => f.dataISO === chave)
    .sort((a, b) => {
      if (a.favorita && !b.favorita) return -1;
      if (!a.favorita && b.favorita) return 1;
      if (ordenacao === 'recente') return b.ultimaAbertura - a.ultimaAbertura;
      if (ordenacao === 'nome') return a.titulo.localeCompare(b.titulo);
      if (ordenacao === 'criacao') return a.id.localeCompare(b.id);
      return 0;
    });

  function toggleFab() {
    if (modoDelete) { setModoDelete(false); setFabAberto(false); return; }
    setFabAberto(!fabAberto);
  }

  async function criarFolha() {
    const usuario = auth.currentUser;
    if (!usuario) return;
    const novoId = Date.now().toString();
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid, 'folhas', novoId), {
        titulo: 'Nova folha',
        conteudo: '',
        dataISO: chave,
        favorita: false,
        ultimaAbertura: Date.now(),
        criadaEm: Date.now(),
      });
      setFolhas(f => [...f, { id: novoId, titulo: 'Nova folha', dataISO: chave, favorita: false, ultimaAbertura: Date.now() }]);
      setFabAberto(false);
      router.push({ pathname: '/folha', params: { id: novoId, titulo: 'Nova folha', dataISO: chave } });
    } catch (e) {
      console.log('Erro ao criar folha:', e);
    }
  }

  async function deletarFolha(id: string) {
    const usuario = auth.currentUser;
    if (!usuario) return;
    try {
      await deleteDoc(doc(db, 'usuarios', usuario.uid, 'folhas', id));
      setFolhas(f => f.filter(x => x.id !== id));
    } catch (e) {
      console.log('Erro ao deletar:', e);
    }
  }

  async function toggleFavorita(id: string) {
    const usuario = auth.currentUser;
    if (!usuario) return;
    const folha = folhas.find(f => f.id === id);
    if (!folha) return;
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid, 'folhas', id), { favorita: !folha.favorita });
      setFolhas(f => f.map(x => x.id === id ? { ...x, favorita: !x.favorita } : x));
    } catch (e) {
      console.log('Erro ao favoritar:', e);
    }
  }

  async function abrirFolha(folha: Folha) {
    if (folha.pin) {
      setFolhaPendente(folha);
      setPinDigitado('');
      setPinErro(false);
      setPinModalAberto(true);
      return;
    }
    const usuario = auth.currentUser;
    if (!usuario) return;
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid, 'folhas', folha.id), { ultimaAbertura: Date.now() });
    } catch (e) {}
    router.push({ pathname: '/folha', params: { id: folha.id, titulo: folha.titulo, dataISO: folha.dataISO } });
  }

  async function confirmarPin() {
    if (!folhaPendente || pinDigitado !== folhaPendente.pin) {
      setPinErro(true);
      setPinDigitado('');
      return;
    }
    setPinModalAberto(false);
    const usuario = auth.currentUser;
    if (!usuario) return;
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid, 'folhas', folhaPendente.id), { ultimaAbertura: Date.now() });
    } catch (e) {}
    router.push({ pathname: '/folha', params: { id: folhaPendente.id, titulo: folhaPendente.titulo, dataISO: folhaPendente.dataISO } });
  }

  function renderCalendario() {
    const primeiro = new Date(anoSel, mesSel, 1).getDay();
    const total = new Date(anoSel, mesSel + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 0; i < primeiro; i++) dias.push(null);
    for (let d = 1; d <= total; d++) dias.push(d);
    return dias;
  }

  function mudarMes(dir: number) {
    let m = mesSel + dir, a = anoSel;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMesSel(m);
    setAnoSel(a);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setCalAberto(true)}>
          <Text style={styles.dataBtn}>{dataFormatada} ▾</Text>
        </TouchableOpacity>
        <Text style={styles.appTitulo}>Tá tudo bem?</Text>
      </View>

      {abaAtiva === 'diario' && (
        <TouchableOpacity style={styles.ordenacaoBtn} onPress={() => setOrdenacaoAberta(true)}>
          <Text style={styles.ordenacaoTexto}>↕ {ORDEM_LABELS[ordenacao]}</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {abaAtiva === 'diario' && (
          folhasDoDia.length > 0 ? (
            folhasDoDia.map((folha) => (
              <TouchableOpacity key={folha.id} style={styles.folha} onPress={() => !modoDelete && abrirFolha(folha)}>
                <View style={styles.folhaHeader}>
                  <Text style={styles.folhaTitulo}>{folha.titulo}</Text>
                  <View style={styles.folhaAcoes}>
                    {!modoDelete && (
                      <TouchableOpacity onPress={() => toggleFavorita(folha.id)}>
                        <Text style={styles.estrela}>{folha.favorita ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    )}
                    {!!folha.pin && <Text style={{ fontSize: 12 }}>🔒</Text>}
                    {modoDelete && (
                      <TouchableOpacity onPress={() => deletarFolha(folha.id)}>
                        <View style={styles.btnDel}>
                          <Text style={styles.btnDelTexto}>✕</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.folhaData}>{diaSel} {MESES_CURTO[mesSel]}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>📓</Text>
              <Text style={styles.vazioTexto}>Nenhuma folha neste dia</Text>
            </View>
          )
        )}
        {abaAtiva === 'memorias' && (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>📷</Text>
            <Text style={styles.vazioTexto}>Em breve</Text>
          </View>
        )}
        {abaAtiva === 'hobbies' && (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>✅</Text>
            <Text style={styles.vazioTexto}>Em breve</Text>
          </View>
        )}
      </ScrollView>

      {abaAtiva === 'diario' && (
        <View style={styles.fabArea}>
          {fabAberto && (
            <>
              <TouchableOpacity style={[styles.fabSub, modoDelete && styles.fabSubAtivo]} onPress={() => setModoDelete(!modoDelete)}>
                <Text style={styles.fabSubIcon}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabSub} onPress={criarFolha}>
                <Text style={styles.fabSubIcon}>✍️</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.fab} onPress={toggleFab}>
            <Text style={styles.fabIcon}>{fabAberto ? '✕' : '+'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.btn} onPress={() => setAbaAtiva('memorias')}>
          <Text style={[styles.btnIcon, abaAtiva === 'memorias' && styles.btnIconAtivo]}>📷</Text>
          <Text style={styles.btnLabel}>Memórias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setAbaAtiva('diario')}>
          <Text style={[styles.btnIcon, abaAtiva === 'diario' && styles.btnIconAtivo]}>📖</Text>
          <Text style={styles.btnLabel}>Diário</Text>
        </TouchableOpacity>
   <TouchableOpacity style={styles.btn} onPress={() => router.push('/hobbies')}>
  <Text style={[styles.btnIcon, abaAtiva === 'hobbies' && styles.btnIconAtivo]}>✅</Text>
  <Text style={styles.btnLabel}>Hobbies</Text>
</TouchableOpacity>
      </View>

      <Modal visible={calAberto} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setCalAberto(false)} />
        <View style={styles.cal}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => mudarMes(-1)}><Text style={styles.calNav}>‹</Text></TouchableOpacity>
            <Text style={styles.calMes}>{MESES[mesSel]} {anoSel}</Text>
            <TouchableOpacity onPress={() => mudarMes(1)}><Text style={styles.calNav}>›</Text></TouchableOpacity>
          </View>
          <View style={styles.calGrid}>
            {DIAS_SEMANA_LABEL.map((d, i) => (
              <Text key={i} style={styles.calDiaLabel}>{d}</Text>
            ))}
            {renderCalendario().map((d, i) => {
              const chaveD = `${anoSel}-${mesSel}-${d}`;
              const temFolha = d !== null && folhas.some(f => f.dataISO === chaveD);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.calDia, d === diaSel && styles.calDiaSel, temFolha && d !== diaSel && styles.calDiaTemFolha]}
                  onPress={() => { if (d) { setDiaSel(d); setCalAberto(false); } }}
                  disabled={!d}
                >
                  <Text style={[styles.calDiaText, d === diaSel && styles.calDiaTextSel, temFolha && styles.calDiaTextNegrito, !d && { opacity: 0 }]}>
                    {d ?? ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal visible={ordenacaoAberta} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setOrdenacaoAberta(false)} />
        <View style={styles.ordenacaoModal}>
          <Text style={styles.ordenacaoTitulo}>Ordenar por</Text>
          {(Object.keys(ORDEM_LABELS) as Ordenacao[]).map(op => (
            <TouchableOpacity key={op} style={[styles.ordenacaoOpcao, ordenacao === op && styles.ordenacaoOpcaoAtiva]} onPress={() => { setOrdenacao(op); setOrdenacaoAberta(false); }}>
              <Text style={[styles.ordenacaoOpcaoTexto, ordenacao === op && styles.ordenacaoOpcaoTextoAtivo]}>{ORDEM_LABELS[op]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal visible={pinModalAberto} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => { setPinModalAberto(false); setPinDigitado(''); setPinErro(false); }} />
        <View style={styles.pinContainer}>
          <TouchableOpacity onPress={() => { setPinModalAberto(false); setPinDigitado(''); setPinErro(false); }}>
            <View style={styles.pinBarra} />
          </TouchableOpacity>
          <View style={styles.pinHeader}>
            <Text style={styles.pinTitulo}>🔒 Folha protegida</Text>
            <TouchableOpacity onPress={() => { setPinModalAberto(false); setPinDigitado(''); setPinErro(false); }}>
              <Text style={styles.pinFechar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <Text style={styles.pinDescricao}>Digite o PIN para abrir "{folhaPendente?.titulo ?? ''}"</Text>
            <TextInput
              style={[styles.pinInput, pinErro && styles.pinInputErro]}
              value={pinDigitado}
              onChangeText={t => { setPinDigitado(t.replace(/\D/g, '').slice(0, 4)); setPinErro(false); }}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#a0b8bf"
              autoFocus
            />
            {pinErro && <Text style={styles.pinErroTexto}>PIN incorreto. Tente novamente.</Text>}
            <TouchableOpacity style={[styles.pinBtnConfirmar, pinDigitado.length !== 4 && { opacity: 0.5 }]} onPress={confirmarPin} disabled={pinDigitado.length !== 4}>
              <Text style={styles.pinBtnTexto}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPinModalAberto(false); setPinDigitado(''); }}>
              <Text style={styles.pinEsqueceu}>Esqueceu o PIN? ID da folha: {folhaPendente?.id ?? ''}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#dff0f4' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  dataBtn: { fontSize: 12, color: '#5a8a96', textDecorationLine: 'underline' },
  appTitulo: { fontSize: 16, fontWeight: '600', color: '#2a6b7c' },
  ordenacaoBtn: { paddingHorizontal: 20, paddingBottom: 8 },
  ordenacaoTexto: { fontSize: 11, color: '#5a8a96' },
  content: { flex: 1, paddingHorizontal: 20 },
  folha: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#b6dae0', marginBottom: 10 },
  folhaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  folhaTitulo: { fontSize: 14, fontWeight: '500', color: '#2a6b7c', flex: 1 },
  folhaAcoes: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  estrela: { fontSize: 16 },
  btnDel: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f5c4c4', alignItems: 'center', justifyContent: 'center' },
  btnDelTexto: { fontSize: 10, color: '#a32d2d' },
  folhaData: { fontSize: 11, color: '#5a8a96', marginTop: 4 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  vazioEmoji: { fontSize: 40, opacity: 0.4 },
  vazioTexto: { fontSize: 13, color: '#5a8a96', opacity: 0.6 },
  fabArea: { position: 'absolute', bottom: 90, right: 16, alignItems: 'center', gap: 10, zIndex: 99 },
  fabSub: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7ab8c8', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  fabSubAtivo: { backgroundColor: '#5a9aaa' },
  fabSubIcon: { fontSize: 18 },
  fab: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2a6b7c', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon: { color: '#fff', fontSize: 24, fontWeight: '300', textAlign: 'center', includeFontPadding: false },
  navbar: { backgroundColor: '#f0f8fa', borderTopWidth: 0.5, borderTopColor: '#b6dae0', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: 24 },
  btn: { alignItems: 'center', gap: 4 },
  btnIcon: { fontSize: 20, opacity: 0.4 },
  btnIconAtivo: { fontSize: 28, opacity: 1 },
  btnLabel: { fontSize: 10, color: '#5a8a96' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  cal: { position: 'absolute', top: 100, left: 20, right: 20, backgroundColor: '#f0f8fa', borderRadius: 16, borderWidth: 0.5, borderColor: '#b6dae0', padding: 16 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calMes: { fontSize: 14, fontWeight: '500', color: '#2a6b7c' },
  calNav: { fontSize: 20, color: '#5a8a96', paddingHorizontal: 8 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDiaLabel: { width: '14.28%', textAlign: 'center', fontSize: 11, color: '#5a8a96', paddingVertical: 4 },
  calDia: { width: '14.28%', alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  calDiaSel: { backgroundColor: '#2a6b7c' },
  calDiaTemFolha: { backgroundColor: '#2a6b7c', borderRadius: 8 },
  calDiaText: { fontSize: 12, color: '#2a6b7c' },
  calDiaTextSel: { color: '#fff', fontWeight: '600' },
  calDiaTextNegrito: { fontWeight: '700', color: '#fff' },
  ordenacaoModal: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: '#f0f8fa', borderRadius: 16, borderWidth: 0.5, borderColor: '#b6dae0', padding: 16 },
  ordenacaoTitulo: { fontSize: 13, fontWeight: '600', color: '#2a6b7c', marginBottom: 12 },
  ordenacaoOpcao: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  ordenacaoOpcaoAtiva: { backgroundColor: '#b6dae0' },
  ordenacaoOpcaoTexto: { fontSize: 13, color: '#5a8a96' },
  ordenacaoOpcaoTextoAtivo: { color: '#2a6b7c', fontWeight: '600' },
 pinContainer: { 
  position: 'absolute', 
  bottom: 0, 
  left: 0, 
  right: 0, 
  top: '50%',  // muda esse valor, quanto menor mais alto
  backgroundColor: '#f0f8fa',
  borderTopLeftRadius: 20, 
  borderTopRightRadius: 20,
  borderWidth: 0.5, 
  borderColor: '#b6dae0' 
},
  pinBarra: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#b6dae0', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  pinHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#b6dae0' },
  pinTitulo: { fontSize: 14, fontWeight: '600', color: '#2a6b7c' },
  pinFechar: { fontSize: 14, color: '#5a8a96' },
  pinDescricao: { fontSize: 13, color: '#5a8a96', textAlign: 'center' },
  pinInput: { borderWidth: 1, borderColor: '#b6dae0', borderRadius: 12, padding: 12, fontSize: 24, textAlign: 'center', backgroundColor: '#ffffff', color: '#2a6b7c' },
  pinInputErro: { borderColor: '#e08a8a', backgroundColor: '#fff5f5' },
  pinErroTexto: { fontSize: 12, color: '#a32d2d', textAlign: 'center' },
  pinBtnConfirmar: { backgroundColor: '#b6dae0', borderRadius: 12, padding: 14, alignItems: 'center' },
  pinBtnTexto: { color: '#2a6b7c', fontSize: 15, fontWeight: '600' },
  pinEsqueceu: { fontSize: 11, color: '#5a8a96', textAlign: 'center', marginTop: 4 },
});