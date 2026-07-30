import { auth } from '@/config/firebase';
import { OPENROUTER_API_KEY } from '@/config/openrouter';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const FRASES_DIA = [
  'Cada pequeno passo conta. Vai lá!',
  'Hoje é um ótimo dia pra fazer algo que você gosta!',
  'Cuidar de si mesmo é um ato de coragem.',
  'Você é capaz de mais do que imagina!',
  'Um hobby por dia mantém o estresse afastado.',
  'Faça algo hoje que seu eu do futuro vai agradecer.',
  'Pequenas conquistas constroem grandes resultados.',
];

type Etapa = 'inicial' | 'refinamento' | 'checklist';

type Item = {
  id: string;
  texto: string;
  marcado: boolean;
};

export default function HobbiesScreen() {
  const usuario = auth.currentUser;
  const nome = usuario?.displayName?.split(' ')[0] || 'você';
  const frase = FRASES_DIA[new Date().getDay() % FRASES_DIA.length];

  const [etapa, setEtapa] = useState<Etapa>('inicial');
  const [hobbie, setHobbie] = useState('');
  const [quantidade, setQuantidade] = useState(10);
  const [local, setLocal] = useState<'casa' | 'fora' | 'qualquer'>('qualquer');
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemFinal, setMensagemFinal] = useState('');
  const [modalFinal, setModalFinal] = useState(false);
async function chamarIA(prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
model: 'poolside/laguna-xs-2.1:free',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  console.log('Resposta OpenRouter:', JSON.stringify(data));
  return data.choices[0].message.content;
}
 const PALAVRAS_ALERTA = ['se cortar', 'me cortar', 'automutilação', 'me machucar', 'se machucar', 'suicídio', 'me matar', 'me suicidar'];

async function gerarChecklist() {
  if (!hobbie.trim()) return;
  
  const hobbieLower = hobbie.toLowerCase();
  const temAlerta = PALAVRAS_ALERTA.some(p => hobbieLower.includes(p));
  
  if (temAlerta) {
    setMensagemFinal('Percebi que você pode estar passando por um momento difícil. 💙\n\nVocê não está sozinho(a). Se precisar de apoio, o CVV atende 24h pelo número 188 ou pelo site cvv.org.br.\n\nEstou aqui se quiser conversar sobre outro hobbie.');
    setModalFinal(true);
    return;
  }

  setCarregando(true);
  try {
    const localTexto = local === 'casa' ? 'dentro de casa' : local === 'fora' ? 'fora de casa' : 'em qualquer lugar';
    const prompt = `Crie uma lista de ${quantidade} atividades curtas e práticas relacionadas ao hobbie: "${hobbie}". As atividades devem ser realizadas ${localTexto}. Responda APENAS com as atividades numeradas, uma por linha, sem introdução ou explicação. Exemplo:\n1. Atividade aqui\n2. Outra atividade`;
    const texto = await chamarIA(prompt);
    const linhas = texto.split('\n').filter((l: string) => l.trim());
    const novosItens = linhas.map((linha: string, i: number) => ({
      id: `${Date.now()}-${i}`,
      texto: linha.replace(/^\d+\.\s*/, '').trim(),
      marcado: false,
    }));
    setItens(novosItens);
    setEtapa('checklist');
  } catch (error) {
    console.log('Erro ao gerar checklist:', error);
  } finally {
    setCarregando(false);
  }
}
  async function finalizar() {
    setCarregando(true);
    try {
      const marcados = itens.filter(i => i.marcado).length;
      const total = itens.length;
      const prompt = `O usuário ${nome} fez um checklist de hobbies relacionado a "${hobbie}" e completou ${marcados} de ${total} itens. Escreva uma mensagem curta (máximo 3 frases) de incentivo e carinho em português. Se completou tudo, celebre muito! Se completou parcialmente, incentive a continuar. Se não completou nada, diga que já está orgulhoso só de ter tentado e que amanhã é um novo dia. Seja acolhedor e mencione o hobbie.`;
      const texto = await chamarIA(prompt);
      setMensagemFinal(texto);
      setModalFinal(true);
    } catch (error) {
      console.log('Erro ao finalizar:', error);
    } finally {
      setCarregando(false);
    }
  }

