import { SliderRow, Section } from "../common";

interface PreviewSettingsSectionProps {
  previewSize: number;
  onPreviewSizeChange: (v: number) => void;
  letterSpacing: number;
  onLetterSpacingChange: (v: number) => void;
}

export function PreviewSettingsSection({
  previewSize,
  onPreviewSizeChange,
  letterSpacing,
  onLetterSpacingChange,
}: PreviewSettingsSectionProps) {
  return (
    <>
      <Section label="Font Size" display={`${previewSize}px`}>
        <SliderRow value={previewSize} min={16} max={96} step={4} onChange={onPreviewSizeChange} />
      </Section>
      <Section
        label="Letter Spacing"
        display={letterSpacing > 0 ? `+${letterSpacing}` : `${letterSpacing}`}
      >
        <SliderRow value={letterSpacing} min={-200} max={300} step={5} onChange={onLetterSpacingChange} />
      </Section>
    </>
  );
}
