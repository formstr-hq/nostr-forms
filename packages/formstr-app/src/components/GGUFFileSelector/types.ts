export interface GGUFFileSelectorProps {
  onFileSelected: (file: File) => Promise<void>;
  loading?: boolean;
  selectedFileName?: string;
  placeholder?: string;
}
