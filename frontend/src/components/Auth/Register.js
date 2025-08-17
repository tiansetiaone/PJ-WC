import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../style/Auth/Register.css';
import GoogleButton from '../GoogleButton';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import logoImage from "../../assets/logo-blasterc.png";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        whatsapp_number: '',
        usdt_network: 'TRC20',
        usdt_address: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [hCaptchaToken, setHCaptchaToken] = useState(null);
    const hCaptchaRef = useRef(null);
    const navigate = useNavigate();

    const showErrorToast = (message) => {
        toast.error(message, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const showSuccessToast = (message) => {
        toast.success(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleHCaptchaVerify = (token) => {
        setHCaptchaToken(token);
    };

    const handleHCaptchaError = () => {
        setHCaptchaToken(null);
        showErrorToast('Captcha verification failed. Please try again.');
    };

    const handleHCaptchaExpire = () => {
        setHCaptchaToken(null);
        showErrorToast('Captcha session expired. Please verify again.');
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!formData.name.trim()) {
            errors.name = 'Full name is required';
            isValid = false;
        }

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = 'Only letters, numbers and underscores allowed';
            isValid = false;
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 8) {
            errors.password = 'Minimum 8 characters required';
            isValid = false;
        }

        if (!formData.password_confirmation) {
            errors.password_confirmation = 'Please confirm your password';
            isValid = false;
        } else if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = 'Passwords do not match';
            isValid = false;
        }

        if (formData.whatsapp_number && !/^\+?[\d\s-]+$/.test(formData.whatsapp_number)) {
            errors.whatsapp_number = 'Please enter a valid WhatsApp number';
            isValid = false;
        }

        if (formData.usdt_address && formData.usdt_address.length < 10) {
            errors.usdt_address = 'USDT address must be at least 10 characters';
            isValid = false;
        }

        if (!acceptTerms) {
            showErrorToast('You must accept the terms and conditions');
            isValid = false;
        }

        if (!hCaptchaToken) {
            showErrorToast('Please complete the captcha verification');
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                ...formData,
                acceptTerms,
                hCaptchaToken
            });
            
            if (response.data.success) {
                showSuccessToast('Registration successful!');
                navigate('/account-checking', { 
                    state: { 
                        email: formData.email,
                        isActive: response.data.is_active 
                    } 
                });
            }
        } catch (err) {
            let errorMessage = 'Registration failed. Please try again.';
            
            if (err.response) {
                if (err.response.data.code === 'INVALID_CAPTCHA') {
                    errorMessage = 'Captcha verification failed. Please try again.';
                    hCaptchaRef.current.resetCaptcha();
                    setHCaptchaToken(null);
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                }

                if (err.response.data.details) {
                    setFormErrors(err.response.data.details);
                    // Show field-specific errors
                    Object.values(err.response.data.details).forEach(msg => {
                        showErrorToast(msg);
                    });
                }
            }
            
            showErrorToast(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmitDisabled = isLoading || !acceptTerms || !hCaptchaToken || 
        !formData.name || !formData.username || !formData.email || 
        !formData.password || formData.password.length < 8 ||
        !formData.password_confirmation || formData.password !== formData.password_confirmation ||
        Object.keys(formErrors).length > 0;

    return (
        <div className="register-wrapper">
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            
            <div className="register-left">
                <div className="branding">
                   <img src={logoImage} alt="BLASTERC" className="logo-img" />
                    <p className="tagline">Let's Grow Your Business with Us</p>
                </div>
            </div>

            <div className="register-right">
                <div className="register-form">
                    <h2>Create Your Account Today</h2>
                    <p className="subtitle">
                        Join us and experience the convenience of managing WhatsApp and SMS broadcasts in a single, integrated platform.
                    </p>

                    <div className="google-login">
                        <GoogleButton />
                        <div className="separator">
                            <div className='border1'></div>
                            <span>or</span>
                            <div className='border1'></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Full Name" 
                                value={formData.name} 
                                onChange={handleChange}
                                className={formErrors.name ? 'input-error' : ''}
                            />
                            {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                        </div>

                        <div className="form-group">
                            <input 
                                type="text" 
                                name="username" 
                                placeholder="Username" 
                                value={formData.username} 
                                onChange={handleChange}
                                className={formErrors.username ? 'input-error' : ''}
                            />
                            {formErrors.username && <span className="error-text">{formErrors.username}</span>}
                        </div>

                        <div className="form-group">
                            <input 
                                type="text" 
                                name="whatsapp_number" 
                                placeholder="WhatsApp Number (Optional)" 
                                value={formData.whatsapp_number} 
                                onChange={handleChange}
                                className={formErrors.whatsapp_number ? 'input-error' : ''}
                            />
                            {formErrors.whatsapp_number && <span className="error-text">{formErrors.whatsapp_number}</span>}
                        </div>
                        
                        <div className="form-group">
                            <div className="usdt-input-group">
                                <select 
                                    name="usdt_network" 
                                    value={formData.usdt_network} 
                                    onChange={handleChange}
                                    className={`usdt-network-select ${formErrors.usdt_address ? 'input-error' : ''}`}
                                >
                                    <option value="TRC20">TRC20</option>
                                    <option value="BEP20">BEP20</option>
                                    <option value="ERC20">ERC20</option>
                                </select>
                                <input 
                                    type="text" 
                                    name="usdt_address" 
                                    placeholder={`USDT ${formData.usdt_network} Wallet Address (Optional)`} 
                                    value={formData.usdt_address} 
                                    onChange={handleChange} 
                                    className={`usdt-address-input ${formErrors.usdt_address ? 'input-error' : ''}`}
                                />
                            </div>
                            {formErrors.usdt_address && <span className="error-text">{formErrors.usdt_address}</span>}
                        </div>

                        <div className="form-group">
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Email" 
                                value={formData.email} 
                                onChange={handleChange}
                                className={formErrors.email ? 'input-error' : ''}
                            />
                            {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                        </div>

<div className="form-group">
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Password (min 8 characters)" 
                        value={formData.password} 
                        onChange={handleChange}
                        className={formErrors.password ? 'input-error' : ''}
                    />
                    {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                </div>

                <div className="form-group">
                    <input 
                        type="password" 
                        name="password_confirmation" 
                        placeholder="Confirm Password" 
                        value={formData.password_confirmation} 
                        onChange={handleChange}
                        className={formErrors.password_confirmation ? 'input-error' : ''}
                    />
                    {formErrors.password_confirmation && (
                        <span className="error-text">{formErrors.password_confirmation}</span>
                    )}
                </div>

                        <div className="checkbox-group">
                            <input 
                                type="checkbox" 
                                id="acceptTerms"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                            />
                            <label htmlFor="acceptTerms">
                                I have read and agree to the <a href="/terms" target="_blank">Terms and Conditions</a> of Service.
                            </label>
                        </div>

                        <div className="hcaptcha-container">
                            <HCaptcha
                                sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
                                onVerify={handleHCaptchaVerify}
                                onExpire={handleHCaptchaExpire}
                                onError={handleHCaptchaError}
                                ref={hCaptchaRef}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitDisabled} 
                            className={`submit-btn ${isSubmitDisabled ? 'button-disabled' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span> Registering...
                                </>
                            ) : 'Register Now'}
                        </button>
                    </form>

                    <p className="login-link">
                        Already have an account? <a href="/login">Log in now.</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;