const SectionHeading = ({ eyebrow, title, subtitle }) => (
  <div className="section-heading">
    {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
    <h2>{title}</h2>
    {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
  </div>
);

export default SectionHeading;
