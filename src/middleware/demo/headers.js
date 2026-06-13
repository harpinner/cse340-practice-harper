// Middleware to add demo headers for the /demo route
let demoPageRequestCount = 0;

export const addDemoHeaders = (req, res, next) => {
    // Increment demo page counter and expose to templates
    demoPageRequestCount += 1;
    res.locals.demoPageRequestCount = demoPageRequestCount;

    res.setHeader('X-Demo-Page', 'true');
    res.setHeader('X-Middleware-Demo', 'Test page for Demo!');
    next();
};

export default addDemoHeaders;