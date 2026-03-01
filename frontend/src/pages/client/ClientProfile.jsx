import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaSignOutAlt, FaSave, FaTimes, FaUser } from "react-icons/fa";
import SignatureCanvas from "react-signature-canvas";
import logo from "../../assets/Fat2fit Logo.jpg";
import "./ClientProfile.css";

const ClientProfile = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editData, setEditData] = useState({});
  const [newProfileFile, setNewProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const sigCanvas = useRef(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) navigate("/login");
    else fetchClientData();
  }, [userId, navigate]);

  const fetchClientData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/client/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
        setEditData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          age: data.age || "",
          gender: data.gender || "",
          mobileNumber: data.mobileNumber || "",
          landPhone: data.landPhone || "",
          address: data.address || "",
          bloodGroup: data.bloodGroup || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactRelationship: data.emergencyContactRelationship || "",
          emergencyContactNumber: data.emergencyContactNumber || "",
        });
      } else setError("Failed to load profile data");
    } catch (err) {
      setError("Server error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileFile = (e) => {
    const file = e.target.files && e.target.files[0];
    setNewProfileFile(file || null);
    if (file) setProfilePreview(URL.createObjectURL(file));
    else setProfilePreview(null);
  };

  const handleEdit = () => { setIsEditing(true); setSuccessMessage(""); };
  const handleCancel = () => {
    setIsEditing(false);
    if (client) setEditData({
      firstName: client.firstName || "",
      lastName: client.lastName || "",
      age: client.age || "",
      gender: client.gender || "",
      mobileNumber: client.mobileNumber || "",
      landPhone: client.landPhone || "",
      address: client.address || "",
      bloodGroup: client.bloodGroup || "",
      emergencyContactName: client.emergencyContactName || "",
      emergencyContactRelationship: client.emergencyContactRelationship || "",
      emergencyContactNumber: client.emergencyContactNumber || "",
    });
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccessMessage("");
    try {
      const formPayload = new FormData();
      Object.keys(editData).forEach(key => {
        if (editData[key] !== undefined && editData[key] !== null) formPayload.append(key, editData[key]);
      });
      formPayload.append("updatedBy", userId);

      if (newProfileFile) formPayload.append("profilePicture", newProfileFile);

      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        const signatureDataUrl = sigCanvas.current.toDataURL("image/png");
        const blob = await fetch(signatureDataUrl).then(res => res.blob());
        const file = new File([blob], "signature.png", { type: "image/png" });
        formPayload.append("digitalSignature", file);
      }

      const response = await fetch(
        `http://localhost:8080/api/client/${client.clientId}/update`,
        { method: "PUT", body: formPayload }
      );

      if (response.ok) {
        const updatedClient = await response.json();
        setClient(updatedClient);
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
      } else {
        const errorText = await response.text();
        setError("Update failed: " + errorText);
      }
    } catch (err) {
      // show the actual error to help diagnose
      setError("Server error occurred: " + (err.message || err));
      console.error("Save failed", err);
    } finally { setSaving(false); }
  };

  const handleLogout = () => { localStorage.removeItem("userId"); navigate("/login"); };

  const bytesToBase64 = (bytes) => {
    if (!bytes) return null;
    let arr;
    if (bytes instanceof ArrayBuffer) arr = new Uint8Array(bytes);
    else if (Array.isArray(bytes)) arr = new Uint8Array(bytes);
    else if (bytes.data && Array.isArray(bytes.data)) arr = new Uint8Array(bytes.data);
    else if (bytes.data && bytes.data.data && Array.isArray(bytes.data.data)) arr = new Uint8Array(bytes.data.data);
    else return null;

    let binary = "";
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  };

  const getProfilePictureUrl = () => {
    const pic = client?.profilePicture;
    if (!pic) return null;
    if (typeof pic === "string") return pic.startsWith("data:") ? pic : `data:image/jpeg;base64,${pic}`;
    const b64 = bytesToBase64(pic);
    return b64 ? `data:image/jpeg;base64,${b64}` : null;
  };

  const getSignatureUrl = () => {
    const sig = client?.digitalSignature;
    if (!sig) return null;
    if (typeof sig === "string") return sig.startsWith("data:") ? sig : `data:image/png;base64,${sig}`;
    const b64 = bytesToBase64(sig);
    return b64 ? `data:image/png;base64,${b64}` : null;
  };

  const renderFieldInput = (field) => {
    if (!isEditing) return <span>{client?.[field] || "-"}</span>;
    if (field === "gender") return (
      <select name={field} value={editData[field]} onChange={handleChange}>
        <option value="">Select</option>
        {["Male", "Female", "Prefer not to say"].map(opt => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    );
    if (field === "bloodGroup") return (
      <select name={field} value={editData[field]} onChange={handleChange}>
        <option value="">Select</option>
        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(opt => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    );
    if (field === "address") return <textarea name={field} value={editData[field]} onChange={handleChange} />;
    if (field === "age") return <input type="number" name={field} value={editData[field]} onChange={handleChange} />;
    return <input type="text" name={field} value={editData[field]} onChange={handleChange} />;
  };

  if (loading) return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="loading-state">Loading profile...</div>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header-wrapper">
          <div className="header-left">
            <h1>My Profile</h1>
            <p>Manage your personal information</p>
          </div>
          <div className="header-right">
            <img src={logo} alt="Fat2Fit Logo" className="header-logo" />
          </div>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Top Section */}
        <div className="profile-top-section">
          <div className="profile-picture-section">
            <div className="profile-avatar-frame">
              <img
                src={profilePreview || getProfilePictureUrl() || ""}
                alt="Profile"
                className="profile-avatar-img"
              />
            </div>
            {isEditing && <input type="file" accept="image/*" onChange={handleProfileFile} />}
            <div className="profile-name">
              <h2>{client.firstName} {client.lastName}</h2>
              <p className="member-since">Member since {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <>
                <button className="edit-button" onClick={handleEdit}><FaEdit /> Edit Profile</button>
                <button className="logout-button" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
              </>
            ) : (
              <>
                <button className="save-button" onClick={handleSave} disabled={saving}><FaSave /> {saving ? "Saving..." : "Save Changes"}</button>
                <button className="cancel-button" onClick={handleCancel}><FaTimes /> Cancel</button>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="profile-details">
          <div className="section-title">Personal Information</div>
          <div className="details-grid">
            {["firstName","lastName","age","gender","mobileNumber","landPhone","address","bloodGroup"].map(field => (
              <div className={`detail-item ${field==="address"?"full-width":""}`} key={field}>
                <label>{field==="mobileNumber"?"Mobile Number":field==="landPhone"?"Land Phone":field==="bloodGroup"?"Blood Group":field.charAt(0).toUpperCase()+field.slice(1)}</label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>

          <div className="section-title">Emergency Contact</div>
          <div className="details-grid">
            {["emergencyContactName","emergencyContactRelationship","emergencyContactNumber"].map(field => (
              <div className="detail-item" key={field}>
                <label>{field==="emergencyContactName"?"Contact Name":field==="emergencyContactRelationship"?"Relationship":"Contact Number"}</label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>

          {getSignatureUrl() && (
            <>
              <div className="section-title">Digital Signature</div>
              <div className="signature-display">
                {isEditing ? (
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ className:"signature-canvas-edit", width:500, height:140 }}
                  />
                ) : (
                  <img src={getSignatureUrl()} alt="Digital Signature"/>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;