import { createSignal } from 'solid-js';

export default function () {
  return {
    onLoad() {
      yapmod.log('Plugin started!');

      // Example: register a settings section
      yapmod.settings.registerSection({
        id: 'general',
        label: 'General',
        icon: 'settings',
        render: () => {
          const [greeting, setGreeting] = createSignal('Hello, world!');

          return (
            <yapmod.ui.SettingsPage title="My Plugin" description="Example plugin settings">
              <yapmod.ui.Section label="Appearance">
                <yapmod.ui.SettingRow label="Greeting" hint="The text shown when the plugin starts">
                  <yapmod.ui.Input value={greeting()} onChange={(v) => setGreeting(v)} />
                </yapmod.ui.SettingRow>
              </yapmod.ui.Section>
            </yapmod.ui.SettingsPage>
          );
        },
      });
    },

    onUnload() {
      yapmod.log('Plugin stopped!');
    },
  };
}
