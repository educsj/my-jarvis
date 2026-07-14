import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { api, DEFAULT_ASSISTANT_NAME, type Settings } from './src/api';
import { colors, mono } from './src/theme';
import { Waveform } from './src/components/Waveform';

type Status = 'idle' | 'recording' | 'processing' | 'reply';

export default function App() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<Status>('idle');
  const [online, setOnline] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [granted, setGranted] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [reply, setReply] = useState('');

  const pulse = useRef(new Animated.Value(0)).current;

  // Setup inicial: permissão de microfone, modo de áudio, status do backend.
  useEffect(() => {
    (async () => {
      const perm = await requestRecordingPermissionsAsync();
      setGranted(perm.granted);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      try {
        setOnline(await api.health());
        setSettings(await api.getSettings());
      } catch {
        setOnline(false);
      }
    })();
  }, []);

  // Anel pulsante durante a gravação.
  useEffect(() => {
    if (status === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
  }, [status, pulse]);

  async function startRecording() {
    if (status !== 'idle' || !granted) return;
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
    } catch {
      setStatus('idle');
    }
  }

  async function stopAndSend() {
    if (status !== 'recording') return;
    setStatus('processing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setStatus('idle');
        return;
      }
      const res = await api.chatVoice(uri);
      setTranscription(res.transcription);
      setReply(res.reply);
      setOnline(true);
      setStatus('reply');
    } catch {
      setReply(`Não consegui falar com o assistente. O backend está acessível em ${api.baseUrl}?`);
      setOnline(false);
      setStatus('reply');
    }
  }

  const assistantName = settings?.assistantName?.trim() || DEFAULT_ASSISTANT_NAME;

  const label: Record<Status, string> = {
    idle: granted ? 'Segure para falar' : 'Permita o microfone',
    recording: 'Ouvindo…',
    processing: 'Pensando…',
    reply: 'Segure para falar de novo',
  };

  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Header / telemetria */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>
          <Text style={{ color: colors.amber }}>//</Text>
          {assistantName.toUpperCase()}
        </Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <View
              style={[
                styles.dot,
                { backgroundColor: online ? colors.ok : online === false ? colors.danger : colors.muted },
              ]}
            />
            <Text style={styles.chipText}>{online ? 'ONLINE' : online === false ? 'OFFLINE' : '…'}</Text>
          </View>
          {settings && (
            <View style={styles.chip}>
              <View style={[styles.dot, { backgroundColor: colors.amber }]} />
              <Text style={styles.chipText}>
                HUM {settings.humorLevel} · EMP {settings.empathyLevel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Botão central Push-to-Talk */}
      <View style={styles.center}>
        <View style={styles.buttonWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopAndSend}
            disabled={status === 'processing' || !granted}
            style={({ pressed }) => [
              styles.button,
              status === 'recording' && styles.buttonActive,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            {status === 'processing' || status === 'recording' ? (
              <Waveform active color={status === 'recording' ? colors.void : colors.amber} />
            ) : (
              <Text style={styles.mic}>🎙</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.statusLabel}>{label[status]}</Text>
      </View>

      {/* Transcrição + resposta */}
      <ScrollView style={styles.log} contentContainerStyle={{ gap: 12 }}>
        {transcription ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>VOCÊ</Text>
            <Text style={styles.cardText}>{transcription}</Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            Segure o botão, fale, e solte. O assistente responde com o tom definido pela matriz de
            personalidade.
          </Text>
        )}
        {reply ? (
          <View style={[styles.card, styles.cardAssistant]}>
            <Text style={[styles.cardLabel, { color: colors.amber }]}>
              {assistantName.toUpperCase()}
            </Text>
            <Text style={styles.cardText}>{reply}</Text>
          </View>
        ) : null}
      </ScrollView>

      <Text style={styles.footer}>{assistantName} · app local · Fase 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.void,
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  chips: { alignItems: 'flex-end', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { color: colors.muted, fontSize: 10, fontFamily: mono, letterSpacing: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  buttonWrap: { alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.amber,
  },
  button: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel2,
    borderWidth: 2,
    borderColor: colors.line,
  },
  buttonActive: { backgroundColor: colors.amber, borderColor: colors.amberSoft },
  mic: { fontSize: 62 },
  statusLabel: { color: colors.muted, fontFamily: mono, fontSize: 13, letterSpacing: 1.5 },

  log: { maxHeight: 240 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 10 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  cardAssistant: { backgroundColor: 'rgba(232,161,58,0.07)' },
  cardLabel: { color: colors.ice, fontSize: 10, fontFamily: mono, letterSpacing: 2, marginBottom: 6 },
  cardText: { color: colors.text, fontSize: 15, lineHeight: 22 },

  footer: {
    color: colors.muted,
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});
