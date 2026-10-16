import { useFormik } from 'formik'
import { useId } from 'react'
import * as yup from 'yup'

import {
  Button,
  Field,
  Grow,
  IconTile,
  Row,
  SelectInput,
  Text,
  TextInput,
} from '~/components'
import { REALMS, type Realm, type Skill } from '~/core'
import type { SkillInput } from '~/features/tracking/hooks'
import { useT, type TranslationKey } from '~/services/i18n'

import { Footer, Form } from '../ActivityForm/styled'

const REALM_LABEL: Record<Realm, TranslationKey> = {
  library: 'realm_library',
  forge: 'realm_forge',
  harbor: 'realm_harbor',
  neon: 'realm_neon',
  gardens: 'realm_gardens',
  bay: 'realm_bay',
}

const required: TranslationKey = 'error_required'
const tooLong: TranslationKey = 'error_too_long'

const schema = yup.object({
  name: yup.string().trim().required(required).max(60, tooLong),
  realm: yup
    .mixed<Realm>()
    .oneOf([...REALMS])
    .required(),
})

type Props = {
  /** Undefined when a new skill is being created. */
  skill: Skill | undefined
  /** A skill with activities cannot be deleted from under them. */
  hasActivities: boolean
  onSave: (input: SkillInput) => void
  onDelete: (skill: Skill) => void
}

export const SkillForm = ({
  skill,
  hasActivities,
  onSave,
  onDelete,
}: Props) => {
  const t = useT()
  const id = useId()

  const formik = useFormik<SkillInput>({
    initialValues: {
      name: skill?.name ?? '',
      realm: skill?.realm ?? 'library',
    },
    validationSchema: schema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: values =>
      onSave({ name: values.name.trim(), realm: values.realm }),
  })

  const { values, errors } = formik
  const nameError =
    typeof errors.name === 'string'
      ? t(errors.name as TranslationKey)
      : undefined

  return (
    <Form onSubmit={formik.handleSubmit} noValidate>
      <Text as="h2" variant="title">
        {t(skill ? 'editor_skill' : 'editor_new_skill')}
      </Text>

      <Field label={t('field_name')} htmlFor={`${id}-name`} error={nameError}>
        <TextInput
          id={`${id}-name`}
          name="name"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          value={values.name}
          onChange={formik.handleChange}
        />
      </Field>

      <Field label={t('field_realm')} htmlFor={`${id}-realm`}>
        <Row $nowrap>
          <IconTile realm={values.realm} />
          <Grow>
            <SelectInput
              id={`${id}-realm`}
              name="realm"
              value={values.realm}
              onChange={formik.handleChange}>
              {REALMS.map(realm => (
                <option key={realm} value={realm}>
                  {t(REALM_LABEL[realm])}
                </option>
              ))}
            </SelectInput>
          </Grow>
        </Row>
      </Field>

      {skill && hasActivities ? (
        <Text variant="secondary" tone="muted">
          {t('skill_delete_blocked')}
        </Text>
      ) : null}

      <Footer>
        {skill ? (
          <Button
            variant="danger"
            disabled={hasActivities}
            onClick={() => onDelete(skill)}>
            {t('action_delete')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary">
          {t('action_save')}
        </Button>
      </Footer>
    </Form>
  )
}
