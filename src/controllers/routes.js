import { Router } from "express";
import { addDemoHeaders } from '../middleware/demo/headers.js';
import { catalogPage, courseDetailPage } from './catalog/catalog.js';
import { homePage, aboutPage, demoPage, testErrorPage } from './index.js';
import { facultyListPage, facultyDetailPage } from './faculty/faculty.js';
import contactRoutes from './forms/contact.js';
import registrationRoutes from './forms/registration.js';


const router = Router();
// Home and basic pages
router.get('/', homePage);
router.get('/about', aboutPage);

// Course catalog routes
router.get('/catalog', catalogPage);
router.get('/catalog/:slugId', courseDetailPage);

// Demo page with special middleware
router.get('/demo', addDemoHeaders, demoPage);

// Add contact-specific styles to all contact routes
router.use('/contact', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/contact.css">');
    next();
});

// Add registration-specific styles to all registration routes
router.use('/register', (req, res, next) => {
    res.addStyle('<link rel="stylesheet" href="/css/registration.css">');
    next();
});

router.use('/contact', contactRoutes);
router.use('/register', registrationRoutes);

// Route to trigger a test error
router.get('/test-error', testErrorPage);

router.get('/faculty', facultyListPage);
router.get('/faculty/:facultyId', facultyDetailPage);


export default router;