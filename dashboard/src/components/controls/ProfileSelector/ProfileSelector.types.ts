export interface ProfileSelectorProps {
  active: string;
  onChange: (profile: string) => void;
  profiles: string[];
}
