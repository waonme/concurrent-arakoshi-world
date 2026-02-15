import { memo } from 'react'
import { CCPostEditor, type CCPostEditorProps } from './CCPostEditor'
import { usePreference } from '../../context/PreferenceContext'

export interface PostEditorSwitchProps extends CCPostEditorProps {
    draftKey?: string
}

export const PostEditorSwitch = memo<PostEditorSwitchProps>((props: PostEditorSwitchProps): JSX.Element => {
    const [postEditorVariant] = usePreference('postEditorVariant')

    // Both variants currently render CCPostEditor.
    // The branching point is established for future divergence.
    switch (postEditorVariant) {
        case 'original':
            return <CCPostEditor key={props.draftKey ?? 'default'} {...props} />
        case 'arakoshi':
        default:
            return <CCPostEditor key={props.draftKey ?? 'default'} {...props} />
    }
})

PostEditorSwitch.displayName = 'PostEditorSwitch'
