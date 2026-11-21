import { Plus } from 'lucide-react';
import { FAQ_HEADER, FAQ_ITEMS } from '../content';

/** Section 3 — Foire aux questions. */
export function Faq() {
  return (
    <section id="faq" className="fl-faq">
      <h2 className="fl-h2">{FAQ_HEADER.title}</h2>
      <div className="fl-faq-list">
        {FAQ_ITEMS.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}<Plus className="fl-plus" size={20} aria-hidden="true" /></summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}