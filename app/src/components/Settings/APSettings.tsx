import { Box, Button, Divider, IconButton, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { type ApEntity } from '../../model'
import { ApSetup } from '../Activitypub/Setup'
import { ApFollowManager, APUserCard } from '../Activitypub/FollowManager'
import { CCDrawer } from '../ui/CCDrawer'
import { useNavigate } from 'react-router-dom'
import { WatchButton } from '../WatchButton'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import { useSnackbar } from 'notistack'
import SettingsIcon from '@mui/icons-material/Settings'
import { StreamPicker } from '../ui/StreamPicker'
import { useGlobalState } from '../../context/GlobalState'
import { type Timeline } from '@concrnt/worldlib'

export const APSettings = (): JSX.Element => {
    const { client } = useClient()
    const [entity, setEntity] = useState<ApEntity | null | undefined>(undefined)
    const [openInquiry, setOpenInquiry] = useState(false)
    const [url, setUrl] = useState('')
    const navigate = useNavigate()
    const [openSettings, setOpenSettings] = useState(false)
    const { enqueueSnackbar } = useSnackbar()
    const [aliases, setAliases] = useState<string[]>([])
    const [newAlias, setNewAlias] = useState('')
    const [listenTimelines, setListenTimelines] = useState<Array<Timeline<any>>>([])
    const { allKnownTimelines } = useGlobalState()

    useEffect(() => {
        const requestOptions = {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            }
        }

        client.api
            .fetchWithCredential<ApEntity>(client.host, `/ap/api/entity/${client.ccid}`, requestOptions)
            .then((data) => {
                setEntity(data)
                if (data) setAliases(data.aliases ?? [])
            })
            .catch((e) => {
                setEntity(null)
            })
    }, [])

    useEffect(() => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/settings`, {})
            .then(async (data: any) => {
                const requests = await Promise.allSettled(
                    data.listen_timelines.map((id: string) => {
                        return client.getTimeline(id)
                    })
                )

                const fulfilled = requests.filter((r) => r.status === 'fulfilled') as Array<
                    PromiseFulfilledResult<Timeline<any>>
                >
                setListenTimelines(fulfilled.map((r) => r.value))
            })
            .catch((e) => {
                console.error(e)
            })
    }, [allKnownTimelines])

    const updateSettings = (): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/settings`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    listen_timelines: listenTimelines.map((t) => t.id)
                })
            })
            .then(() => {
                enqueueSnackbar('更新しました', {
                    variant: 'success'
                })
            })
    }

    const inquery = (url: string): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/import?note=${encodeURIComponent(url)}`, {
                method: 'GET',
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then((data: any) => {
                navigate(`/${data.author}/${data.id}`)
            })
    }

    if (entity === undefined) {
        return <>loading...</>
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}
        >
            {entity === null ? (
                <ApSetup />
            ) : (
                <>
                    <Box
                        display="flex"
                        flexWrap="wrap"
                        flexDirection="row"
                        justifyContent="space-between"
                        gap={1}
                        width="100%"
                        alignItems="center"
                    >
                        <Box>
                            <Typography variant="h2">
                                @{entity.id}@{client.host}
                            </Typography>
                        </Box>
                        <Box display="flex" flexDirection="row" justifyContent="flex-end" flex="1" gap={1}>
                            <IconButton>
                                <TravelExploreIcon
                                    onClick={() => {
                                        setOpenInquiry(true)
                                    }}
                                />
                            </IconButton>
                            <WatchButton minimal timelineFQID={'world.concrnt.t-ap@' + entity.ccid} />
                            <IconButton>
                                <SettingsIcon
                                    onClick={() => {
                                        setOpenSettings(true)
                                    }}
                                />
                            </IconButton>
                        </Box>
                    </Box>
                    <ApFollowManager />
                </>
            )}
            <CCDrawer
                open={openInquiry}
                onClose={() => {
                    setOpenInquiry(false)
                }}
            >
                <Box display="flex" width="100%" gap={1} padding={1} flexDirection="column">
                    <Typography variant="h2">照会</Typography>
                    <Divider />
                    <Box display="flex" width="100%" gap={1} padding={1}>
                        <TextField
                            label="照会"
                            variant="outlined"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value)
                            }}
                            sx={{
                                flexGrow: 1
                            }}
                        />
                        <Button
                            onClick={() => {
                                inquery(url)
                            }}
                        >
                            照会
                        </Button>
                    </Box>
                </Box>
            </CCDrawer>
            <CCDrawer
                open={openSettings}
                onClose={() => {
                    setOpenSettings(false)
                }}
            >
                <Box display="flex" width="100%" gap={1} padding={1} flexDirection="column">
                    <Typography variant="h2">設定</Typography>
                    <Typography variant="h2">転送元タイムライン</Typography>
                    空の場合はホームタイムラインを使用します
                    <StreamPicker
                        options={allKnownTimelines}
                        selected={listenTimelines}
                        setSelected={(streams) => {
                            setListenTimelines(streams)
                        }}
                        placeholder="転送元タイムラインの追加"
                    />
                    <Button
                        onClick={() => {
                            updateSettings()
                        }}
                    >
                        更新
                    </Button>
                    <Divider />
                    <Typography variant="h2">引っ越しオプション</Typography>
                    <Divider />
                    <Box display="flex" width="100%" gap={1} padding={1}>
                        <TextField
                            label="引っ越し元を追加"
                            variant="outlined"
                            value={newAlias}
                            onChange={(e) => {
                                setNewAlias(e.target.value)
                            }}
                            sx={{
                                flexGrow: 1
                            }}
                        />
                        <Button
                            onClick={() => {
                                client.api
                                    .fetchWithCredential(
                                        client.host,
                                        `/ap/api/resolve/${encodeURIComponent(newAlias)}`,
                                        {
                                            method: 'GET',
                                            headers: {
                                                accept: 'application/ld+json'
                                            }
                                        }
                                    )
                                    .then((data: any) => {
                                        if (data.id) {
                                            const newAliases = [...new Set([...aliases, data.id])]

                                            client.api
                                                .fetchWithCredential(client.host, `/ap/api/entities/aliases`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'content-type': 'application/json'
                                                    },
                                                    body: JSON.stringify({
                                                        aliases: newAliases
                                                    })
                                                })
                                                .then((_) => {
                                                    enqueueSnackbar('更新しました', {
                                                        variant: 'success'
                                                    })
                                                    setAliases(newAliases)
                                                })
                                        }
                                    })
                            }}
                        >
                            追加
                        </Button>
                    </Box>
                    <Box
                        display="flex"
                        flexDirection="column"
                        gap={1}
                        sx={{
                            flexGrow: 1
                        }}
                    >
                        {aliases.map((alias) => (
                            <>
                                <Typography>{alias}</Typography>
                                <APUserCard
                                    url={alias}
                                    remove={(body) => {
                                        const newAliases = aliases.filter((a) => a !== body.URL)
                                        client.api
                                            .fetchWithCredential(client.host, `/ap/api/entities/aliases`, {
                                                method: 'POST',
                                                headers: {
                                                    'content-type': 'application/json'
                                                },
                                                body: JSON.stringify({
                                                    aliases: newAliases
                                                })
                                            })
                                            .then((_) => {
                                                enqueueSnackbar('更新しました', {
                                                    variant: 'success'
                                                })
                                                setAliases(newAliases)
                                            })
                                    }}
                                />
                            </>
                        ))}
                    </Box>
                </Box>
            </CCDrawer>
        </Box>
    )
}
