import { useNavigate } from "react-router-dom";
import fat2fitLogo from "../../assets/Fat2fit Logo.jpg";
import priyankaraPhoto from "../../assets/about/priyankara.png";
import amalPriyashanthaPhoto from "../../assets/about/amal-priyashantha.png";
import ownerInstructorPhoto from "../../assets/about/owner-instructor.png";
import video1 from "../../assets/videos/v14044g50000d0nipsvog65lvd8jr7v0.MP4";
import video2 from "../../assets/videos/v14044g50000d0qs9nfog65va4je2r9g.MP4";
import video3 from "../../assets/videos/v14044g50000d1g3ddvog65ughp5du6g.MP4";
import video4 from "../../assets/videos/v1c044g50000d7av2jfog65l4k5bb0i0.MP4";
import video5 from "../../assets/videos/v14044g50000d0lssrfog65uofr3quug.MP4";
import video6 from "../../assets/videos/v14044g50000d6oi5ovog65tseb9cb70.MP4";
import "./AboutUsPage.css";

const teamMembers = [
  {
    id: "tm-owner",
    name: "Nilu Pathirana",
    role: "Owner & Instructor",
    image: ownerInstructorPhoto,
  },
  {
    id: "tm-1",
    name: "Priyankara",
    role: "Gym Instructor",
    image: priyankaraPhoto,
  },
  {
    id: "tm-2",
    name: "Amal Priyashantha",
    role: "Gym Instructor",
    image: amalPriyashanthaPhoto,
  },
];

const trainingVideos = [
  {
    id: "video-1",
    title: "Strength Training Session",
    src: video1,
  },
  {
    id: "video-2",
    title: "Cardio & Endurance",
    src: video2,
  },
  {
    id: "video-3",
    title: "Functional Training",
    src: video3,
  },
  {
    id: "video-4",
    title: "Group Training Session",
    src: video4,
  },
  {
    id: "video-5",
    title: "Personal Training Demo",
    src: video5,
  },
  {
    id: "video-6",
    title: "Advanced Training Session",
    src: video6,
  },
];

const AboutUsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-us-page">
      <div className="about-us-shell about-us-page-inner">
        <div className="about-us-hero-strip">
          <header className="about-us-hero">
            <div className="about-us-hero-text">
              <p className="about-us-kicker">Fat2Fit Wellness Studio</p>
              <h1>About Us</h1>
              <p className="about-us-hero-lead">
                Learn how we started, what drives us every day, and the people who help members build lasting
                fitness habits in Thalawathugoda and beyond.
              </p>
              <div className="about-us-hero-actions">
                <button type="button" className="about-us-btn primary" onClick={() => navigate("/")}>
                  Back to Home
                </button>
              </div>
            </div>
            <div className="about-us-hero-media">
              <div className="about-us-logo-ring">
                <img
                  src={fat2fitLogo}
                  alt="Fat2Fit Wellness Studio logo"
                  className="about-us-logo"
                  width={200}
                  height={200}
                />
              </div>
            </div>
          </header>
        </div>

        <div className="about-us-body">
          <section className="about-us-section about-us-history" aria-labelledby="about-history-heading">
            <div className="about-us-history-content">
              <h2 id="about-history-heading">Our story</h2>
              <p>
                Fat2Fit Wellness Studio began as a focused training space for people who wanted real results—not
                crowded floors and guesswork workouts. Founded by Nilu Pathirana with a vision to create an inclusive
                fitness environment where everyone feels welcome and supported, our gym has grown into a comprehensive
                wellness studio serving the Thalawathugoda community.
              </p>
              <p>
                Over the years, we have expanded our facilities and services to include state-of-the-art equipment,
                diverse group classes, and personalized training programs. Our commitment to excellence and member
                success has made us a trusted name in fitness transformation.
              </p>
              <p>
                We invest in modern equipment, clear programming, and coaches who take time to understand your
                goals. Whether you are starting out or leveling up, our history is built on one idea: consistent
                support creates confidence you can feel.
              </p>
            </div>
            <div className="about-us-history-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=960&q=75"
                alt="Training floor at a modern gym"
                loading="lazy"
                decoding="async"
                width={640}
                height={427}
              />
            </div>
          </section>

          <section className="about-us-mission-vision" aria-label="Mission and vision">
            <article className="about-us-card mission">
              <h2>Mission</h2>
              <p>
                To help every member train with purpose—through expert coaching, structured plans, and a positive
                community that keeps motivation high week after week. We are dedicated to creating sustainable fitness
                habits that transform lives and promote overall well-being.
              </p>
            </article>
            <article className="about-us-card vision">
              <h2>Vision</h2>
              <p>
                To be the wellness studio people trust for sustainable transformation: stronger bodies, clearer
                habits, and confidence that lasts beyond the gym floor. We envision a community where fitness is
                accessible to everyone, regardless of their starting point.
              </p>
            </article>
          </section>

          <section className="about-us-section about-us-team" aria-labelledby="about-team-heading">
            <div className="about-us-team-intro">
              <h2 id="about-team-heading">Meet the team</h2>
              <p>
                Our coaches combine experience with approachability—so you always know what to do next and why it
                matters. Led by owner Nilu Pathirana, our team is committed to your success.
              </p>
            </div>
            <div className="about-us-team-grid">
              {teamMembers.map((member) => (
                <article key={member.id} className="about-us-team-card">
                  <div className="about-us-team-photo">
                    <img
                      src={member.image}
                      alt={`${member.name}, ${member.role}`}
                      loading="lazy"
                      decoding="async"
                      width={320}
                      height={240}
                    />
                  </div>
                  <h3>{member.name}</h3>
                  <p className="about-us-team-role">{member.role}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="about-us-section about-us-videos" aria-labelledby="about-videos-heading">
            <div className="about-us-videos-intro">
              <h2 id="about-videos-heading">Training Sessions at Fat2Fit</h2>
              <p>
                Get a glimpse of the energy and expertise that define our training sessions. See how our members
                transform their fitness journey with our professional guidance.
              </p>
            </div>
            <div className="about-us-videos-grid">
              {trainingVideos.map((video) => (
                <div key={video.id} className="about-us-video-card">
                  <div className="about-us-video-container">
                    <video
                      controls
                      preload="metadata"
                      className="about-us-video"
                    >
                      <source src={video.src} type="video/mp4" />
                      Your browser does not support video tag.
                    </video>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
