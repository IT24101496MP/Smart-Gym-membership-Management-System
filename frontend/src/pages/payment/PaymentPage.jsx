import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import "./PaymentPage.css";

const PaymentPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams();

  const numericPlanId = useMemo(() => Number(planId), [planId]);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMe = async () => {
      setLoading(true);
      setError("");

      if (!Number.isInteger(numericPlanId) || numericPlanId <= 0) {
        setError("Invalid membership plan selected.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/api/auth/me");
        if (!mounted) return;

        if (data.role !== "CLIENT") {
          setError("Only clients can make membership payments.");
          setLoading(false);
          return;
        }

        setClientId(data.id);
      } catch {
        if (!mounted) return;
        setError("Unable to load your profile for payment.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMe();

    return () => {
      mounted = false;
    };
  }, [numericPlanId]);

  const handleCreateIntent = async () => {
    if (!clientId) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const { data } = await api.post("/api/payments/create-intent", {
        clientId,
        planId: numericPlanId,
        currency: "usd",
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data || "Failed to initialize payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!clientId || !result?.paymentIntentId) return;

    setConfirming(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/api/payments/confirm", {
        clientId,
        planId: numericPlanId,
        paymentReference: result.paymentIntentId,
      });

      if (data.status === "ALREADY_PROCESSED") {
        setSuccess("Payment already confirmed earlier. Membership is already active for this payment reference.");
      } else {
        setSuccess("Payment confirmed and membership activated successfully.");
      }
    } catch (err) {
      setError(err.response?.data || "Failed to confirm payment.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-card">
        <h1>Membership Payment</h1>
        <p className="payment-subtitle">
          Plan ID: <strong>{planId}</strong>
        </p>

        {loading && <p className="payment-info">Preparing payment details...</p>}
        {error && <p className="payment-error">{error}</p>}

        {!loading && !error && (
          <>
            <p className="payment-info">
              This test screen creates a local payment reference and then confirms it.
              Membership activation happens immediately after confirmation.
            </p>

            <button className="payment-primary" onClick={handleCreateIntent} disabled={submitting}>
              {submitting ? "Creating payment intent..." : "Create Payment Intent"}
            </button>

            {result && (
              <div className="payment-result">
                <h2>Payment Intent Created</h2>
                <p>
                  <strong>paymentIntentId:</strong> {result.paymentIntentId || "N/A"}
                </p>
                <p className="payment-note">
                  Click confirm below to complete test payment and activate membership.
                </p>
                <button className="payment-primary" onClick={handleConfirmPayment} disabled={confirming}>
                  {confirming ? "Confirming payment..." : "Confirm Payment (Test)"}
                </button>
              </div>
            )}

            {success && <p className="payment-success">{success}</p>}
          </>
        )}

        <div className="payment-actions">
          <button className="payment-secondary" onClick={() => navigate("/manage")}>Back to Manage</button>
          <button className="payment-secondary" onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
