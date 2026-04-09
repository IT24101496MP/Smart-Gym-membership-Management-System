import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import "./PaymentPage.css";

const normalizeIntentPayload = (payload) => ({
  checkoutUrl: payload?.checkoutUrl || payload?.checkout_url || null,
  merchantId: payload?.merchantId || payload?.merchant_id || null,
  returnUrl: payload?.returnUrl || payload?.return_url || "",
  cancelUrl: payload?.cancelUrl || payload?.cancel_url || "",
  notifyUrl: payload?.notifyUrl || payload?.notify_url || "",
  firstName: payload?.firstName || payload?.first_name || "",
  lastName: payload?.lastName || payload?.last_name || "",
  email: payload?.email || "",
  phone: payload?.phone || "",
  address: payload?.address || "",
  city: payload?.city || "",
  country: payload?.country || "",
  orderId: payload?.orderId || payload?.order_id || payload?.paymentIntentId || "",
  items: payload?.items || "Membership Payment",
  currency: payload?.currency || "LKR",
  amount: payload?.amount || "",
  hash: payload?.hash || "",
  paymentIntentId: payload?.paymentIntentId || payload?.payment_intent_id || payload?.orderId || "",
  status: payload?.status || "",
});

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
  const [uploadingProof, setUploadingProof] = useState(false);
  const [manualMethod, setManualMethod] = useState("BANK_TRANSFER");
  const [manualReference, setManualReference] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState(null);

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

  const confirmPayment = async (paymentReference) => {
    if (!clientId || !paymentReference) return;

    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/api/payments/confirm", {
        clientId,
        planId: numericPlanId,
        paymentReference,
      });

      if (data.status === "ALREADY_PROCESSED") {
        setSuccess("Payment already confirmed earlier. Membership is already active for this payment reference.");
      } else {
        setSuccess("Payment confirmed and membership activated successfully.");
      }
    } catch (err) {
      setError(err.response?.data || "Failed to confirm payment.");
    }
  };

  const handleConfirmPayment = async () => {
    if (!result?.paymentIntentId) return;

    setConfirming(true);
    await confirmPayment(result.paymentIntentId);
    setConfirming(false);
  };

  const handlePayhereCheckout = () => {
    submitPayhereForm(result);
  };

  const submitPayhereForm = (intentPayload) => {
    const requiredFields = [
      "checkoutUrl",
      "merchantId",
      "orderId",
      "amount",
      "currency",
      "hash",
    ];

    const missing = requiredFields.filter((field) => !intentPayload?.[field]);
    if (missing.length > 0) {
      setError(`PayHere checkout parameters are missing from server response: ${missing.join(", ")}. Please create payment intent again.`);
      return;
    }

    const form = document.createElement("form");
    form.method = "post";
    form.action = intentPayload.checkoutUrl;

    const fields = {
      merchant_id: intentPayload.merchantId,
      return_url: intentPayload.returnUrl,
      cancel_url: intentPayload.cancelUrl,
      notify_url: intentPayload.notifyUrl,
      first_name: intentPayload.firstName,
      last_name: intentPayload.lastName,
      email: intentPayload.email,
      phone: intentPayload.phone,
      address: intentPayload.address,
      city: intentPayload.city,
      country: intentPayload.country,
      order_id: intentPayload.orderId,
      items: intentPayload.items,
      currency: String(intentPayload.currency).toUpperCase(),
      amount: intentPayload.amount,
      hash: intentPayload.hash,
      custom_1: String(clientId || ""),
      custom_2: String(numericPlanId || ""),
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value ?? "";
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
  };

  const handleCardPayhere = async () => {
    if (!clientId) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/api/payments/create-intent", {
        clientId,
        planId: numericPlanId,
        currency: "usd",
      });
      const normalized = normalizeIntentPayload(data);
      setResult(normalized);
      submitPayhereForm(normalized);
    } catch (err) {
      setError(err.response?.data || "Failed to initialize card payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBankTransfer = async () => {
    if (!clientId) return;

    if (manualMethod !== "BANK_TRANSFER") {
      setError("Proof upload flow is only available for Bank Transfer.");
      return;
    }

    if (!manualReference.trim()) {
      setError("Reference number is required for bank transfer.");
      return;
    }

    if (!manualAmount || Number(manualAmount) <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    if (!proofFile) {
      setError("Please upload your bank transfer proof file.");
      return;
    }

    setUploadingProof(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("clientId", String(clientId));
      formData.append("membershipPlanId", String(numericPlanId));
      formData.append("paymentAmount", String(manualAmount));
      formData.append("paymentDate", manualDate);
      formData.append("referenceNumber", manualReference.trim());
      formData.append("proofFile", proofFile);

      const { data } = await api.post("/api/payments/submit-bank-transfer", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(data?.message || "Bank transfer submitted for staff approval.");
      setProofFile(null);
      setManualReference("");
    } catch (err) {
      setError(err.response?.data || "Failed to submit bank transfer proof.");
    } finally {
      setUploadingProof(false);
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
              Start by creating a payment intent, then proceed to secure PayHere checkout.
              Membership will activate after PayHere sends a verified payment notification.
            </p>

            {result && (
              <div className="payment-result">
                <h2>Payment Intent Created</h2>
                <p>
                  <strong>orderId:</strong> {result.orderId || "N/A"}
                </p>
                <p>
                  <strong>amount:</strong> {result.amount || "N/A"}
                </p>
                <p>
                  <strong>currency:</strong> {result.currency || "N/A"}
                </p>
                <p className="payment-note">
                  Continue with PayHere Checkout API, or use mock confirmation for local testing.
                </p>

                <button
                  className="payment-primary"
                  onClick={handlePayhereCheckout}
                  disabled={confirming || submitting}
                >
                  {confirming ? "Processing payment..." : "Proceed to PayHere"}
                </button>
                <button className="payment-primary" onClick={handleConfirmPayment} disabled={confirming}>
                  {confirming ? "Confirming payment..." : "Confirm Payment (Test)"}
                </button>
              </div>
            )}

            <div className="payment-result bank-transfer-block">
              <h2>Payment Method</h2>

              <div className="payment-form-grid">
                <label>
                  Payment Method
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                  </select>
                </label>

                {manualMethod === "BANK_TRANSFER" && (
                  <>
                    <label>
                      Amount
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        placeholder="e.g. 5000.00"
                      />
                    </label>

                    <label>
                      Payment Date
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                      />
                    </label>

                    <label>
                      Reference Number
                      <input
                        type="text"
                        value={manualReference}
                        onChange={(e) => setManualReference(e.target.value)}
                        placeholder="Transaction reference"
                      />
                    </label>

                    <label className="full-width">
                      Upload Proof (image/pdf)
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </>
                )}
              </div>

              {manualMethod === "BANK_TRANSFER" && (
                <>
                  <p className="payment-note">
                    Upload transfer proof and submit for staff approval.
                  </p>
                  <button className="payment-primary" onClick={handleSubmitBankTransfer} disabled={uploadingProof}>
                    {uploadingProof ? "Submitting..." : "Submit for Staff Approval"}
                  </button>
                </>
              )}

              {manualMethod === "CARD" && (
                <>
                  <p className="payment-note">
                    Card payments are processed via PayHere Checkout.
                  </p>
                  <button className="payment-primary" onClick={handleCardPayhere} disabled={submitting}>
                    {submitting ? "Redirecting to PayHere..." : "Pay with PayHere"}
                  </button>
                </>
              )}

              {manualMethod === "CASH" && (
                <p className="payment-note">
                  Cash payments are recorded by staff at the gym front desk.
                </p>
              )}
            </div>

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
