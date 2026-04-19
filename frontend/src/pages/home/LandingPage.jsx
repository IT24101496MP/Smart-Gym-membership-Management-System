import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import fat2fitLogo from "../../assets/Fat2fit Logo.jpg";
import loginPageImg from "../../assets/Login page.jpg";
import { publicApi } from "../../utils/api";
import SectionHeading from "./components/SectionHeading";
import ServiceCard from "./components/ServiceCard";
import GalleryTabs from "./components/GalleryTabs";
import "./LandingPage.css";

const FALLBACK_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='760' viewBox='0 0 1200 760'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffd7b5'/%3E%3Cstop offset='100%25' stop-color='%23ff9e6d'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='760' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' fill='%237a2f13' font-family='Verdana' font-size='44' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const heroSlides = [
  {
    id: "hero-1",
    src: loginPageImg,
    alt: "Gym members training together",
  },
  {
    id: "hero-2",
    src: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=75",
    alt: "Strength training area",
  },
  {
    id: "hero-3",
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=75",
    alt: "Group class in progress",
  },
];

const services = [
  {
    icon: "PT",
    title: "Personal Training",
    description:
      "Certified trainers create personalized programs based on your body type, goals, and performance level.",
  },
  {
    icon: "GC",
    title: "Group Classes",
    description:
      "Energy-packed classes including HIIT, Zumba, and mobility sessions to keep workouts engaging.",
  },
  {
    icon: "ST",
    title: "Strength Training",
    description:
      "Structured strength zones with guided progression for beginners and advanced athletes.",
  },
  {
    icon: "NG",
    title: "Nutrition Guidance",
    description:
      "Practical nutrition advice and habit coaching to support fat loss, performance, and recovery.",
  },
];

const gallery = {
  Equipment: [
    {
      id: "eq-1",
      title: "Treadmill Zone",
      src: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "eq-3",
      title: "Yoga Mat",
      src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "eq-4",
      title: "Dumbbells",
      src: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "eq-6",
      title: "Rowing Machine",
      src: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "eq-7",
      title: "Push Up Bars",
      src: "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "eq-8",
      title: "Leg Curl Machine",
      src: "https://repfitness.com/cdn/shop/articles/lying-leg-curl.jpg?v=1770147928&width=1498",
    },
    {
      id: "eq-9",
      title: "Battle Ropes",
      src: "https://imagely.mirafit.co.uk/wp/wp-content/uploads/2023/01/woman-using-Mirafit-Battle-Ropes.jpg",
    },
    {
      id: "eq-10",
      title: "Medicine Balls",
      src: "https://source.unsplash.com/1200x800/?medicine-ball,gym",
    },
    {
      id: "eq-11",
      title: "Cable Crossover Machine",
      src: "https://www.lifespanfitness.com.au/cdn/shop/articles/Screenshot_14_bd9b9d33-6a91-4a26-aa95-79f847cbae5e.png?v=1658810374",
    },
  ],
  Classes: [
    {
      id: "cl-1",
      title: "Aerobics",
      src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "cl-2",
      title: "Zumba",
      src: "https://article-cdn.prod.gabit.com/cover/production/08-01-2024/d7be6248-36a9-433e-b4d2-724b2a688ef7/fbe8364e-9b96-4998-9191-ff6c69b34f22.png",
    },
    {
      id: "cl-3",
      title: "Yoga",
      src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "cl-4",
      title: "Muay Thai",
      src: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "cl-5",
      title: "Physiotherapy",
      src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "cl-6",
      title: "Counselling",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=75",
    },
  ],
  Events: [
    {
      id: "ev-1",
      title: "Transformation Challenge",
      src: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "ev-2",
      title: "Community Day",
      src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "ev-3",
      title: "Nutrition Talk",
      src: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=75",
    },
    {
      id: "ev-4",
      title: "Fitness Workshop",
      src: "https://hips.hearstapps.com/hmg-prod/images/sweaty-betty-broke-in-london-643e804609048.jpg",
    },
  ],
};

const galleryCategories = ["Equipment", "Classes", "Events"];

