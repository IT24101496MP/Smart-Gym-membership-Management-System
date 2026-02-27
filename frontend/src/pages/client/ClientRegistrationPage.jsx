import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import logo from "../../assets/Fat2fit Logo.jpg";
import "./ClientRegistrationPage.css";

const ClientRegistrationPage = () => {
  const sigCanvas = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    landPhone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    bloodGroup: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    profilePicture: null,
    digitalSignature: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData({ ...formData, [name]: file });

      if (name === "profilePicture" && file) {
        setPhotoPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const clearField = (fieldName) => {
    setFormData({ ...formData, [fieldName]: "" });
    if (fieldName === "profilePicture") setPhotoPreview(null);
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setFormData({ ...formData, digitalSignature: null });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
    if (!formData.age) newErrors.age = "Age required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!formData.address.trim()) newErrors.address = "Address required";
    if (!formData.password) newErrors.password = "Password required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "confirmPassword") return;
        if (formData[key] !== null && formData[key] !== "") {
          formPayload.append(key, formData[key]);
        }
      });

      if (!sigCanvas.current.isEmpty()) {
        const signatureDataUrl = sigCanvas.current.toDataURL("image/png");
        const blob = await fetch(signatureDataUrl).then((res) => res.blob());
        const file = new File([blob], "signature.png", { type: "image/png" });
        formPayload.append("digitalSignature", file);
      }

      const response = await fetch("http://localhost:8080/api/client/register", {
        method: "POST",
        body: formPayload,
      });

      if (response.ok) {
        alert("Registration successful!\nWelcome to Fat2Fit! Your client account has been created. You can now log in with your email and password.");
        window.location.reload();
      } else {
        const message = await response.text();
        console.error("Registration failed:", message);
        if (response.status === 409) {
          alert(`Registration failed: ${message}`);
        } else if (response.status === 400) {
          alert(`Registration failed: Invalid data submitted.\nDetails: ${message}`);
        } else {
          alert(`Registration failed (${response.status}): ${message || 'An unexpected error occurred. Please try again.'}`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Unable to connect to the server.\nPlease check your internet connection and try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        {/* Header */}
        <div className="registration-header">
          <div className="header-left">
            <div className="header-accent" />
            <div>
              <h1>Client Registration</h1>
              <p>Fill in your personal details</p>
            </div>
          </div>
          <img src={logo} alt="Fat2Fit Logo" className="header-logo" />
        </div>

        {/* Form */}
        <form className="registration-form" onSubmit={handleSubmit}>
          <p className="form-section-title">Personal Information</p>

          <div className="form-row">
            <div className="form-group clearable">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g., John"
              />
              <button type="button" onClick={() => clearField("firstName")}>Clear</button>
            </div>

            <div className="form-group clearable">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g., Cena"
              />
              <button type="button" onClick={() => clearField("lastName")}>Clear</button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group clearable">
              <label>Age *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g., 18"
              />
              <button type="button" onClick={() => clearField("age")}>Clear</button>
            </div>

            <div className="form-group clearable">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              <button type="button" onClick={() => clearField("dateOfBirth")}>Clear</button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group clearable">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              <button type="button" onClick={() => clearField("gender")}>Clear</button>
            </div>
          </div>

          <div className="form-group clearable">
            <label>Phone Number *</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., 0712345678"
            />
            <button type="button" onClick={() => clearField("phoneNumber")}>Clear</button>
          </div>

          <div className="form-group clearable">
            <label>Land Phone</label>
            <input
              type="text"
              name="landPhone"
              value={formData.landPhone}
              onChange={handleChange}
              placeholder="e.g., 0112345678"
            />
            <button type="button" onClick={() => clearField("landPhone")}>Clear</button>
          </div>

          <div className="form-group clearable">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., john.cena@example.com"
            />
            <button type="button" onClick={() => clearField("email")}>Clear</button>
          </div>

          <div className="form-group clearable">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street, Kiribathgoda"
            />
            <button type="button" onClick={() => clearField("address")}>Clear</button>
          </div>

          <div className="form-row">
            <div className="form-group clearable">
              <label>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
              <button type="button" onClick={() => clearField("bloodGroup")}>Clear</button>
            </div>

            <div className="form-group clearable">
              <label>Profile Picture</label>
              <input type="file" name="profilePicture" accept="image/*" onChange={handleChange} />
              <button type="button" onClick={() => clearField("profilePicture")}>Clear</button>

              {photoPreview && (
                <div className="photo-preview-wrapper">
                  <img src={photoPreview} alt="Profile Preview" className="photo-preview" />
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <p className="form-section-title">Emergency Contact</p>
          <div className="form-row">
            <div className="form-group clearable">
              <label>Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="e.g., Mary Jones"
              />
              <button type="button" onClick={() => clearField("emergencyContactName")}>Clear</button>
            </div>

            <div className="form-group clearable">
              <label>Relationship</label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                placeholder="e.g., Mother"
              />
              <button type="button" onClick={() => clearField("emergencyContactRelationship")}>Clear</button>
            </div>
          </div>

          <div className="form-group clearable">
            <label>Contact Number</label>
            <input
              type="text"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              placeholder="e.g., 0712345678"
            />
            <button type="button" onClick={() => clearField("emergencyContactNumber")}>Clear</button>
          </div>

          {/* Signature */}
          <p className="form-section-title">Account Security</p>
          <div className="form-row">
            <div className="form-group clearable">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
              />
              <button type="button" onClick={() => clearField("password")}>Clear</button>
            </div>
            <div className="form-group clearable">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
              />
              <button type="button" onClick={() => clearField("confirmPassword")}>Clear</button>
            </div>
          </div>

          <p className="form-section-title">Digital Signature</p>
          <div className="signature-wrapper">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ className: "signature-canvas", width: 500, height: 200 }}
            />
            <button type="button" className="clear-signature" onClick={clearSignature}>
              Clear Signature
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Register"}
            </button>
          </div>

          <p className="signin-prompt">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ClientRegistrationPage;