import { useCallback } from 'react'
import { usePersistent } from './usePersistent'

export interface DraftMeta {
    id: string
    title: string
    createdAt: number
    updatedAt: number
    pinned: boolean
}

export function draftStorageKeys(draftKey: string): {
    draft: string
    draftEmojis: string
    draftMedias: string
} {
    return {
        draft: `concurrent-arakoshi-draft:${draftKey}`,
        draftEmojis: `concurrent-arakoshi-draftEmojis:${draftKey}`,
        draftMedias: `concurrent-arakoshi-draftMedias:${draftKey}`
    }
}

export function generateDraftId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useDraftIndex(): {
    drafts: DraftMeta[]
    setDrafts: (updator: DraftMeta[] | ((old: DraftMeta[]) => DraftMeta[])) => void
    createDraft: (title?: string) => DraftMeta
    updateDraft: (id: string, updates: Partial<Omit<DraftMeta, 'id' | 'createdAt'>>) => void
    deleteDraft: (id: string) => void
} {
    const [drafts, setDrafts] = usePersistent<DraftMeta[]>('concurrent-arakoshi-drafts-index', [])

    const createDraft = useCallback(
        (title?: string): DraftMeta => {
            const now = Date.now()
            const meta: DraftMeta = {
                id: generateDraftId(),
                title: title ?? '',
                createdAt: now,
                updatedAt: now,
                pinned: false
            }
            setDrafts((prev) => [...prev, meta])
            return meta
        },
        [setDrafts]
    )

    const updateDraft = useCallback(
        (id: string, updates: Partial<Omit<DraftMeta, 'id' | 'createdAt'>>) => {
            setDrafts((prev) =>
                prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d))
            )
        },
        [setDrafts]
    )

    const deleteDraft = useCallback(
        (id: string) => {
            const keys = draftStorageKeys(id)
            localStorage.removeItem(keys.draft)
            localStorage.removeItem(keys.draftEmojis)
            localStorage.removeItem(keys.draftMedias)
            setDrafts((prev) => prev.filter((d) => d.id !== id))
        },
        [setDrafts]
    )

    return { drafts, setDrafts, createDraft, updateDraft, deleteDraft }
}