const transformationStories = [
  {
    id: "tr-1",
    name: "Nadeesha",
    highlight: "Noticeable fat-loss progress with a slimmer waistline, better posture, and a more confident shape.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEcY1Rgz_GogkV5Nl0f40T6AQxUJ0UnS03jw&s",
  },
  {
    id: "tr-2",
    name: "Kasun",
    highlight: "Strong muscle-building transformation with a leaner midsection and clearer chest, arm, and core definition.",
    image: "https://natfitpro.com/wp-content/uploads/tamilarasan-fitness-transformation-before-after-without-shirt.png",
  },
  {
    id: "tr-3",
    name: "Selena",
    highlight: "Balanced body-shape change with visible inch loss, a trimmer profile, and improved overall tone.",
    image: "https://rnt-marketing-assets.s3.eu-west-2.amazonaws.com/uploads/Picture_1_Ramya%201.png",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const contactMapUrl =
    "https://www.google.com/maps/place/fat2fit+wellness+studio+details/data=!4m2!3m1!1s0x3ae2577ee7ce83eb:0xf8780351070823f2?sa=X&ved=1t:242&ictx=111";

  const homeRef = useRef(null);
  const membershipRef = useRef(null);
  const galleryRef = useRef(null);
  const contactRef = useRef(null);

  const [heroIndex, setHeroIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Equipment");
  const [previewImage, setPreviewImage] = useState(null);
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: "", message: "" });
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!previewImage) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImage]);

  const visibleImages = useMemo(() => gallery[activeCategory] || [], [activeCategory]);

  const onImageError = (event) => {
    const image = event.currentTarget;
    if (image.src === FALLBACK_PLACEHOLDER) return;
    image.src = FALLBACK_PLACEHOLDER;
  };

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onContactFieldChange = (event) => {
    const { name, value } = event.target;
    setContactForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (contactStatus.message) {
      setContactStatus({ type: "", message: "" });
    }
  };

  const onContactSubmit = async (event) => {
    event.preventDefault();
    if (isSendingContact) return;

    setIsSendingContact(true);
    setContactStatus({ type: "", message: "" });

    try {
      const payload = {
        firstName: contactForm.firstName.trim(),
        lastName: contactForm.lastName.trim(),
        email: contactForm.email.trim(),
        phoneNumber: contactForm.phoneNumber.trim(),
        message: contactForm.message.trim(),
      };

      const response = await publicApi.post("/api/contact/send", payload);
      setContactStatus({
        type: "success",
        message: response?.data?.message || "Your message was sent successfully.",
      });
      setContactForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        message: "",
      });
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : "");

      setContactStatus({
        type: "error",
        message: backendMessage || "Unable to send your message right now. Please try again later.",
      });
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="landing-page-v2">
      <header className="top-nav">
        <button type="button" className="brand" onClick={() => scrollTo(homeRef)}>
          <img src={fat2fitLogo} alt="Fat2Fit logo" className="brand-logo" />
          <div>
            <p className="brand-eyebrow brand-full-name">FAT2FIT WELLNESS STUDIO</p>
          </div>
        </button>

        <nav className="main-menu" aria-label="Main navigation">
          <button type="button" onClick={() => scrollTo(homeRef)}>
            Home
          </button>
          <button type="button" onClick={() => navigate("/membership-plans")}>
            Membership
          </button>
          <button type="button" onClick={() => scrollTo(galleryRef)}>
            Gallery
          </button>
          <button type="button" onClick={() => navigate("/testimonials")}>
            Testimonials
          </button>
          <button type="button" onClick={() => navigate("/about-us")}>
            About Us
          </button>
          <button type="button" onClick={() => scrollTo(contactRef)}>
            Contact
          </button>
          <button type="button" className="nav-login-btn" onClick={() => navigate("/login")}>Log In</button>
        </nav>
      </header>

      <main>
        <section ref={homeRef} className="hero">
          <img
            src={heroSlides[heroIndex].src}
            alt={heroSlides[heroIndex].alt}
            className="hero-image"
            loading="eager"
            onError={onImageError}
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-kicker">Transform with purpose</p>
            <h1>Transform Your Body, Transform Your Life</h1>
            <p>
              Build consistency with expert coaching, structured plans, and a motivating fitness community.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate("/client/register")}>
                Join Now
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/login")}>
                Login
              </button>
            </div>
            <div className="hero-dots" aria-label="Hero slide selector">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`dot ${index === heroIndex ? "active" : ""}`}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section ref={membershipRef} className="about">
          <div className="about-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=75"
              alt="Gym member and trainer discussing progress"
              loading="lazy"
              onError={onImageError}
            />
          </div>
          <div className="about-content">
            <SectionHeading
              eyebrow="EXPERIENCE THE REAL DIFFERENCE"
              title="Why Fat2Fit can be a game changer"
              subtitle="Train in a focused space designed to keep you consistent and help you see results faster."
            />
            <div className="difference-banner">
              <span className="difference-chip">GAME CHANGER</span>
              <h3>More than a gym membership</h3>
              <p>Expert coaching, real accountability, and an environment built for visible progress.</p>
            </div>
            <p>
              Fat2Fit is more than equipment access. It is a space built for motivation, guided progress,
              and long-term change.
            </p>
            <ul className="difference-list">
              <li>Expert guidance for better workouts</li>
              <li>Structured routines that keep you motivated</li>
              <li>Modern machines, classes, and support in one place</li>
              <li>A positive atmosphere that builds confidence</li>
            </ul>
          </div>
        </section>

        <section ref={galleryRef} className="gallery-v2">
          <SectionHeading
            eyebrow="Inside our gym"
            title="Explore the gym experience"
            subtitle="Filter by category and preview full-size images of our equipment, classes, and events."
          />

          <GalleryTabs
            categories={galleryCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />

          <div className="gallery-grid-v2">
            {visibleImages.map((image) => (
              <button
                key={image.id}
                type="button"
                className="gallery-item"
                onClick={() => setPreviewImage({ ...image, category: activeCategory })}
              >
                <img
                  src={image.src}
                  alt={`${activeCategory} - ${image.title}`}
                  loading="lazy"
                  decoding="async"
                  onError={onImageError}
                  sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 33vw"
                />
                <span>{image.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="transformations-section">
          <SectionHeading
            eyebrow="Body Transformations"
            title="Real members. Real progress."
            subtitle="See how structured training, guidance, and consistency at Fat2Fit lead to visible changes."
          />
          <div className="transformations-grid">
            {transformationStories.map((story) => (
              <article key={story.id} className="transformation-card">
                <img src={story.image} alt={`${story.name} transformation`} loading="lazy" onError={onImageError} />
                <div className="transformation-content">
                  <h3>{story.name}</h3>
                  <p>{story.highlight}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-banner">
          <h2>Ready to begin your transformation?</h2>
          <p>
            Join Fat2Fit Wellness Studio today and train with coaches, programs, and a community focused on real results.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/client/register")}>
            Become a Member Today
          </button>
        </section>
      </main>

      <section className="contact-section" ref={contactRef}>
        <form className="contact-form-panel" onSubmit={onContactSubmit}>
          <p className="contact-kicker">Contact Us</p>
          <h2>Send us a message</h2>
          <p>Fill out the form below and our team will get back to you as soon as possible.</p>

          <div className="contact-form-grid">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              aria-label="First Name"
              value={contactForm.firstName}
              onChange={onContactFieldChange}
              required
              maxLength={80}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              aria-label="Last Name"
              value={contactForm.lastName}
              onChange={onContactFieldChange}
              required
              maxLength={80}
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              aria-label="Email Address"
              value={contactForm.email}
              onChange={onContactFieldChange}
              required
              maxLength={160}
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              aria-label="Phone Number"
              value={contactForm.phoneNumber}
              onChange={onContactFieldChange}
              required
              maxLength={20}
            />
          </div>

          <textarea
            name="message"
            placeholder="Message"
            aria-label="Message"
            rows={6}
            value={contactForm.message}
            onChange={onContactFieldChange}
            required
            maxLength={3000}
          />

          {contactStatus.message && (
            <p className={`contact-status ${contactStatus.type === "success" ? "success" : "error"}`}>
              {contactStatus.message}
            </p>
          )}

          <button type="submit" className="contact-send-btn" disabled={isSendingContact}>
            {isSendingContact ? "Sending..." : "Send"}
          </button>
        </form>

        <div className="contact-info-panel">
          <p className="contact-kicker">Get In Touch</p>
          <h2>We are here to support your fitness journey</h2>
          <p>
            Whether you have a question about memberships, classes, or training plans, the Fat2Fit team is ready
            to help you.
          </p>

          <div className="contact-divider" />

          <div className="contact-details-grid">
            <div className="contact-item contact-item-location">
              <h3>Location</h3>
              <div className="contact-location-map">
                <iframe
                  title="Fat2Fit Wellness Studio location"
                  src="https://www.google.com/maps?q=fat2fit+wellness+studio+thalawathugoda&z=16&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a href={contactMapUrl} target="_blank" rel="noreferrer">
                Open Fat2Fit Wellness Studio on Google Maps
              </a>
            </div>

            <div className="contact-side-info">
              <div className="contact-item">
                <h3>Call Us</h3>
                <a href="tel:0112273830">0112273830</a>
                <a href="tel:0765670060">0765670060</a>
              </div>

              <div className="contact-socials">
                <h3>Follow Our Social</h3>
                <a
                  href="https://www.facebook.com/watch/?v=1977915056471695"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/p/CsHSl2ghNNm/?utm_source=ig_web_copy_link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@fitbeast64?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noreferrer"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p className="copyright">Copyright 2026 Fat2Fit Wellness Studio. All rights reserved.</p>
      </footer>

      {previewImage && (
        <div
          className="lightbox-v2"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewImage(null)}
        >
          <div className="lightbox-content-v2" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-v2"
              aria-label="Close preview"
              onClick={() => setPreviewImage(null)}
            >
              x
            </button>
            <img
              src={previewImage.src}
              alt={`${previewImage.category} full preview`}
              onError={onImageError}
            />
            <p>{previewImage.title}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
