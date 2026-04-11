import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Fat2fit Logo.jpg";
import heroImage from "../../assets/Login page.jpg";
import "./HomePage.css";

const galleryData = [
  {
    category: "Equipment",
    images: [
      {
        title: "Strength Zone",
        src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=70",
      },
      {
        title: "Cardio Floor",
        src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=70",
      },
      {
        title: "Functional Rack",
        src: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=70",
      },
    ],
  },
  {
    category: "Classes",
    images: [
      {
        title: "Group Workout",
        src: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=900&q=70",
      },
      {
        title: "Yoga Session",
        src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=70",
      },
      {
        title: "HIIT Class",
        src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70",
      },
    ],
  },
  {
    category: "Events",
    images: [
      {
        title: "Community Challenge",
        src: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70",
      },
      {
        title: "Transformation Event",
        src: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=70",
      },
      {
        title: "Fitness Carnival",
        src: "https://images.unsplash.com/photo-1517343985841-f8b2d66e010b?auto=format&fit=crop&w=900&q=70",
      },
    ],
  },
];

const serviceCards = [
  { title: "Strength Training", text: "Modern resistance equipment and guided progression plans." },
  { title: "Group Classes", text: "High-energy sessions including cardio, yoga, and functional circuits." },
  { title: "Recovery & Wellness", text: "Stretching, mobility, and support programs to sustain performance." },
  { title: "Member Coaching", text: "Goal-based coaching with regular progress tracking and motivation." },
];

const membershipHighlights = [
  { title: "Single", text: "Flexible options for individual training and focused routines." },
  { title: "Couple", text: "Shared plans for partners with better value and accountability." },
  { title: "Family", text: "Multiple-member options designed for long-term healthy lifestyles." },
];

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='520'%3E%3Crect width='100%25' height='100%25' fill='%23f1f3f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236c757d' font-family='Verdana' font-size='26'%3EImage currently unavailable%3C/text%3E%3C/svg%3E";

const HomePage = () => {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(null);

  const gallerySections = useMemo(
    () => galleryData.filter((section) => Array.isArray(section.images) && section.images.length > 0),
    []
  );
  const contentError =
    gallerySections.length === 0 ? "We could not load content right now. Please refresh and try again." : "";

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const goToMembershipSection = () => {
    document.getElementById("membership-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleImageError = (event) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied === "true") return;
    target.dataset.fallbackApplied = "true";
    target.src = placeholderImage;
  };

  return (
    <div className="home-page">
      <header className="home-nav">
        <div className="brand-block">
          <img src={logo} alt="Fat2Fit logo" />
          <div>
            <h1>FAT2FIT Wellness Studio</h1>
            <p>Train stronger. Live healthier.</p>
          </div>
        </div>

        <div className="nav-actions">
          <button className="ghost-btn" onClick={() => navigate("/login")}>Login</button>
          <button className="solid-btn" onClick={goToMembershipSection}>Join Now</button>
        </div>
      </header>

      {contentError && <div className="content-error">{contentError}</div>}

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Your Transformation Starts Here</p>
          <h2>Fitness that feels personal, motivating, and sustainable.</h2>
          <p>
            Explore our gym spaces, discover class experiences, and find membership options that align with
            your goals. FAT2FIT combines coaching, community, and modern facilities under one roof.
          </p>
          <div className="hero-cta">
            <button className="solid-btn" onClick={goToMembershipSection}>Explore Membership</button>
            <button className="ghost-btn" onClick={() => navigate("/login")}>Member Login</button>
          </div>
        </div>

        <div className="hero-image-card">
          <img src={heroImage} alt="FAT2FIT training environment" loading="eager" />
          <div className="hero-badge">New member orientation every week</div>
        </div>
      </section>

      <section className="services-section">
        <h3>Key Services</h3>
        <div className="services-grid">
          {serviceCards.map((service) => (
            <article key={service.title}>
              <h4>{service.title}</h4>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="membership-section" className="membership-section">
        <h3>Membership Section</h3>
        <p className="membership-subtext">
          Choose the plan type that suits your lifestyle, then continue to registration.
        </p>

        <div className="membership-grid">
          {membershipHighlights.map((plan) => (
            <article key={plan.title}>
              <h4>{plan.title}</h4>
              <p>{plan.text}</p>
            </article>
          ))}
        </div>

        <button className="solid-btn" onClick={() => navigate("/client/register")}>Start Joining</button>
      </section>

      <section className="gallery-section">
        <h3>Gym Gallery</h3>
        <p>See our facilities, classes, and event atmosphere before you step in.</p>

        {gallerySections.length === 0 ? (
          <div className="content-error">Gallery is currently unavailable. Please check back shortly.</div>
        ) : (
          gallerySections.map((section) => (
            <div key={section.category} className="gallery-category-block">
              <h4>{section.category}</h4>
              <div className="gallery-grid">
                {section.images.map((image) => (
                  <button
                    type="button"
                    className="gallery-card"
                    key={`${section.category}-${image.title}`}
                    onClick={() => setActiveImage({ ...image, category: section.category })}
                  >
                    <img
                      src={image.src}
                      alt={`${section.category} - ${image.title}`}
                      loading="lazy"
                      width="380"
                      height="240"
                      onError={handleImageError}
                    />
                    <span>{image.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {activeImage && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActiveImage(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setActiveImage(null)}>
              Close
            </button>
            <img src={activeImage.src} alt={activeImage.title} onError={handleImageError} />
            <p>{activeImage.category} • {activeImage.title}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