function toggleItem(id: string) {
  const atualizado = itens.map(i => i.id === id ? { ...i, marcado: !i.marcado } : i);
  setItens(atualizado);
  if (atualizado.every(i => i.marcado) && atualizado.length > 0) {
    finalizar();
  }
}

  function resetar() {
    setEtapa('inicial');
    setHobbie('');
    setItens([]);
    setMensagemFinal('');
    setModalFinal(false);
  }

  const marcados = itens.filter(i => i.marcado).length;
  const progresso = itens.length > 0 ? marcados / itens.length : 0;

  if (etapa === 'inicial') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={80}
      >
        <View style={styles.roboArea}>
          <View style={styles.roboBolinha}>
            <Text style={styles.roboEmoji}>🤖</Text>
          </View>
          <Text style={styles.saudacao}>Olá, {nome}! 👋</Text>
          <Text style={styles.frase}>{frase}</Text>
        </View>
        <View style={styles.inputArea}>
          <TextInput
            style={styles.inputHobbie}
            value={hobbie}
            onChangeText={setHobbie}
            placeholder="Me conta seus hobbies..."
            placeholderTextColor="#a0b8bf"
            multiline
          />
          <TouchableOpacity
            style={[styles.btnEnviar, !hobbie.trim() && { opacity: 0.4 }]}
            onPress={() => hobbie.trim() && setEtapa('refinamento')}
            disabled={!hobbie.trim()}
          >
            <Text style={styles.btnEnviarTexto}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (etapa === 'refinamento') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
        <View style={{ alignSelf: 'center', marginBottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#b6dae0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>🤖</Text>
        </View>
        <Text style={styles.tituloRefinamento}>Ótimo! Agora me conta mais...</Text>

        <Text style={styles.label}>Quantos itens você quer?</Text>
        <View style={styles.qtdRow}>
          {[5, 10, 15, 20].map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.qtdBtn, quantidade === q && styles.qtdBtnAtivo]}
              onPress={() => setQuantidade(q)}
            >
              <Text style={[styles.qtdBtnTexto, quantidade === q && styles.qtdBtnTextoAtivo]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Onde vai realizar?</Text>
        <View style={styles.localRow}>
          {[
            { valor: 'casa', emoji: '🏠', label: 'Em casa' },
            { valor: 'fora', emoji: '🌳', label: 'Fora' },
            { valor: 'qualquer', emoji: '🤷', label: 'Tanto faz' },
          ].map(op => (
            <TouchableOpacity
              key={op.valor}
              style={[styles.localBtn, local === op.valor && styles.localBtnAtivo]}
              onPress={() => setLocal(op.valor as 'casa' | 'fora' | 'qualquer')}
            >
              <Text style={styles.localEmoji}>{op.emoji}</Text>
              <Text style={[styles.localTexto, local === op.valor && styles.localTextoAtivo]}>{op.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnGerar, carregando && { opacity: 0.6 }]}
          onPress={gerarChecklist}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#2a6b7c" />
          ) : (
            <Text style={styles.btnGerarTexto}>Gerar checklist ✨</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnVoltar} onPress={() => setEtapa('inicial')}>
          <Text style={styles.btnVoltarTexto}>‹ Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.checklistHeader}>
        <TouchableOpacity onPress={() => setEtapa('refinamento')}>
          <Text style={styles.linkDiscret}>Refazer prompt</Text>
        </TouchableOpacity>
        <Text style={styles.checklistTitulo}>{hobbie}</Text>
        <TouchableOpacity onPress={gerarChecklist} disabled={carregando}>
          <Text style={styles.linkDiscret}>Refazer lista</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressoArea}>
        <View style={styles.progressoBarra}>
          <View style={[styles.progressoFill, { width: `${progresso * 100}%` }]} />
        </View>
        <Text style={styles.progressoTexto}>{marcados}/{itens.length}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#2a6b7c" size="large" />
          </View>
        ) : (
          itens.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, item.marcado && styles.itemMarcado]}
              onPress={() => toggleItem(item.id)}
            >
              <View style={[styles.itemCheck, item.marcado && styles.itemCheckAtivo]}>
                {item.marcado && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemTexto, item.marcado && styles.itemTextoMarcado]}>{item.texto}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.footerBtns}>
        <TouchableOpacity style={styles.btnFinalizar} onPress={finalizar} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#2a6b7c" /> : <Text style={styles.btnFinalizarTexto}>Finalizar 🎉</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={modalFinal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🤖</Text>
            <Text style={styles.modalMensagem}>{mensagemFinal}</Text>
            <TouchableOpacity style={styles.btnNovaLista} onPress={resetar}>
              <Text style={styles.btnNovaListaTexto}>Nova lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#dff0f4' },
  roboArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  roboBolinha: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#b6dae0', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 3 },
  roboEmoji: { fontSize: 40 },
  saudacao: { fontSize: 22, fontWeight: '600', color: '#2a6b7c', marginBottom: 8 },
  frase: { fontSize: 14, color: '#5a8a96', textAlign: 'center', lineHeight: 22 },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, gap: 12, backgroundColor: '#f0f8fa', borderTopWidth: 0.5, borderTopColor: '#b6dae0' },
  inputHobbie: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#2a6b7c', borderWidth: 0.5, borderColor: '#b6dae0', maxHeight: 100 },
  btnEnviar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a6b7c', alignItems: 'center', justifyContent: 'center' },
  btnEnviarTexto: { color: '#fff', fontSize: 20 },
  tituloRefinamento: { fontSize: 18, fontWeight: '600', color: '#2a6b7c', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 13, color: '#5a8a96', marginBottom: 10, marginTop: 16 },
  qtdRow: { flexDirection: 'row', gap: 12 },
  qtdBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#b6dae0', alignItems: 'center', backgroundColor: '#fff' },
  qtdBtnAtivo: { backgroundColor: '#b6dae0', borderColor: '#8bb8c2' },
  qtdBtnTexto: { fontSize: 16, color: '#5a8a96', fontWeight: '500' },
  qtdBtnTextoAtivo: { color: '#2a6b7c' },
  localRow: { flexDirection: 'row', gap: 12 },
  localBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#b6dae0', alignItems: 'center', backgroundColor: '#fff' },
  localBtnAtivo: { backgroundColor: '#b6dae0', borderColor: '#8bb8c2' },
  localEmoji: { fontSize: 24, marginBottom: 4 },
  localTexto: { fontSize: 12, color: '#5a8a96' },
  localTextoAtivo: { color: '#2a6b7c', fontWeight: '500' },
  btnGerar: { backgroundColor: '#b6dae0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 32 },
  btnGerarTexto: { color: '#2a6b7c', fontSize: 15, fontWeight: '600' },
  btnVoltar: { padding: 14, alignItems: 'center', marginTop: 8 },
  btnVoltarTexto: { color: '#5a8a96', fontSize: 14 },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  checklistTitulo: { fontSize: 14, fontWeight: '600', color: '#2a6b7c', flex: 1, textAlign: 'center' },
  linkDiscret: { fontSize: 11, color: '#5a8a96', textDecorationLine: 'underline' },
  progressoArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  progressoBarra: { flex: 1, height: 6, backgroundColor: '#cce8ee', borderRadius: 3 },
  progressoFill: { height: 6, backgroundColor: '#2a6b7c', borderRadius: 3 },
  progressoTexto: { fontSize: 12, color: '#5a8a96', width: 36, textAlign: 'right' },
  content: { flex: 1, paddingHorizontal: 20 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#b6dae0', marginBottom: 8, gap: 12 },
  itemMarcado: { opacity: 0.6, backgroundColor: '#e8f5f8' },
  itemCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#b6dae0', alignItems: 'center', justifyContent: 'center' },
  itemCheckAtivo: { backgroundColor: '#2a6b7c', borderColor: '#2a6b7c' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  itemTexto: { flex: 1, fontSize: 14, color: '#2a6b7c' },
  itemTextoMarcado: { textDecorationLine: 'line-through', color: '#5a8a96' },
  footerBtns: { padding: 16 },
  btnFinalizar: { backgroundColor: '#b6dae0', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnFinalizarTexto: { color: '#2a6b7c', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#f0f8fa', borderRadius: 20, padding: 24, alignItems: 'center', gap: 16, borderWidth: 0.5, borderColor: '#b6dae0' },
  modalEmoji: { fontSize: 48 },
  modalMensagem: { fontSize: 15, color: '#2a6b7c', textAlign: 'center', lineHeight: 24 },
  btnNovaLista: { backgroundColor: '#b6dae0', borderRadius: 12, padding: 12, paddingHorizontal: 24 },
  btnNovaListaTexto: { color: '#2a6b7c', fontWeight: '600' },
});