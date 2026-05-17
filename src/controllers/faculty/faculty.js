import { getFacultyById, getSortedFaculty } from '../../models/facultyfaculty.js';


function facultyListPage(req, res) {
    const sortBy = req.query.sort || 'name';
    const facultyMembers = getSortedFaculty(sortBy);
    res.render('faculty-list', {
        title: 'Faculty Directory',
        faculty: facultyMembers,
        currentSort: sortBy
    });

}



function facultyDetailPage(req, res, next) {
    const facultyId = req.params.facultyId;
    const facultyMember = getFacultyById(facultyId);

    if (!facultyMember) {
        const err = new Error(`Faculty member ${facultyId} not found`);
        err.status = 404;
        return next(err);
    }

    res.render('faculty-detail', {
        title: `${facultyMember.name}`,
        faculty: facultyMember
    });
}

export { facultyListPage, facultyDetailPage };