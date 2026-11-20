# Keraboss — evidence and publication boundaries

Research checked on 19 November 2026. The machine-readable evidence register is
`src/data/catalog-evidence.json`. It records source IDs, values, units, bilingual labels,
verification scope and pending approvals. This is editorial evidence; it is not an approved
current technical sheet or an independent legal/certification audit.

| Requirement                          | Evidence status                          | Safe use                                                                                                                        |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Company display name, model, contact | Verified readable company pages          | Use the display name, model and published contact details; do not invent legal registry data.                                   |
| Vehicle technical values             | Verified EL/EN public model tables       | Attribute to published company specifications; request confirmation of the final configuration.                                 |
| Construction                         | Verified official model/FAQ copy         | Fiberglass body, galvanized chassis and hand-built limited production; no absolute durability claims.                           |
| Vehicle options and paints           | Verified public configurator text        | Use published option and paint names. Hex paint mappings and current compatibility remain unverified.                           |
| Editions                             | Public edition names observed            | Do not treat editorial IDs as manufacturer SKUs or emit ProductGroup without stable variant confirmation.                       |
| History                              | Public company history observed          | Refer to Pavlos and Stella; legal foundingDate and promotional “first” claims need stronger approval.                           |
| Press                                | Original NewsAuto article read           | Publish a descriptive outbound link, publisher and date. No rating/review score was found or created.                           |
| Standalone video                     | Incomplete                               | No VideoObject or new video URL until the player, thumbnail, upload date, transcript/captions and rights are verified together. |
| Downloadable press kit               | Requires rights approval                 | Do not redistribute third-party credited photography as a press kit merely because it appears on the old website.               |
| Prices / stock / delivery            | Requires current commercial confirmation | Do not emit Offer, claim availability, or promise lead times.                                                                   |

## Primary sources

- [Greek model and technical table](https://keraboss.com/super-k/).
- [English model and technical table](https://keraboss.com/en/super-k-2/).
- [English FAQ](https://keraboss.com/en/faq/).
- [Greek configurator](https://keraboss.com/διαμόρφωσε-το-keraboss-σου/).
- [English configurator](https://keraboss.com/en/build-your-keraboss-2/).
- [Company history](https://keraboss.com/ιστορία/).
- [Contact](https://keraboss.com/επικοινωνία/).
- [Company media library](https://keraboss.com/media/).
- [Original NewsAuto test drive, 8 July 2022](https://www.newsauto.gr/test-drive/apoklistiko-odigoume-to-super-k-tis-keraboss-video/).

## Material discrepancies and cautions

The English configurator's Medium Cabin heading uses a Short Cabin equipment bullet.
Keep the general cabin option wording until the business confirms the exact edition naming.
The published power unit is `HP`; no unsupported conversion to PS or kW has been made.
The viewing/contact address in Athens is verified; it has not independently been audited as
an exact manufacturing-facility address.

The old pages contain current-looking commercial prices and ordering language. Their presence
in cached/public text does not establish the current quotation or stock position. Promotional
certification superlatives, lifetime/rust-proof assurances and performance superiority claims
are deliberately excluded from the usable claim set.

The web tool returned readable snapshots, not a raw live crawl with HTTP headers. Therefore
source entries use `httpStatus: null`; do not interpret readability as a measured HTTP 200.
