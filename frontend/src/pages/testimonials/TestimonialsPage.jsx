import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TestimonialsPage.css";

const testimonialsData = [
  {
    id: "t-1",
    name: "Nadeesha Perera",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=70",
    review:
      "I joined with low confidence and now I feel stronger every week. The trainers are supportive and the atmosphere keeps me motivated.",
  },
  {
    id: "t-2",
    name: "Kasun Maduranga",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=70",
    review:
      "The programs are structured and practical. I lost weight, gained strength, and the progress tracking helped me stay consistent.",
  },
  {
    id: "t-3",
    name: "Selena Fernando",
    rating: 4,
    image: "",
    review:
      "Group classes are energetic and beginner friendly. I especially like how instructors correct form and encourage everyone equally.",
  },
  {
    id: "t-4",
    name: "Ravindu Silva",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=70",
    review:
      "Clean facility, modern equipment, and a friendly team. Fat2Fit feels like a community, not just another gym.",
  },
  {
    id: "t-5",
    name: "Amali Jayasinghe",
    rating: null,
    image: "",
    review:
      "I was nervous at first, but the staff made everything easy. My routine is now more disciplined and I feel healthier.",
  },
];

const renderStars = (rating) => {
  if (!rating) return "Rating not provided";
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
};

const initialReviewForm = {
  name: "",
  image: "",
  rating: "5",
  review: "",
};

const TestimonialsPage = () => {
  const navigate = useNavigate();
  const testimonials = useMemo(() => testimonialsData, []);
  const [reviews, setReviews] = useState(testimonials);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);

  const onReviewFieldChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const onReviewSubmit = (event) => {
    event.preventDefault();

    const trimmedName = reviewForm.name.trim();
    const trimmedReview = reviewForm.review.trim();
    const trimmedImage = reviewForm.image.trim();
    const parsedRating = Number(reviewForm.rating);

    if (!trimmedName || !trimmedReview) return;

    const newReview = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      rating: Number.isNaN(parsedRating) ? null : Math.min(5, Math.max(1, parsedRating)),
      image: trimmedImage,
      review: trimmedReview,
    };

    setReviews((previous) => [newReview, ...previous]);
    setReviewForm(initialReviewForm);
  };

  return (
    <div className="testimonials-page">
      <section className="testimonials-hero">
        <p className="testimonials-kicker">Member Stories</p>
        <h1>Testimonials</h1>
        <p>
          Hear from our members and see how consistent coaching, structured plans, and supportive trainers at
          Fat2Fit lead to real confidence and progress.
        </p>
        <button type="button" className="testimonials-back-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </section>

      <section className="review-form-section" aria-label="Write a review">
        <h2>Write a Review</h2>
        <p>Share your experience with Fat2Fit to help new members feel confident about joining.</p>

        <form className="review-form" onSubmit={onReviewSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={reviewForm.name}
              onChange={onReviewFieldChange}
              placeholder="Enter your name"
              maxLength={80}
              required
            />
          </label>

          <label>
            Profile Image URL (optional)
            <input
              type="url"
              name="image"
              value={reviewForm.image}
              onChange={onReviewFieldChange}
              placeholder="https://example.com/photo.jpg"
            />
          </label>

          <label>
            Rating
            <select name="rating" value={reviewForm.rating} onChange={onReviewFieldChange}>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very Good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </label>

          <label className="review-message-field">
            Review
            <textarea
              name="review"
              rows={5}
              value={reviewForm.review}
              onChange={onReviewFieldChange}
              placeholder="Tell us about your experience"
              maxLength={1000}
              required
            />
          </label>

          <button type="submit" className="review-submit-btn">
            Submit Review
          </button>
        </form>
      </section>

      <section className="testimonials-grid" aria-label="Member testimonials">
        {reviews.map((item) => (
          <article key={item.id} className="testimonial-card">
            <div className="testimonial-header">
              {item.image ? (
                <img src={item.image} alt={`${item.name} profile`} />
              ) : (
                <div className="testimonial-avatar-fallback" aria-hidden="true">
                  {item.name
                    .split(" ")
                    .map((token) => token[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div>
                <h2>{item.name}</h2>
                <p className={`testimonial-rating ${item.rating ? "available" : "unavailable"}`}>
                  {renderStars(item.rating)}
                </p>
              </div>
            </div>
            <p className="testimonial-review">{item.review}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default TestimonialsPage;
