import { useNavigate } from "react-router-dom";
import "./UnauthorizedPage.css";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <span className="unauthorized-code">403</span>
        <h1 className="unauthorized-title">Access Denied</h1>
        <p className="unauthorized-message">
          You do not have permission to view this page.
          Please contact an administrator if you believe this is a mistake.
        </p>
        <button className="unauthorized-btn" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
