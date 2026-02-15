import { useMemo } from 'react'
import { Box, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material'
import { useDraftIndex, draftStorageKeys } from '../hooks/useDraftIndex'
import { useEditorModal } from './EditorModal'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PushPinIcon from '@mui/icons-material/PushPin'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'

export const DraftList = (): JSX.Element => {
    const { drafts, updateDraft, deleteDraft } = useDraftIndex()
    const editorModal = useEditorModal()

    const sortedDrafts = useMemo(() => {
        return [...drafts].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
            return b.updatedAt - a.updatedAt
        })
    }, [drafts])

    const getPreview = (draftId: string): string => {
        const keys = draftStorageKeys(draftId)
        const body = localStorage.getItem(keys.draft)
        if (!body) return '(empty)'
        try {
            const parsed = JSON.parse(body)
            if (typeof parsed === 'string') {
                return parsed.slice(0, 100) || '(empty)'
            }
        } catch {
            // not JSON
        }
        return body.slice(0, 100) || '(empty)'
    }

    const formatDate = (ts: number): string => {
        return new Date(ts).toLocaleString()
    }

    if (sortedDrafts.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    No drafts
                </Typography>
            </Box>
        )
    }

    return (
        <List dense>
            {sortedDrafts.map((draft) => (
                <ListItem
                    key={draft.id}
                    secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    updateDraft(draft.id, { pinned: !draft.pinned })
                                }}
                            >
                                {draft.pinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    editorModal.open({ draftKey: draft.id })
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    deleteDraft(draft.id)
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    }
                >
                    <ListItemText
                        primary={draft.title || getPreview(draft.id)}
                        secondary={formatDate(draft.updatedAt)}
                        primaryTypographyProps={{
                            noWrap: true,
                            sx: { maxWidth: '60%' }
                        }}
                    />
                </ListItem>
            ))}
        </List>
    )
}
