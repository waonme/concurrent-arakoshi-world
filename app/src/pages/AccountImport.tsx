import { Alert, Box, Button, Divider, Paper, Typography } from '@mui/material'
import { GuestBase } from '../components/GuestBase'
import { ImportMasterKey } from '../components/Importer/ImportMasterkey'
import { Link } from 'react-router-dom'
import { ImportSubkey } from '../components/Importer/ImportSubkey'

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PasswordIcon from '@mui/icons-material/Password'
import { IconButtonWithLabel } from '../components/ui/IconButtonWithLabel'
import { useTranslation } from 'react-i18next'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Client } from '@concrnt/worldlib'
import { Helmet } from 'react-helmet-async'
import { DeriveIdentity, LoadSubKey } from '@concrnt/client'

const QRCodeReader = lazy(() => import('../components/ui/QRCodeReader'))

export default function AccountImport(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'import' })

    const [importMode, setImportMode] = useState<'none' | 'scan' | 'manual'>('none')

    useEffect(() => {
        // receive passkey
        const run = async () => {
            const saltBuf = new Uint8Array(32)
            const challenge = new Uint8Array(32)
            crypto.getRandomValues(challenge)
            const cred = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    userVerification: 'discouraged',
                    extensions: { prf: { eval: { first: saltBuf.buffer } } }
                }
            })

            console.log('cred', cred)
            if (!cred) {
                console.error('Failed to get passkey')
                return
            }

            // @ts-ignore
            const userHandle = cred.response?.userHandle
            if (!userHandle) {
                console.error('No user handle found in passkey response')
                return
            }

            const domain = new TextDecoder().decode(userHandle)

            // @ts-ignore
            const credentialResults = cred.getClientExtensionResults()
            console.log('Credential Results:', credentialResults)
            const prfRes = credentialResults?.prf?.results
            if (prfRes?.first) {
                console.log('PRF First:', prfRes.first)
                const firstBuf = new Uint8Array(prfRes.first)
                const identity = DeriveIdentity(firstBuf)

                const dummySubkeyStr = `concurrent-subkey ${identity.privateKey} -@${domain} -`
                const dummySubkey = LoadSubKey(dummySubkeyStr)

                if (!dummySubkey) {
                    console.error('Failed to load dummy subkey')
                    alert(t('invalidSubkey'))
                    return
                }

                const res = await fetch(`https://${domain}/api/v1/key/${dummySubkey.ckid}`, {}).then((response) =>
                    response.json()
                )
                const ccid = res.content[0].root
                const subkeyStr = `concurrent-subkey ${identity.privateKey} ${ccid}@${domain} -`

                localStorage.setItem('Domain', JSON.stringify(domain))
                localStorage.setItem('SubKey', JSON.stringify(subkeyStr))
                window.location.href = '/'
            } else {
                console.error('No PRF first result found')
                alert(t('invalidSubkey'))
                return
            }
        }

        run()
    }, [])

    return (
        <GuestBase
            sx={{
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 2
            }}
            additionalButton={
                <Button component={Link} to="/register">
                    {t('getStarted')}
                </Button>
            }
        >
            <Helmet>
                <meta name="robots" content="noindex" />
            </Helmet>
            <Paper
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    padding: '20px',
                    flex: 1,
                    gap: '20px'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 2,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <IconButtonWithLabel
                        icon={QrCodeScannerIcon}
                        label={t('scan')}
                        onClick={() => {
                            setImportMode('scan')
                        }}
                    />
                    <Divider orientation="vertical">{t('or')}</Divider>
                    <IconButtonWithLabel
                        icon={PasswordIcon}
                        label={t('manual')}
                        onClick={() => {
                            setImportMode('manual')
                        }}
                    />
                </Box>

                {importMode === 'scan' && (
                    <>
                        <Alert severity="info">{t('qrHint')}</Alert>
                        <Suspense fallback={<Typography>loading...</Typography>}>
                            <QRCodeReader
                                onRead={(result) => {
                                    try {
                                        Client.createFromSubkey(result).then((client) => {
                                            localStorage.setItem('Domain', JSON.stringify(client.host))
                                            localStorage.setItem('SubKey', JSON.stringify(result))
                                            window.location.href = '/'
                                        })
                                    } catch (e) {
                                        console.error(e)
                                    }
                                }}
                            />
                        </Suspense>
                    </>
                )}
                {importMode === 'manual' && (
                    <>
                        <ImportMasterKey />
                        <Divider>{t('or')}</Divider>
                        <ImportSubkey />
                    </>
                )}
            </Paper>
        </GuestBase>
    )
}
