'use client'

import {
  Modal,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
} from '@mantine/core'
import { toast } from 'sonner'
import { getIntegrationDisplayName, getIntegrationIcon, getIntegrationColors } from './integration-utils'
import { type AvailableIntegrationType } from '@/lib/constants'

interface AddIntegrationModalProps {
  opened: boolean
  onClose: () => void
  onIntegrationAdded: (integrationType: AvailableIntegrationType) => void
  availableTypes: AvailableIntegrationType[]
}

export function AddIntegrationModal({
  opened,
  onClose,
  onIntegrationAdded,
  availableTypes
}: AddIntegrationModalProps) {
  const handleSelectIntegration = (type: AvailableIntegrationType) => {
    // Just add to local state, don't save to DB yet
    toast.success(`${getIntegrationDisplayName(type)} integration added`)
    onIntegrationAdded(type)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={0}>
          <Title order={3}>Add Integration</Title>
          <Text size="sm" c="dimmed">Choose an integration type to add</Text>
        </Stack>
      }
      size="md"
    >
      <Stack gap="md">
        {availableTypes.length === 0 ? (
          <Card withBorder p="md">
            <Text c="dimmed" ta="center">
              All single-instance integration types are already added
            </Text>
          </Card>
        ) : (
          availableTypes.map((type) => {
            const Icon = getIntegrationIcon(type)
            const colors = getIntegrationColors(type)
            
            return (
              <Card
                key={type}
                withBorder
                p="md"
                className={`cursor-pointer transition-all ${colors.hover}`}
                onClick={() => handleSelectIntegration(type)}
              >
                <Group gap="md">
                  <Icon size={32} />
                  <Stack gap={2} flex={1}>
                    <Text fw={500}>{getIntegrationDisplayName(type)}</Text>
                    <Text size="sm" c="dimmed">
                      Add {getIntegrationDisplayName(type)} integration
                    </Text>
                  </Stack>
                  <Button variant="light" size="sm">
                    Add
                  </Button>
                </Group>
              </Card>
            )
          })
        )}

        <Group justify="flex-end" pt="md">
          <Button
            variant="subtle"
            onClick={onClose}
          >
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
