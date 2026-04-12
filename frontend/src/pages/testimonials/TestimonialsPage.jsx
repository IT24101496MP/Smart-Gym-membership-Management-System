import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/Fat2fit Logo.jpg";
import { getRole, isAuthenticated } from "../../utils/auth";
import "./TestimonialsPage.css";

const testimonialsData = [
  {
    id: 1,
    memberName: "Nimali Perera",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=70",
    rating: 5,
    review:
      "The trainers actually care about progress. In three months, my strength and energy improved more than I expected.",
  },
  {
    id: 2,
    memberName: "Kavindu Silva",
    image: null,
    rating: 4,
    review:
      "Clean facility, great class timing, and friendly staff. The environment makes it easy to stay consistent.",
  },
  {
    id: 3,
    memberName: "Shenali Fernando",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=320&q=70",
    rating: 5,
    review:
      "I joined as a beginner and never felt judged. The coaching is practical and personalized.",
  },
  {
    id: 4,
    memberName: "Ravindu Jayasekara",
    image: null,
    rating: 5,
    review:
      "Excellent equipment and very good class structure. Highly recommend for anyone serious about fitness.",
  },
];

const fallbackAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23eceff1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23677280' font-family='Verdana' font-size='14'%3EMember%3C/text%3E%3C/svg%3E";

const renderStars = (rating) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
};

const initialsOf = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const TestimonialsPage = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [form, setForm] = useState({
    memberName: "",
    image: "",
    rating: "5",
    review: "",
  });
  const [formError, setFormError] = useState("");
  const canSubmitReview = authChecked && role === "CLIENT";

  const testimonials = useMemo(() => [...userReviews, ...testimonialsData], [userReviews]);

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await isAuthenticated();
      setRole(valid ? getRole() : null);
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  const handleImageError = (event) => {
    const img = event.currentTarget;
    if (img.dataset.fallback === "true") return;
    img.dataset.fallback = "true";
    img.src = fallbackAvatar;
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const submitReview = (event) => {
    event.preventDefault();
    setFormError("");

    if (!canSubmitReview) {
      setFormError("Only registered members can add reviews. Please log in with a member account.");
      return;
    }

    const reviewText = form.review.trim();
    const memberName = form.memberName.trim() || "Member";
    const rating = Number(form.rating);

    if (!reviewText) {
      setFormError("Please write your review before submitting.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError("Rating must be between 1 and 5.");
      return;
    }

    const newReview = {
      id: Date.now(),
      memberName,
      image: form.image.trim() || null,
      rating,
      review: reviewText,
    };

    setUserReviews((prev) => [newReview, ...prev]);
    setForm({
      memberName: "",
      image: "",
      rating: "5",
      review: "",
    });
  };

  return (
    <div className="testimonials-page">
      <header className="testimonials-header">
        <div className="brand-wrap">
          <img src={logo} alt="Fat2Fit logo" className="brand-logo" />
          <div>
            <h1>Member Testimonials</h1>
            <p>Real experiences from members who train with FAT2FIT.</p>
          </div>
        </div>

        <div className="header-links">
          <Link to="/membership-plans" className="header-link primary">Join Now</Link>
          <Link to="/login" className="header-link">Login</Link>
        </div>
      </header>

      <section className="review-entry-card">
        <h2>Add Your Review</h2>
        {!authChecked ? (
          <div className="friendly-error small">Checking your access...</div>
        ) : canSubmitReview ? (
          <form className="review-form" onSubmit={submitReview}>
            {formError && <p className="friendly-error small">{formError}</p>}

            <div className="review-form-grid">
              <label>
                Name
                <input
                  type="text"
                  name="memberName"
                  value={form.memberName}
                  onChange={onChange}
                  placeholder="Your name"
                />
              </label>

              <label>
                Rating
                <select name="rating" value={form.rating} onChange={onChange}>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </label>

              <label className="full">
                Image URL (optional)
                <input
                  type="url"
                  name="image"
                  value={form.image}
                  onChange={onChange}
                  placeholder="https://..."
                />
              </label>

              <label className="full">
                Review
                <textarea
                  name="review"
                  rows={4}
                  value={form.review}
                  onChange={onChange}
                  placeholder="Share your experience with the gym"
                />
              </label>
            </div>

            <button type="submit" className="header-link primary submit-review-btn">Submit Review</button>
          </form>
        ) : (
          <div className="friendly-error small">
            Only registered members can add reviews. Please <Link to="/login">log in</Link> with a member account.
          </div>
        )}
      </section>

      {testimonials.length === 0 ? (
        <div className="friendly-error">
          We could not load testimonials right now. Please try again shortly.
        </div>
      ) : (
        <section className="testimonials-grid">
          {testimonials.map((item) => (
            <article key={item.id} className="testimonial-card">
              <div className="member-row">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.memberName}
                    className="member-photo"
                    loading="lazy"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="member-photo member-initials" aria-label={item.memberName}>
                    {initialsOf(item.memberName)}
                  </div>
                )}

                <div>
                  <h2>{item.memberName}</h2>
                  <div className="rating" aria-label={`${item.rating} out of 5 stars`}>
                    {renderStars(item.rating)}
                  </div>
                </div>
              </div>

              <p className="review-text">"{item.review}"</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default TestimonialsPage;
