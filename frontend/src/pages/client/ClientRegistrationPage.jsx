import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import "./ClientRegistrationPage.css";

const ClientRegistrationPage = () => {

  const sigCanvas = useRef(null);

  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    mobileNumber: "",
    landPhone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    bloodGroup: "",
    profilePhoto: null,
    digitalSignature: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData({ ...formData, [name]: file });

      if (name === "profilePhoto" && file) {
        setPhotoPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
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
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!formData.address.trim()) newErrors.address = "Address required";
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

      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formPayload.append(key, formData[key]);
        }
      });

      if (!sigCanvas.current.isEmpty()) {
        const signatureDataUrl = sigCanvas.current.toDataURL("image/png");
        const blob = await fetch(signatureDataUrl).then(res => res.blob());
        const file = new File([blob], "signature.png", { type: "image/png" });
        formPayload.append("digitalSignature", file);
      }

      const response = await fetch("http://localhost:8080/api/client/register", {
        method: "POST",
        body: formPayload
      });

      if (response.ok) {
        alert("Client registered successfully!");
        window.location.reload();
      } else {
        const error = await response.text();
        alert("Registration failed: " + error);
      }

    } catch (error) {
      alert("Server error occurred.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="registration-page">
      <div className="registration-container">

        <div className="registration-header">
          <div className="header-accent" />
          <div>
            <h1>Client Registration</h1>
            <p>Fill in your personal details</p>
          </div>
        </div>

        <form className="registration-form" onSubmit={handleSubmit}>

          <p className="form-section-title">Personal Information</p>

          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? "error-field" : ""}/>
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? "error-field" : ""}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age *</label>
              <input type="number" name="age"
                value={formData.age}
                onChange={handleChange}/>
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select name="gender"
                value={formData.gender}
                onChange={handleChange}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <input type="file"
              name="profilePhoto"
              accept="image/*"
              onChange={handleChange}/>
            {photoPreview && (
              <img src={photoPreview}
                   alt="Preview"
                   className="photo-preview"/>
            )}
          </div>

          <div className="form-group">
            <label>Digital Signature</label>
            <div className="signature-wrapper">
              <SignatureCanvas
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 180,
                  className: "signature-canvas"
                }}
                ref={sigCanvas}
              />
            </div>
            <button type="button"
                    className="clear-signature"
                    onClick={clearSignature}>
              Clear Signature
            </button>
          </div>

          <div className="form-actions">
            <button type="submit"
              className="submit-button"
              disabled={isSubmitting}>
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