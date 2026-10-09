export interface ServerTogglesProps {
  visible: string[];
  onToggle: (key: string) => void;
  onToggleTier: (keys: string[]) => void;
}
