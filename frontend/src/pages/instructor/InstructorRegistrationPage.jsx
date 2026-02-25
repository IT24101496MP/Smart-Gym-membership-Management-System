import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './InstructorRegistrationPage.css';

const InstructorRegistrationPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    qualification: '',
    areasOfSpecialization: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
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
      const response = await fetch('http://localhost:8080/api/instructors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Form submitted for review successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          address: '',
          qualification: '',
          areasOfSpecialization: ''
        });
      } else {
        const error = await response.text();
        alert(`Registration failed: ${error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">

        {/* Header */}
        <div className="registration-header">
          <div className="header-accent" />
          <div>
            <h1>Instructor Registration</h1>
            <p>Fill in the details below. Required fields are marked <span style={{color:'#dc2626'}}>*</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="registration-form" noValidate>

          {/* Personal Information */}
          <p className="form-section-title">Personal Information</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name <span className="required-star">*</span></label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className={errors.firstName ? 'error-field' : ''}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name <span className="required-star">*</span></label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className={errors.lastName ? 'error-field' : ''}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email <span className="required-star">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="perera123@gmail.com"
                className={errors.email ? 'error-field' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number <span className="required-star">*</span></label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+94 77 123 4567"
                className={errors.phoneNumber ? 'error-field' : ''}
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address <span className="required-star">*</span></label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              placeholder="123 Main St, Colombo, Sri Lanka"
            />
          </div>

          {/* Professional Information */}
          <p className="form-section-title">Professional Information</p>

          <div className="form-group">
            <label htmlFor="qualification">Qualification</label>
            <textarea
              id="qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              rows="2"
              placeholder="e.g. BSc in Sports Science"
            />
          </div>

          <div className="form-group">
            <label htmlFor="areasOfSpecialization">Areas of Specialization</label>
            <input
              type="text"
              id="areasOfSpecialization"
              name="areasOfSpecialization"
              value={formData.areasOfSpecialization}
              onChange={handleChange}
              placeholder="e.g. Yoga, Pilates, Strength Training"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          <p className="signin-prompt">
            Already have an account?{' '}
            <Link to="/login" className="signin-link">Sign in</Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default InstructorRegistrationPage;