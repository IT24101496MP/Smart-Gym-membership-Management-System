const ServiceCard = ({ service }) => (
  <article className="service-card-v2">
    <div className="service-icon" aria-hidden="true">
      {service.icon}
    </div>
    <h3>{service.title}</h3>
    <p>{service.description}</p>
  </article>
);

export default ServiceCard;
