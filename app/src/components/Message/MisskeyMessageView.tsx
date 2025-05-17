import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { useMemo } from 'react'
import { MfmRenderer } from '../ui/MfmRenderer'

export interface MisskeyMessageViewProps {
    message: Message<MarkdownMessageSchema>
    rerouted?: Message<RerouteMessageSchema>
    userCCID?: string
    beforeMessage?: JSX.Element
    lastUpdated?: number
    forceExpanded?: boolean
    clipHeight?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
}

export const MisskeyMessageView = (props: MisskeyMessageViewProps): JSX.Element => {
    const renderer = useMemo(
        () => (
            <MfmRenderer
                messagebody={props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        ),
        [props.message.id]
    )

    return <MessageViewBase {...props}>{renderer}</MessageViewBase>
}
