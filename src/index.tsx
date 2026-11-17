import { createSignal } from 'solid-js';
import { SettingsPage, Section, SettingRow, Input } from '@yapmod/ui';

export function setup() {
  yapmod.log('Plugin started!');

  // Example: register a settings section
  yapmod.settings.registerSection({
    id: 'general',
    label: 'General',
    icon: 'settings',
    render: () => {
      const [greeting, setGreeting] = createSignal('Hello, world!');

      return (
        <SettingsPage title="My Plugin" description="Example plugin settings">
          <Section heading="Appearance">
            <SettingRow label="Greeting" hint="The text shown when the plugin starts">
              <Input value={greeting()} onInput={(e: any) => setGreeting(e.target.value)} />
            </SettingRow>
          </Section>
        </SettingsPage>
      );
    },
  });
}
