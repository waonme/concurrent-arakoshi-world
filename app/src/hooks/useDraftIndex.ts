import { useCallback } from 'react'
import { usePersistent } from './usePersistent'

export interface DraftMeta {
    id: string
    title: string
    createdAt: number
    updatedAt: number
    pinned: boolean
    destination?: { timelineIDs: string[] }
}

export function draftStorageKeys(draftKey: string): {
    draft: string
    draftEmojis: string
    draftMedias: string
    destination: string
} {
    return {
        draft: `concurrent-arakoshi-draft:${draftKey}`,
        draftEmojis: `concurrent-arakoshi-draftEmojis:${draftKey}`,
        draftMedias: `concurrent-arakoshi-draftMedias:${draftKey}`,
        destination: `concurrent-arakoshi-draftDest:${draftKey}`
    }
}

export function resolveEditorStorageKeys(draftKey?: string): {
    draft: string
    draftEmojis: string
    draftMedias: string
    destination: string | null
} {
    if (draftKey) {
        const keys = draftStorageKeys(draftKey)
        return { ...keys }
    }
    return {
        draft: 'draft',
        draftEmojis: 'draftEmojis',
        draftMedias: 'draftMedias',
        destination: null
    }
}

export function generateDraftId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useDraftIndex(): {
    drafts: DraftMeta[]
    setDrafts: (updator: DraftMeta[] | ((old: DraftMeta[]) => DraftMeta[])) => void
    createDraft: (title?: string) => DraftMeta
    ensureDraft: (id: string, title?: string) => void
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

    const ensureDraft = useCallback(
        (id: string, title?: string): void => {
            setDrafts((prev) => {
                if (prev.some((d) => d.id === id)) return prev
                const now = Date.now()
                return [...prev, { id, title: title ?? '', createdAt: now, updatedAt: now, pinned: false }]
            })
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
            localStorage.removeItem(keys.destination)
            setDrafts((prev) => prev.filter((d) => d.id !== id))
        },
        [setDrafts]
    )

    return { drafts, setDrafts, createDraft, ensureDraft, updateDraft, deleteDraft }
}
