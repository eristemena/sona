'use client'

import { useEffect, useMemo, useState } from 'react'

import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod/v4'

import type {
  PreviewTtsVoiceResult,
  ProviderKeyStatus,
  StudyPreferencesVoiceOption,
  ValidateOpenRouterKeyResult,
} from '@sona/domain/contracts/window-sona'
import { DEFAULT_ANNOTATION_CACHE_DAYS, DEFAULT_MAX_LLM_CALLS_PER_SESSION, DEFAULT_STUDY_KOREAN_LEVEL } from '@sona/domain/settings/study-preferences'

const studyPreferencesSchema = z.object({
  openRouterApiKey: z.string(),
  selectedVoice: z.string().trim().min(1, 'Choose a preferred voice.'),
  dailyGoal: z.coerce
    .number()
    .int('Daily study goal must be a whole number.')
    .min(1, 'Daily study goal must be at least 1.')
    .max(500, 'Daily study goal must be 500 or less.'),
})

type StudyPreferencesFormValues = z.infer<typeof studyPreferencesSchema>

const studyPreferencesResolver: Resolver<StudyPreferencesFormValues> = async (values) => {
  const result = studyPreferencesSchema.safeParse(values)

  if (result.success) {
    return {
      values: result.data,
      errors: {},
    }
  }

  const errors = result.error.issues.reduce<Record<string, { type: string; message: string }>>(
    (accumulator, issue) => {
      const fieldName = issue.path[0]
      if (typeof fieldName === 'string' && !(fieldName in accumulator)) {
        accumulator[fieldName] = {
          type: issue.code,
          message: issue.message,
        }
      }

      return accumulator
    },
    {},
  )

  return {
    values: {},
    errors,
  }
}

const EMPTY_PROVIDER_KEY_STATUS: ProviderKeyStatus = {
  configured: false,
  lastValidatedAt: null,
  lastValidationState: 'idle',
}

export function useStudyPreferences() {
  const [isLoading, setIsLoading] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<StudyPreferencesVoiceOption[]>([])
  const [providerKeyStatus, setProviderKeyStatus] = useState<ProviderKeyStatus>(
    EMPTY_PROVIDER_KEY_STATUS,
  )
  const [saveMessage, setSaveMessage] = useState('')
  const [validationResult, setValidationResult] = useState<ValidateOpenRouterKeyResult | null>(null)
  const [previewResult, setPreviewResult] = useState<PreviewTtsVoiceResult | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false)

  const form = useForm<StudyPreferencesFormValues>({
    resolver: studyPreferencesResolver,
    defaultValues: {
      openRouterApiKey: '',
      selectedVoice: 'alloy',
      dailyGoal: 20,
    },
  })

  useEffect(() => {
    let isActive = true

    async function loadStudyPreferences() {
      if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
        if (isActive) {
          setIsLoading(false)
        }
        return
      }

      const snapshot = await window.sona.settings.getStudyPreferences()
      if (!isActive) {
        return
      }

      setAvailableVoices(snapshot.availableVoices)
      setProviderKeyStatus(snapshot.openRouterKeyStatus)
      form.reset({
        openRouterApiKey: '',
        selectedVoice: snapshot.selectedVoice,
        dailyGoal: snapshot.dailyGoal,
      })
      setIsLoading(false)
    }

    void loadStudyPreferences()

    return () => {
      isActive = false
    }
  }, [form])

  const selectedVoice = form.watch('selectedVoice')

  const providerStatusMessage = useMemo(() => {
    if (!providerKeyStatus.configured) {
      return 'No OpenRouter key is stored yet. You can still change your voice and daily goal offline.'
    }

    if (providerKeyStatus.lastValidationState === 'success') {
      return 'OpenRouter is configured and the last connection test passed.'
    }

    if (providerKeyStatus.lastValidationState === 'failed') {
      return 'OpenRouter is configured, but the last connection test failed.'
    }

    return 'An OpenRouter key is stored locally and ready for an explicit connection test.'
  }, [providerKeyStatus])

  async function savePreferences(values: StudyPreferencesFormValues) {
    if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
      return
    }

    const result = await window.sona.settings.saveStudyPreferences({
      openRouterApiKey:
        values.openRouterApiKey.trim().length > 0 ? values.openRouterApiKey.trim() : null,
      selectedVoice: values.selectedVoice,
      dailyGoal: values.dailyGoal,
      koreanLevel: DEFAULT_STUDY_KOREAN_LEVEL,
      maxLlmCallsPerSession: DEFAULT_MAX_LLM_CALLS_PER_SESSION,
      annotationCacheDays: DEFAULT_ANNOTATION_CACHE_DAYS,
    })

    setProviderKeyStatus(result.openRouterKeyStatus)
    setSaveMessage('Study preferences saved locally.')
    setValidationResult(null)
    form.reset({
      openRouterApiKey: '',
      selectedVoice: result.selectedVoice,
      dailyGoal: result.dailyGoal,
    })
  }

  async function clearStoredKey() {
    const values = form.getValues()
    form.setValue('openRouterApiKey', '', { shouldDirty: true })
    await savePreferences({
      ...values,
      openRouterApiKey: '',
    })
  }

  async function testConnection() {
    if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
      return
    }

    setIsTestingConnection(true)
    try {
      const result = await window.sona.settings.validateOpenRouterKey()
      setValidationResult(result)
      setProviderKeyStatus((current) => ({
        ...current,
        lastValidatedAt: result.checkedAt,
        lastValidationState: result.ok ? 'success' : 'failed',
      }))
    } finally {
      setIsTestingConnection(false)
    }
  }

  async function previewVoice() {
    if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
      return
    }

    setIsPreviewingVoice(true)
    try {
      const result = await window.sona.settings.previewTtsVoice({ voice: form.getValues('selectedVoice') })
      setPreviewResult(result)
    } finally {
      setIsPreviewingVoice(false)
    }
  }

  return {
    form,
    isLoading,
    availableVoices,
    providerKeyStatus,
    providerStatusMessage,
    saveMessage,
    validationResult,
    previewResult,
    isTestingConnection,
    isPreviewingVoice,
    selectedVoice,
    handleSubmit: form.handleSubmit(savePreferences),
    clearStoredKey,
    testConnection,
    previewVoice,
  }
}