import { BENEFITS, BENEFITS_TITLE } from '../content';

/** Section 2 — Les 4 piliers de valeur. */
export function Benefits() {
  return (
    <section id="atouts" className="fl-atouts">
      <h2 className="fl-h2">{BENEFITS_TITLE}</h2>
      <div className="fl-cards">
        {BENEFITS.map(({ icon: Icon, color, tone, title, text }) => (
          <article key={title} className={`fl-card ${tone}`}>
            <Icon size={46} color={color} strokeWidth={1.8} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}