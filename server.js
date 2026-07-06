
import dotenv from 'dotenv';
dotenv.config();
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { caCert } from './src/models/db.js';
import { startSessionCleanup } from './src/utils/session-cleanup.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { setupDatabase, testConnection } from './src/models/setup.js';

// Import MVC components
import routes from './src/controllers/routes.js';
import { addLocalVariables } from './src/middleware/global.js';

console.log('Loaded environment variables:', process.env);

/**
 * Server configuration
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;

/**
 * Setup Express Server
 */
const app = express();
// Initialize PostgreSQL session store
const pgSession = connectPgSimple(session);

// Configure session middleware
app.use(session({
    store: new pgSession({
        conObject: {
            connectionString: process.env.DB_URL,
            // Configure SSL for session store connection (required by BYU-I databases)
            ssl: {
                ca: caCert,
                rejectUnauthorized: true,
                checkServerIdentity: () => { return undefined; }
            }
        },
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV.includes('dev') !== true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

startSessionCleanup(); // Start automatic session cleanup
/**
 * Configure Express
 */
app.use(express.static(path.join(__dirname, 'public')));

// Allow Express to receive and process POST data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

/**
 * Global Middleware
 */
app.use((req, res, next) => {
    // Skip logging for routes that start with /. (like /.well-known/)
    if (!req.path.startsWith('/.')) {
        console.log(`${req.method} ${req.url}`);
    }
    next(); // Pass control to the next middleware or route
});

// Middleware to add global data to all templates
app.use((req, res, next) => {
    // Add current year for copyright
    res.locals.currentYear = new Date().getFullYear();

    next();
});

// Global middleware for time-based greeting
app.use((req, res, next) => {
    const currentHour = new Date().getHours();

    /**
     * Create logic to set different greetings based on the current hour.
     * Use res.locals.greeting to store the greeting message.
     * Hint: morning (before 12), afternoon (12-17), evening (after 17)
     */
    if (currentHour < 12) {
        res.locals.greeting = 'Good morning!';
    } else if (currentHour < 17) {
        res.locals.greeting = 'Good afternoon!';
    } else {
        res.locals.greeting = 'Good evening!';
    }

    next();
});

// Global middleware for random theme selection
app.use((req, res, next) => {
    const themes = ['blue-theme', 'green-theme', 'red-theme'];

    // Your task: Pick a random theme from the array
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    res.locals.bodyClass = randomTheme;

    next();
});

// Global middleware to share query parameters with templates
app.use((req, res, next) => {
    // Make req.query available to all templates for debugging and conditional rendering
    res.locals.queryParams = req.query || {};

    next();
});

app.use(addLocalVariables);

/**
 * Routes
 */
app.use('/', routes);


// Course catalog list page
app.get('/catalog', (req, res) => {
    res.render('catalog', {
        title: 'Course Catalog',
        courses: courses
    });
});

// Enhanced course detail route with sorting
app.get('/catalog/:courseId', (req, res, next) => {
    const courseId = req.params.courseId;
    const course = courses[courseId];

    if (!course) {
        const err = new Error(`Course ${courseId} not found`);
        err.status = 404;
        return next(err);
    }

    // Get sort parameter (default to 'time')
    const sortBy = req.query.sort || 'time';

    // Create a copy of sections to sort
    let sortedSections = [...course.sections];

    // Sort based on the parameter
    switch (sortBy) {
        case 'professor':
            sortedSections.sort((a, b) => a.professor.localeCompare(b.professor));
            break;
        case 'room':
            sortedSections.sort((a, b) => a.room.localeCompare(b.room));
            break;
        case 'time':
        default:
            // Keep original time order as default
            break;
    }

    console.log(`Viewing course: ${courseId}, sorted by: ${sortBy}`);

    res.render('course-detail', {
        title: `${course.id} - ${course.title}`,
        course: { ...course, sections: sortedSections },
        currentSort: sortBy
    });
});

/**
 * Error Handling
 */

// 404 handler
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Global error handler
app.use((err, req, res, next) => {
    // Prevent infinite loops, if a response has already been sent, do nothing
    if (res.headersSent || res.finished) {
        return next(err);
    }

    // Determine status and template
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';

    // Prepare data for the template
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: NODE_ENV === 'production' ? 'An error occurred' : err.message,
        stack: NODE_ENV === 'production' ? null : err.stack,
        NODE_ENV // Our WebSocket check needs this and its convenient to pass along
    };

    // Render the appropriate error template with fallback
    try {
        res.status(status).render(`errors/${template}`, context);
    } catch (renderErr) {
        // If rendering fails, send a simple error page instead
        if (!res.headersSent) {
            res.status(status).send(`<h1>Error ${status}</h1><p>An error occurred.</p>`);
        }
    }
});

/**
 * Start WebSocket Server in Development Mode; used for live reloading
 */
if (NODE_ENV.includes('dev')) {
    const ws = await import('ws');

    try {
        const wsPort = parseInt(PORT) + 1;
        const wsServer = new ws.WebSocketServer({ port: wsPort });

        wsServer.on('listening', () => {
            console.log(`WebSocket server is running on port ${wsPort}`);
        });

        wsServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
    }
}

/**
 * Start Server
 */
app.listen(PORT, async () => {
    await setupDatabase();
    await testConnection();
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});