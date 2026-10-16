'use client'

import { Button, HeroSprite, Segmented, Text } from '~/components'
import { APP_NAME } from '~/services/brand'
import {
  LOCALES,
  LOCALE_IDS,
  changeLocale,
  useT,
  type Locale,
} from '~/services/i18n'
import { useSettingsStore } from '~/store'

import { useSignIn } from '../../hooks'

import {
  Actions,
  Copy,
  Glow,
  Ground,
  Hill,
  House,
  Page,
  Panel,
  Scene,
  Standing,
  Tower,
} from './styled'

const LANGUAGE_OPTIONS = LOCALE_IDS.map(id => ({
  value: id,
  label: LOCALES[id].name,
}))

type Props = {
  /** The language in use, resolved from the setting or the device. */
  locale: Locale
}

export const SignInScreen = ({ locale }: Props) => {
  const t = useT()
  const { signIn, pending, failed, signInForDevelopment } = useSignIn()
  const setLocale = useSettingsStore(state => state.setLocale)

  const pickLanguage = (next: Locale) => {
    setLocale(next)
    changeLocale(next)
  }

  return (
    <Page>
      <Scene role="img" aria-label={t('signin_scene_label')}>
        <Hill $side="left" />
        <Hill $side="right" />
        <Tower />
        <House />
        <Ground />
        <Glow />
        <Standing>
          <HeroSprite scale={16} />
        </Standing>
      </Scene>
      <Panel>
        <Text variant="title">{APP_NAME}</Text>
        <Copy>
          <Text as="h1" variant="display" narrowVariant="hero">
            {t('signin_title')}
          </Text>
          <Text variant="lead" tone="muted">
            {t('signin_text')}
          </Text>
        </Copy>
        <Actions>
          <Button
            variant="primary"
            size="lg"
            disabled={pending}
            onClick={signIn}>
            {t('signin_google')}
          </Button>
          {signInForDevelopment ? (
            <Button onClick={signInForDevelopment}>{t('signin_dev')}</Button>
          ) : null}
          {failed ? (
            <Text variant="secondary" tone="danger">
              {t('signin_failed')}
            </Text>
          ) : null}
          <Segmented
            label={t('settings_language')}
            options={LANGUAGE_OPTIONS}
            selected={[locale]}
            onSelect={pickLanguage}
          />
        </Actions>
      </Panel>
    </Page>
  )
}
