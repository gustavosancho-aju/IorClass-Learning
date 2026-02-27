/**
 * Calcula a pontuação de uma resposta oral comparando o transcript
 * com a frase-alvo usando similaridade de palavras (Jaccard simplificado).
 *
 * Retorna 0–100.
 */
export function scoreSpeech(transcript: string, targetPhrase: string): number {
  if (!targetPhrase.trim()) return 100 // sem frase-alvo = pontuação máxima

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  const targetWords  = normalize(targetPhrase).split(/\s+/).filter(Boolean)
  const spokenSet    = new Set(normalize(transcript).split(/\s+/).filter(Boolean))

  if (targetWords.length === 0) return 100

  const matched = targetWords.filter(w => spokenSet.has(w))
  return Math.round((matched.length / targetWords.length) * 100)
}

/**
 * Retorna feedback textual baseado na pontuação.
 */
export function getOratoryFeedback(score: number, targetPhrase: string): {
  emoji: string
  title: string
  tip:   string
} {
  if (score >= 80) return {
    emoji: '🏆',
    title: 'Excelente pronúncia!',
    tip:   'Você cobriu os pontos principais. Continue praticando!',
  }
  if (score >= 50) return {
    emoji: '💪',
    title: 'Bom trabalho!',
    tip:   `Tente incluir mais termos como: "${targetPhrase.split(' ').slice(0,4).join(' ')}..."`,
  }
  return {
    emoji: '🎯',
    title: 'Continue praticando!',
    tip:   `Foque em dizer a frase completa: "${targetPhrase}"`,
  }
}
