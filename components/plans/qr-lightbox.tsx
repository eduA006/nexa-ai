"use client";

import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";
import { X } from "lucide-react";

export function QrLightbox() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="win98-panel group relative shrink-0 cursor-zoom-in overflow-hidden bg-card p-1 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        aria-label="Ampliar código QR de Yape"
      >
        <Image src="/yape-qr.jpg" alt="Código QR de Yape" width={160} height={220} className="h-auto w-40" />
        <span className="win98-titlebar absolute inset-x-0 bottom-0 translate-y-full py-1 text-center text-[11px] font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          Toca para ampliar
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0">
          <div className="win98-panel relative bg-card p-2">
            <Dialog.Close
              className="win98-titlebar-btn absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center bg-secondary text-secondary-foreground"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
            <Image
              src="/yape-qr.jpg"
              alt="Código QR de Yape"
              width={340}
              height={480}
              className="h-auto w-[min(80vw,320px)]"
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
