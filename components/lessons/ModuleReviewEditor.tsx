'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import type { ModuleContent, TarefaQuestion } from '@/lib/content-generator'
import { updateModuleContent } from '@/app/actions/module-content'

interface ReviewModule {
  id:           string
  title:        string
  order_index:  number
  content_json: ModuleContent
}

interface ModuleReviewEditorProps {
  modules: ReviewModule[]
}

function emptyQuestion(): TarefaQuestion {
  return {
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correct: 0,
  }
}

function updateAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => itemIndex === index ? value : item)
}

export function ModuleReviewEditor({ modules }: ModuleReviewEditorProps) {
  const [contents, setContents] = useState<Record<string, ModuleContent>>(
    () => Object.fromEntries(modules.map(module => [module.id, module.content_json]))
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  function setContent(moduleId: string, content: ModuleContent) {
    setContents(current => ({ ...current, [moduleId]: content }))
  }

  async function handleSave(moduleId: string) {
    setSavingId(moduleId)
    const result = await updateModuleContent({
      moduleId,
      content: contents[moduleId],
    })
    setSavingId(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.content) {
      setContent(moduleId, result.content)
    }

    toast.success('Revisão salva.')
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-black text-ms-dark">Revisar conteúdo gerado</h2>
        <p className="text-xs text-slate-400 mt-1">
          Ajuste o resumo, as questões e o oratório antes de publicar a aula.
        </p>
      </div>

      {modules.map(module => {
        const content = contents[module.id]
        const questions = content.tarefas.questions

        return (
          <details
            key={module.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <summary className="cursor-pointer px-5 py-4 flex items-center gap-3 list-none">
              <span className="text-lg font-black text-ms-medium w-6 text-center">
                {module.order_index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ms-dark text-sm truncate">{content.title}</p>
                <p className="text-xs text-slate-400">
                  {questions.length} questão{questions.length !== 1 ? 'ões' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={event => {
                  event.preventDefault()
                  handleSave(module.id)
                }}
                disabled={savingId === module.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-xs font-bold bg-ms-medium text-white
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingId === module.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                Salvar
              </button>
            </summary>

            <div className="border-t border-slate-100 px-5 py-5 space-y-5">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Título do slide
                </span>
                <input
                  value={content.title}
                  onChange={event => setContent(module.id, {
                    ...content,
                    title: event.target.value,
                  })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200
                             text-sm text-ms-dark focus:outline-none focus:ring-2
                             focus:ring-ms-medium/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Resumo
                </span>
                <textarea
                  value={content.resumo.text}
                  onChange={event => setContent(module.id, {
                    ...content,
                    resumo: { ...content.resumo, text: event.target.value },
                  })}
                  rows={4}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200
                             text-sm text-ms-dark focus:outline-none focus:ring-2
                             focus:ring-ms-medium/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Bullets do resumo
                </span>
                <textarea
                  value={content.resumo.bullets.join('\n')}
                  onChange={event => setContent(module.id, {
                    ...content,
                    resumo: {
                      ...content.resumo,
                      bullets: event.target.value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(Boolean),
                    },
                  })}
                  rows={4}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200
                             text-sm text-ms-dark focus:outline-none focus:ring-2
                             focus:ring-ms-medium/30"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Questões
                  </p>
                  <button
                    type="button"
                    onClick={() => setContent(module.id, {
                      ...content,
                      tarefas: {
                        questions: [...questions, emptyQuestion()],
                      },
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               text-xs font-bold border border-ms-medium/30
                               text-ms-medium hover:bg-ms-light"
                  >
                    <Plus size={13} />
                    Adicionar
                  </button>
                </div>

                {questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        value={question.question}
                        onChange={event => {
                          const nextQuestion = { ...question, question: event.target.value }
                          setContent(module.id, {
                            ...content,
                            tarefas: {
                              questions: updateAt(questions, questionIndex, nextQuestion),
                            },
                          })
                        }}
                        placeholder={`Questão ${questionIndex + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200
                                   text-sm text-ms-dark focus:outline-none focus:ring-2
                                   focus:ring-ms-medium/30"
                      />
                      <button
                        type="button"
                        onClick={() => setContent(module.id, {
                          ...content,
                          tarefas: {
                            questions: questions.filter((_, index) => index !== questionIndex),
                          },
                        })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Remover questão"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid gap-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`${module.id}-${questionIndex}-correct`}
                            checked={question.correct === optionIndex}
                            onChange={() => {
                              const nextQuestion = { ...question, correct: optionIndex }
                              setContent(module.id, {
                                ...content,
                                tarefas: {
                                  questions: updateAt(questions, questionIndex, nextQuestion),
                                },
                              })
                            }}
                          />
                          <input
                            value={option}
                            onChange={event => {
                              const nextQuestion = {
                                ...question,
                                options: updateAt(question.options, optionIndex, event.target.value),
                              }
                              setContent(module.id, {
                                ...content,
                                tarefas: {
                                  questions: updateAt(questions, questionIndex, nextQuestion),
                                },
                              })
                            }}
                            placeholder={`Alternativa ${optionIndex + 1}`}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200
                                       text-sm text-ms-dark focus:outline-none focus:ring-2
                                       focus:ring-ms-medium/30"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Prompt de oratório
                  </span>
                  <textarea
                    value={content.oratorio.prompt}
                    onChange={event => setContent(module.id, {
                      ...content,
                      oratorio: { ...content.oratorio, prompt: event.target.value },
                    })}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200
                               text-sm text-ms-dark focus:outline-none focus:ring-2
                               focus:ring-ms-medium/30"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Frase-alvo
                  </span>
                  <textarea
                    value={content.oratorio.target_phrase}
                    onChange={event => setContent(module.id, {
                      ...content,
                      oratorio: { ...content.oratorio, target_phrase: event.target.value },
                    })}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200
                               text-sm text-ms-dark focus:outline-none focus:ring-2
                               focus:ring-ms-medium/30"
                  />
                </label>
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}
