import { body, validationResult } from 'express-validator';
import { createContactForm } from '../../models/forms/contact.js';
/**
 * Handle contact form submission with validation.
 * If validation passes, save to database and redirect.
 * If validation fails, log errors and redirect back to form.
 */
const contactValidation = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);

    // Inside your validation error check
if (!errors.isEmpty()) {
    // Store each validation error as a separate flash message
    errors.array().forEach(error => {
        req.flash('error', error.msg);
    });
    return res.redirect('/contact');
}

    // Extract validated data
    const { subject, message } = req.body;

    try {
        // Save to database
        await createContactForm(subject, message);
        // After successfully saving to the database
        req.flash('success', 'Thank you for contacting us! We will respond soon.');
        res.redirect('/contact');
        
    } catch (error) {
        console.error('Error saving contact form:', error);
        req.flash('error', 'Unable to submit your message. Please try again later.');
        res.redirect('/contact');
    }
};

/**
 * Validation rules for user registration
 */
const registrationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
        .withMessage('Name must be at least 2 and 100 characters'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email address is too long'),
    body('emailConfirm')
        .trim()
        .normalizeEmail()
        .custom((value, { req }) => value === req.body.email)
        .withMessage('Email addresses must match'),
    body('password')
        .isLength({ min: 8, max: 128 })
        .matches(/[0-9]/)
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage ('Password must contain at least one uppercase letter')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
        .withMessage ('Password must contain at least one specila character letter'),
    body('passwordConfirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords must match')
   
];

/**
 * Validation rules for login form
 */
const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .isLength({ max: 255 })
        .withMessage('Email address is too long')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
];

/**
 * Validation rules for editing user accounts
 */
const updateAccountValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email address is too long')
];

export { 
    contactValidation,
    registrationValidation, 
    loginValidation,
    updateAccountValidation
};