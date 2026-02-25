import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ClientRegistrationPage.css";

const ClientRegistrationPage = () => {

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
    digitalSignature: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.age) newErrors.age = "Age is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
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
      const response = await fetch("http://localhost:8080/api/clients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Client registered successfully!");
        setFormData({
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
          digitalSignature: ""
        });
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

          {/* First + Last Name */}
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? "error-field" : ""}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? "error-field" : ""}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          {/* Age + Gender */}
          <div className="form-row">
            <div className="form-group">
              <label>Age *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className={errors.age ? "error-field" : ""}
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? "error-field" : ""}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>
          </div>

          {/* Mobile + Land */}
          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className={errors.mobileNumber ? "error-field" : ""}
              />
              {errors.mobileNumber && <span className="error-message">{errors.mobileNumber}</span>}
            </div>

            <div className="form-group">
              <label>Land Phone</label>
              <input
                type="tel"
                name="landPhone"
                value={formData.landPhone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error-field" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className={errors.address ? "error-field" : ""}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          <p className="form-section-title">Emergency Contact</p>

          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Relationship</label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Emergency Contact Number</label>
            <input
              type="tel"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
            />
          </div>

          {/* Blood Group */}
          <div className="form-group">
            <label>Blood Group *</label>
            <input
              type="text"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className={errors.bloodGroup ? "error-field" : ""}
            />
            {errors.bloodGroup && <span className="error-message">{errors.bloodGroup}</span>}
          </div>

          {/* Profile Photo */}
          <div className="form-group">
            <label>Profile Photo</label>
            <input
              type="file"
              name="profilePhoto"
              onChange={handleChange}
            />
          </div>

          {/* Digital Signature */}
          <div className="form-group">
            <label>Digital Signature</label>
            <input
              type="text"
              name="digitalSignature"
              value={formData.digitalSignature}
              onChange={handleChange}
            />
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