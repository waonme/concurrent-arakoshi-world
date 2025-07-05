import { createContext, useContext, useState } from 'react'
import { convertToGoogleTranslateCode } from '../util'
import { useTranslation } from 'react-i18next'

export interface TranslatorState {
    translate: () => void
    undo: () => void
    translatedText?: string
}

const TranslatorContext = createContext<TranslatorState>({
    translate: () => {},
    undo: () => {},
    translatedText: undefined
})

interface TranslatorProps {
    children: JSX.Element | JSX.Element[]
    originalText: string
}

export const TranslatorProvider = (props: TranslatorProps): JSX.Element => {
    const [translatedText, setTranslatedText] = useState<string>()
    const { i18n } = useTranslation()

    const translate = async () => {
        // @ts-ignore
        const detector = await LanguageDetector.create({
            // @ts-ignore
            monitor(m) {
                // @ts-ignore
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`)
                })
            }
        })
        await detector.ready

        const languages = await detector.detect(props.originalText)
        console.log('Detected languages:', languages)

        const sourceLang = languages[0].detectedLanguage
        const targetLang = convertToGoogleTranslateCode(i18n.language)

        // @ts-ignore
        const translator = await Translator.create({
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            // @ts-ignore
            monitor(m) {
                // @ts-ignore
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`Downloaded ${e.loaded * 100}%`)
                })
            }
        })

        const translaged = await translator.translate(props.originalText)
        console.log('Translation result:', translaged)
        setTranslatedText(translaged)
    }

    const undo = () => {
        setTranslatedText(undefined)
    }

    return (
        <TranslatorContext.Provider
            value={{
                translate,
                undo,
                translatedText
            }}
        >
            {props.children}
        </TranslatorContext.Provider>
    )
}

export function useTranslator(): TranslatorState {
    return useContext(TranslatorContext)
}
