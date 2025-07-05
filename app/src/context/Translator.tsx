import { createContext, useContext, useState } from 'react'
import { convertToGoogleTranslateCode } from '../util'
import { useTranslation } from 'react-i18next'

export interface TranslatorState {
    translate: () => void
    undo: () => void
    translatedText?: string
    isAvailable: boolean
    processing?: boolean
}

const TranslatorContext = createContext<TranslatorState>({
    translate: () => {},
    undo: () => {},
    translatedText: undefined,
    isAvailable: false,
    processing: false
})

interface TranslatorProps {
    children: JSX.Element | JSX.Element[]
    originalText: string
}

export const TranslatorProvider = (props: TranslatorProps): JSX.Element => {
    const [translatedText, setTranslatedText] = useState<string>()
    const [processing, setProcessing] = useState<boolean>(false)
    const { i18n } = useTranslation()

    const isAvailable = !!LanguageDetector && !!Translator

    const translate = async () => {
        setProcessing(true)
        const detector = await LanguageDetector.create({
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`)
                })
            }
        })

        const languages = await detector.detect(props.originalText)
        console.log('Detected languages:', languages)

        const sourceLang = languages[0].detectedLanguage
        const targetLang = convertToGoogleTranslateCode(i18n.language)

        if (!sourceLang || !targetLang) {
            console.error('Source or target language is not defined')
            return
        }

        const translator = await Translator.create({
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`)
                })
            }
        })

        const translaged = await translator.translate(props.originalText)
        console.log('Translation result:', translaged)
        setTranslatedText(translaged)
        setProcessing(false)
    }

    const undo = () => {
        setTranslatedText(undefined)
    }

    return (
        <TranslatorContext.Provider
            value={{
                translate,
                undo,
                translatedText,
                isAvailable,
                processing
            }}
        >
            {props.children}
        </TranslatorContext.Provider>
    )
}

export function useTranslator(): TranslatorState {
    return useContext(TranslatorContext)
}
