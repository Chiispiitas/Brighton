# Horizons assets

Production visuals are stored locally in this directory. Do not hotlink publication assets.

## Structure

Suggested organization:

```text
assets/
├── asset-ledger.csv
├── icons/
├── images/
│   ├── unit-01/
│   ├── unit-02/
│   └── ...
└── ui/
```

Create unit image folders when final assets begin to be sourced.

## Asset ledger

Every external production image receives a row in `asset-ledger.csv` before final approval.

Record source/license information even when attribution is not required.

## Naming

Use stable activity-linked names such as:

`HZN_A1_U02_LB_E01_IMG_01.webp`

## Image direction

Follow `../design-system/image-direction.md` before sourcing. The intended crop and pedagogical purpose should be known before selecting the final image.

## Icons

`icons/horizons-icons.svg` is the shared functional SVG sprite. It contains interface/task symbols only; vector illustrations are prohibited.
