/**
 * PostEditorSwitch: branching point for editor variants.
 *
 * Status: NO FUNCTIONAL DIVERGENCE. Both 'original' and 'arakoshi'
 * render the same CCPostEditor. This component exists solely to
 * establish the switching mechanism for future variant-specific
 * features (e.g., arakoshi inline draft saving, draft community
 * integration, different UI layouts).
 *
 * When divergence is needed:
 * - 'original' branch: keep as upstream-compatible CCPostEditor
 * - 'arakoshi' branch: replace with a dedicated ArakoshiPostEditor
 */
import { memo } from 'react'
import { CCPostEditor, type CCPostEditorProps } from './CCPostEditor'
import { usePreference } from '../../context/PreferenceContext'

export interface PostEditorSwitchProps extends CCPostEditorProps {
    draftKey?: string
}

export const PostEditorSwitch = memo<PostEditorSwitchProps>((props: PostEditorSwitchProps): JSX.Element => {
    const [postEditorVariant] = usePreference('postEditorVariant')

    switch (postEditorVariant) {
        case 'original':
            // Identical to 'arakoshi' — no divergence yet
            return <CCPostEditor key={props.draftKey ?? 'default'} {...props} />
        case 'arakoshi':
        default:
            // Identical to 'original' — no divergence yet
            return <CCPostEditor key={props.draftKey ?? 'default'} {...props} />
    }
})

PostEditorSwitch.displayName = 'PostEditorSwitch'
