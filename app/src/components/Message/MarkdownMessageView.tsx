import { type Message, type MarkdownMessageSchema, type RerouteMessageSchema } from '@concrnt/worldlib'
import { MessageViewBase } from './MessageViewBase'
import { useMemo } from 'react'
import { CfmRenderer } from '../ui/CfmRenderer'
import { TranslatorProvider, useTranslator } from '../../context/Translator'

export interface MarkdownMessageViewProps {
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

export const MarkdownMessageView = (props: MarkdownMessageViewProps): JSX.Element => {
    return (
        <TranslatorProvider originalText={props.message.document.body.body ?? 'no content'}>
            <Inner {...props} />
        </TranslatorProvider>
    )
}

const Inner = (props: MarkdownMessageViewProps): JSX.Element => {
    const { translatedText } = useTranslator()

    console.log('translatedText', translatedText)

    const renderer = useMemo(
        () => (
            <CfmRenderer
                messagebody={translatedText ?? props.message.document.body.body ?? 'no content'}
                emojiDict={props.message.document.body.emojis ?? {}}
            />
        ),
        [props.message.id, translatedText]
    )

    return <MessageViewBase {...props}>{renderer}</MessageViewBase>
}
