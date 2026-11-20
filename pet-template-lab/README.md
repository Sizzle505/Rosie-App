# Pet Template Lab (non-production)

This is the isolated **groundwork only** for adapting Rosie App for another dog, excluding Captain and Card Vault. It is NOT connected to RosieVerse's running app.

## Absolute safety boundary
- Work happens only in this directory on a separate draft branch; RosieVerse `main` and its deployments are untouched.
- Do not import these files into `src/`, edit or overwrite Rosie assets, change `package.json` or `vite.config`, enable actions, or update production domains.
- No merge, deployment, or installation is part of this groundwork. A GitHub branch preview may be built automatically by existing Git integrations, but it is not the production site.
- `asset-catalog.json` records *candidate* pet-specific artwork slots. These are source references, not instructions to change those files.
- The catalog separates essential and optional slots. Artwork can be shared or inherited rather than regenerated.
- Do not store ten original pet photographs, personal intake data, private credentials, or customers' unapproved generated images in this public repository.

## Files
- `asset-catalog.json`: page-by-page candidates referencing actual existing repository artwork.
- `examples/profile.example.json`: proposed dog profile; not loaded by RosieVerse.
- `scripts/validate.mjs`: read-only source-inventory and private pet package validator.
- `WORKFLOW.md`: family-and-friends production process using interactive ChatGPT image generation.

## Read-only commands
```sh
node pet-template-lab/scripts/validate.mjs --catalog
node pet-template-lab/scripts/validate.mjs --pack /path/to/private-pet-folder
node pet-template-lab/scripts/validate.mjs --pack /path/to/private-pet-folder --strict
```

The pet folder contains `profile.json` and `assets/`, with relative asset paths defined in the catalog. The validator performs no writes. `--strict` additionally checks optional assets.

## Future phase, separately reviewed
Build the first **independent pilot** and a configurable runtime asset resolver, ensuring the Rosie default remains byte-for-byte unchanged at the page level. Only after visual and regression QA on iPhone, iPad and desktop should any runtime integration be proposed. A draft PR is never permission to merge or deploy.
