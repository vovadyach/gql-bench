export interface ServerTogglesProps {
  visible: string[];
  available: string[]; // servers with results in the current profile
  onToggle: (key: string) => void;
  onToggleTier: (keys: string[]) => void;
}
