import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../utils/api';
import './InstructorRegistrationPage.css';

const InstructorRegistrationPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phoneNumber: '',
    landPhone: '',
    address: '',
    qualification: '',
    yearsOfExperience: '',
    areasOfSpecialization: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.age || Number(formData.age) <= 0) {
      newErrors.age = 'Valid age is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
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
    if (formData.yearsOfExperience !== '' && (isNaN(formData.yearsOfExperience) || Number(formData.yearsOfExperience) < 0)) {
      newErrors.yearsOfExperience = 'Years of experience cannot be negative';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword: _, ...payload } = formData;
      await publicApi.post('/api/instructor/register', payload);
      alert('Application submitted successfully!\nYour instructor profile is now under review. You will be notified by email once an admin approves your account.');
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phoneNumber: '',
        landPhone: '',
        address: '',
        qualification: '',
        yearsOfExperience: '',
        areasOfSpecialization: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      const status  = error.response?.status;
      const message = error.response?.data || 'An unexpected error occurred. Please try again.';
      console.error('Registration failed:', message);
      if (status === 409) {
        alert(`Registration failed: ${message}`);
      } else if (status === 400) {
        alert(`Registration failed: Invalid data submitted.\nDetails: ${message}`);
      } else {
        alert(`Registration failed (${status ?? 'Network Error'}): ${message}`);
      }
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
              <label htmlFor="age">Age <span className="required-star">*</span></label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g., 30"
                min="18"
                className={errors.age ? 'error-field' : ''}
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth <span className="required-star">*</span></label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? 'error-field' : ''}
              />
              {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender <span className="required-star">*</span></label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? 'error-field' : ''}
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number <span className="required-star">*</span></label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g., 0771234567"
                className={errors.phoneNumber ? 'error-field' : ''}
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
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
              <label htmlFor="landPhone">Land Phone</label>
              <input
                type="tel"
                id="landPhone"
                name="landPhone"
                value={formData.landPhone}
                onChange={handleChange}
                placeholder="e.g., 0112345678"
              />
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
              className={errors.address ? 'error-field' : ''}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          {/* Professional Information */}
          <p className="form-section-title">Professional Information</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qualification">Qualification</label>
              <input
                type="text"
                id="qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g. BSc in Sports Science"
              />
            </div>

            <div className="form-group">
              <label htmlFor="yearsOfExperience">Years of Experience</label>
              <input
                type="number"
                id="yearsOfExperience"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                placeholder="5"
                min="0"
                max="50"
                className={errors.yearsOfExperience ? 'error-field' : ''}
              />
              {errors.yearsOfExperience && <span className="error-message">{errors.yearsOfExperience}</span>}
            </div>
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

          {/* Account Security */}
          <p className="form-section-title">Account Security</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password <span className="required-star">*</span></label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className={errors.password ? 'error-field' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password <span className="required-star">*</span></label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={errors.confirmPassword ? 'error-field' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
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