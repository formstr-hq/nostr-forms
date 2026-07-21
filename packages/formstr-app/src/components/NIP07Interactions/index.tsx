import { Dialog, DialogContent } from "@mui/material";
import { Event, UnsignedEvent } from "nostr-tools";
import { useEffect, useState } from "react";
import { signerManager } from "../../signer";

export enum Actions {
  GET_PUBKEY,
  SIGN_EVENT,
  NIP04_ENCRYPT,
  NIP04_DECRYPT,
  NIP44_ENCRYPT,
  NIP44_DECRYPT,
  GET_RELAYS,
}

interface NIP07InteractionProps {
  action: Actions;
  ModalMessage: string;
  callback: (returnValue: string | Event) => void;
  senderPubKey?: string;
  plainText?: string;
  event?: UnsignedEvent;
  cipherText?: string;
  receiverPubkey?: string;
}

export const NIP07Interactions: React.FC<NIP07InteractionProps> = ({
  action,
  ModalMessage,
  callback,
  event,
  plainText,
  cipherText,
  senderPubKey,
}) => {
  const executeAction = async () => {
    const signer = await signerManager.getSigner();
    setShowModal(true);
    let returnValue: string | Event = "";
    if (action === Actions.GET_PUBKEY) {
      returnValue = await signer.getPublicKey();
    } else if (action === Actions.SIGN_EVENT) {
      returnValue = await signer.signEvent(event!);
    } else if (action === Actions.NIP44_ENCRYPT) {
      let pubKey = await signer.getPublicKey();
      if (!plainText) {
        throw Error("No message provided to encrypt");
      }
      returnValue = await signer.nip44Encrypt!(pubKey, plainText);
    } else if (action === Actions.NIP44_DECRYPT) {
      if (!cipherText) {
        throw Error("No message provided to decrypt");
      }
      if (!senderPubKey) {
        throw Error("No message provided to decrypt");
      }
      returnValue = await signer.nip44Decrypt!(senderPubKey, cipherText);
    } else if (action === Actions.NIP04_DECRYPT) {
      if (!cipherText) {
        throw Error("No message provided to decrypt");
      }
      if (!senderPubKey) {
        throw Error("No message provided to decrypt");
      }
      returnValue = await signer.decrypt!(senderPubKey, cipherText);
    } else if (action === Actions.NIP04_ENCRYPT) {
      let pubKey = await signer.getPublicKey();
      if (!plainText) {
        throw Error("No message provided to decrypt");
      }
      returnValue = await signer.encrypt!(pubKey, plainText);
    } else {
      throw Error("NOT A RECOGNIZED ACTION");
    }
    setShowModal(false);
    callback(returnValue);
    return;
  };
  useEffect(() => {
    executeAction();
  }, []);
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <Dialog open={showModal}>
      <DialogContent>{ModalMessage}</DialogContent>
    </Dialog>
  );
};
