import { PortalButton } from "./PortalButton";
import { PortalDialog } from "./PortalDialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <PortalDialog
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <PortalButton variant="secondary" onClick={onClose}>
            {cancelLabel}
          </PortalButton>
          <PortalButton
            variant={destructive ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </PortalButton>
        </>
      }
    >
      <div className="text-sm text-slate-300">Esta ação só será aplicada depois da confirmação.</div>
    </PortalDialog>
  );
}
