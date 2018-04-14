function mySettings(props) {
  return (
    <Page>
      <TextImageRow
        label="Glance"
        sublabel="https://github.com/Rytiggy/Glance"
        icon="https://image.ibb.co/gbWF2H/twerp_bowtie_64.png"
      />
        <TextInput
          label="Api endpoint | defaults xDrip"
          settingsKey="endpoint"
        />
        <TextInput
          label="High threshold | default 200"
          settingsKey="highThreshold"
        />
        <TextInput
        label="Low threshold | default 70"
        settingsKey="lowThreshold"
        />
        <Toggle
          label="12hr | 24hr"
          settingsKey="timeFormat"
        />
        <Toggle
          label="Celsius | Fahrenheit"
          settingsKey="tempType"
        />
        <TextInput
        label="Open Weather Map API Key"
        settingsKey="owmAPI"
        />
        <TextInput
        label="City"
        settingsKey="city"
        />
    </Page>
  );
}

registerSettingsPage(mySettings);