import { Dialog, DialogContent } from "@mui/material";
import useFormBuilderContext from "../../../hooks/useFormBuilderContext";
import { NpubList } from "./NpubList";

interface EditorProps {
  open: boolean;
  onCancel: () => void;
}

export const Editors: React.FC<EditorProps> = ({ open, onCancel }) => {
  const { editList, setEditList } = useFormBuilderContext();
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogContent>
        <NpubList
          NpubList={editList}
          setNpubList={setEditList}
          ListHeader={"Add Admins"}
        />
      </DialogContent>
    </Dialog>
  );
};
