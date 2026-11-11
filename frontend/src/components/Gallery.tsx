"use client";
import { useState } from "react";
import Modal from "./Modal";
import { fallbackImg, imgUrl } from "@/lib/utils";

export default function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState(false); const [idx, setIdx] = useState(0);
  const show = (i: number) => { setIdx(i); setOpen(true); };
  const main = photos.slice(0, 5);
  return (
    <>
      <div className={`gallery g${Math.min(main.length, 5)}`}>
        {main.map((p, i) => <button key={i} className="g-item" onClick={() => show(i)} aria-label={`Open photo ${i + 1}`}><img src={imgUrl(p)} alt={`${title} – photo ${i + 1}`} onError={fallbackImg} /></button>)}
        <button className="show-all" onClick={() => show(0)}>▦ Show all photos</button>
      </div>
      {open && (
        <Modal title={`${idx + 1} / ${photos.length}`} wide onClose={() => setOpen(false)}>
          <div className="viewer">
            <button className="v-nav" onClick={() => setIdx((idx - 1 + photos.length) % photos.length)} aria-label="Previous">‹</button>
            <img src={imgUrl(photos[idx])} alt={`${title} – photo ${idx + 1}`} onError={fallbackImg} />
            <button className="v-nav" onClick={() => setIdx((idx + 1) % photos.length)} aria-label="Next">›</button>
          </div>
          <div className="thumbs">{photos.map((p, i) => <img key={i} src={imgUrl(p)} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} alt="" onError={fallbackImg} />)}</div>
        </Modal>
      )}
    </>
  );
}
