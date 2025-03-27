import { useState, useEffect, memo } from 'react'
import { Box, Typography } from '@mui/material'
import cfm from '@concrnt/cfm'

import type { EmojiLite } from '../../model'
import { CCUserChip } from './CCUserChip'
import { TimelineChip } from './TimelineChip'
import { useGlobalState } from '../../context/GlobalState'
import { CCLink } from './CCLink'

export interface MarkdownRendererProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
    forceOneline?: boolean
    limit?: number
}

export interface RenderAstProps {
    ast: any
    props: MarkdownRendererProps
}

const RenderAst = ({ ast, props }: RenderAstProps): JSX.Element => {
    if (Array.isArray(ast)) {
        return (
            <>
                {ast.map((node: any) => (
                    <RenderAst ast={node} props={props} />
                ))}
            </>
        )
    }

    const { getImageURL } = useGlobalState()

    if (!ast) return <>null</>
    switch (ast.type) {
        case 'newline':
            ;<>{!props.forceOneline && <br />}</>
        case 'Line':
            return (
                <>
                    <RenderAst ast={ast.body} props={props} />
                    {!props.forceOneline && <br />}
                </>
            )
        case 'Text':
            return ast.body
        case 'URL':
            return (
                <CCLink to={ast.body} color="secondary" underline="hover">
                    {ast.body}
                </CCLink>
            )
        case 'Timeline':
            return <TimelineChip timelineFQID={ast.body} />
        case 'Spoiler':
            return <Box>{ast.body}</Box>
        case 'Tag':
            return <span>#{ast.body}</span>
        case 'Mention': {
            if (ast.body.startsWith('con1') && ast.body.length === 42) {
                return <CCUserChip ccid={ast.body} />
            } else {
                return <span>@{ast.body}</span>
            }
        }
        case 'Emoji': {
            const emoji = props.emojiDict[ast.body]
            return emoji ? (
                <img
                    src={getImageURL(emoji?.animURL ?? emoji?.imageURL, { maxHeight: 128 })}
                    style={{
                        height: '1.25em',
                        verticalAlign: '-0.45em',
                        marginBottom: '4px'
                    }}
                />
            ) : (
                <span>:{ast.body}:</span>
            )
        }
        case 'Details':
            return <span>[Details]</span>
        case 'InlineCode':
            return (
                <Box
                    component="span"
                    sx={{
                        fontFamily: 'Source Code Pro, monospace',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: 1,
                        border: '0.5px solid #ddd',
                        padding: '0 0.5rem',
                        margin: '0 0.2rem'
                    }}
                >
                    {ast.body}
                </Box>
            )
        case 'Image':
            return <span>[Image: {ast.alt}]</span>
        case 'CodeBlock':
            return <span>[Codeblock]</span>
        case 'EmojiPack':
            return <span>[EmojiPack]</span>
        case 'Heading':
            return (
                <Typography variant={`h${ast.level}` as any}>
                    <RenderAst ast={ast.body} props={props} />
                </Typography>
            )
        default:
            return <>unknown ast type: {ast.type}</>
    }
}

export const MarkdownRendererLite = (props: MarkdownRendererProps): JSX.Element => {
    const [ast, setAst] = useState<any>(null)

    useEffect(() => {
        if (props.messagebody === '') {
            setAst([])
            return
        }
        try {
            setAst(cfm.parse(props.messagebody))
        } catch (e) {
            console.error(e)
            setAst([
                {
                    type: 'Text',
                    body: props.messagebody
                },
                {
                    type: 'Text',
                    body: 'error: ' + JSON.stringify(e)
                }
            ])
        }
    }, [props.messagebody])

    return (
        <Box
            sx={{
                whiteSpace: props.forceOneline ? 'inherit' : 'pre-wrap',
                fontSize: {
                    xs: '0.9rem',
                    sm: '1rem'
                }
            }}
        >
            <RenderAst ast={ast} props={props} />
        </Box>
    )
}
