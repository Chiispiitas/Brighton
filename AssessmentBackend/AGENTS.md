# Brighton assessment publishing

This is the direct-deployment runtime for Adult and Young Learners Placement,
Exams, unit Tests, progress, results and AI writing review.

Canonical business modules remain in `../Placement/wix-backend/` and
`../Placement/YoungLearners/wix-backend/`. Edit those modules, then build here.
`src/generated/` is derived and ignored; never patch it directly.

Deploy site: `dbc6b0a6-da6e-4b6d-bf33-bb62fa192f79`.
Data site: `06a80236-67d7-4837-b4c8-2a62b29ee79b`.
Keep this distinction. Never seed or copy student records to the hosting site.
Private `ASSESSMENT_DATA_*` runtime variables authenticate to the original data
site. Never put their values in source, build archives, browser files or output.

Use the Wix direct upload/release tools described in DEPLOYMENT.md. The Wix
Website Editor is no longer the publishing path for these assessment modules.
Do not publish to the data site's companion hosting project: that Editor site
does not route these custom server paths. Do not modify any games' hosting.

After a backend change, run appropriate canonical regressions, `npm test`,
`npm run build`, package both archives and release with a current expected
Code Store head. Check the live health source hashes and affected endpoints.
Do not switch public configuration until the live endpoint passes its checks.

