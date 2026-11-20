# Discoverability και δημοσίευση

## Υλοποιημένη βάση

- Static semantic HTML, πραγματικό κείμενο και links, χωρίς JavaScript requirement για ανάγνωση.
- Κοινό SEO: title, description, canonical, robots, Open Graph, Twitter card, Greek/English locales, reciprocal hreflang και προαιρετικό Search Console token.
- JSON-LD Organization → WebSite → WebPage / BreadcrumbList / Car, σταθερά `@id`, διεύθυνση, email, τηλέφωνο, επίσημα `sameAs`.
- Typed BreadcrumbList / VideoObject builders για σχετικό, ορατό περιεχόμενο.
- `@astrojs/sitemap`: αυτόματα `sitemap-index.xml` / `sitemap-0.xml`. Εξαιρούνται 404 και endpoints. Χωρίς πλασματικά `lastmod` ανά build.
- Production robots: wildcard `Allow: /` και απόλυτο Sitemap URL, ανοικτό για search και retrieval· training ρυθμίζεται ανεξάρτητα με `PUBLIC_GPTBOT_ALLOWED`.
- `/llms.txt`, `/llms-full.txt`, Markdown ανά canonical σελίδα, alternate/describedby links, HTTP Link template.
- Manifest, humans, `/.well-known/security.txt` και συμβατό `/security.txt`.
- CSP με hashes scripts/JSON-LD, self-hosted resources και host header template.
- Skip link, focus states και reduced motion. Ορατό περιεχόμενο χωρίς JS.

## Google και LLMs

Crawling δεν εγγυάται indexing, ranking ή citations. Η Google δεν ζητά ειδικό AI schema
ή llms.txt για AI Overviews / AI Mode: ισχύουν οι βασικές απαιτήσεις Search και snippets.
Το llms.txt είναι συμπληρωματική πρόταση για καθαρό context, όχι υποβολή σε όλα τα LLMs.
Το production HTML δεν έχει `noai`, `nosnippet` ή περιορισμό snippet/video preview.
Δεν προσθέτουμε meta keywords, fake reviews/dates ή SearchAction χωρίς πραγματικό search.

Πηγές: [Google AI](https://developers.google.com/search/docs/appearance/ai-features),
[Discover](https://developers.google.com/search/docs/appearance/google-discover),
[Astro sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/),
[llms.txt](https://llmstxt.org/), [OpenAI crawlers](https://developers.openai.com/api/docs/bots).

## Εικόνες / fonts / βίντεο

Το `og:image` παράγεται από την υπάρχουσα φωτογραφία του project στο
`public/social/super-k.jpg` (1200×675), με τοπικό URL, alt, πραγματικές διαστάσεις και MIME.
Αν επιλεγεί διαφορετική τελική φωτογραφία, ενημέρωσε το media record και το generation script.
Για Discover η Google προτείνει σχετική raster εικόνα τουλάχιστον 1200px πλάτους,
υψηλής ανάλυσης και κατά προτίμηση 16:9, χωρίς generic logo ή υπερβολικό κείμενο.
Το `max-image-preview:large` είναι ήδη ενεργό. Η επιλεξιμότητα δεν εγγυάται εμφάνιση.
Το προσωρινό favicon monogram δεν δηλώνεται ως εταιρικό logo στο schema.
Το manifest χρησιμοποιεί `display: browser`, χωρίς υπόσχεση offline/PWA λειτουργίας.

Τα pinned Inter Variable / Noto Sans Variable 5.3.0 βρίσκονται στο `public/fonts/`,
με latin, latin-ext, greek, greek-ext και OFL. Οι παραγόμενοι ορισμοί είναι στο
`src/fonts/index.css`, ανεξάρτητα από τον φάκελο styles, με `font-display: swap`.
Το αρχείο φορτώνεται από το `BaseLayout`. Δεν υπάρχουν font preloads χωρίς browser evidence.
Το `/design-system/` είναι εσωτερική σελίδα δοκιμών: noindex και εκτός sitemap.
Αρχικά media στο `src/assets/`, exports στο `src/assets-compressed/`. Το `CarMedia`
χρησιμοποιεί Astro image generation, responsive sizes, διαστάσεις και alt. Ο hero είναι eager/high priority.

Κάθε επιλεγμένο social video χρειάζεται πραγματική θεματική σελίδα με τίτλο, περίληψη,
transcript/ουσιαστικό κείμενο, thumbnail, ακριβή ημερομηνία και crawlable player/αρχείο.
Πέρασε `videoSchema(...)` στο `structuredData` του layout μόνο στη σελίδα που προβάλλει το βίντεο.
Για player επέκτεινε το CSP `frame-src` μόνο με τον συγκεκριμένο provider.
Θα προστεθεί video sitemap όταν υπάρχουν πραγματικές video pages.
Reciprocal hreflang υπάρχει ήδη στα 10 πραγματικά EL/EN ζεύγη. Article/BlogPosting θα
προστεθούν μόνο μαζί με πραγματικό μεταφερμένο άρθρο και εγκεκριμένο περιεχόμενο.

## Checklist τελικού hosting

1. Επιβεβαίωσε το canonical origin. Default: το υπάρχον `https://keraboss.com`.
2. Παραγωγή: `PUBLIC_INDEXABLE=true`. Public previews: `false` πριν το build.
   Το preview artifact έχει noindex, κλειστό robots και κανένα sitemap. Για ιδιωτικότητα
   χρειάζεται hosting authentication· robots δεν είναι έλεγχος πρόσβασης.
3. Τρέξε `npm run validate` και έλεγξε τελικό περιεχόμενο, εικόνες και links.
4. Ενεργοποίησε HTTPS και μόνιμα redirects HTTP/www → canonical origin.
   Καταγράφηκαν 75 παλιά URLs. Πριν το cutover πρέπει να κλείσουν τα 57 unresolved URLs του `migration-status.json`.
5. Το `dist/_headers` εφαρμόζεται σε Netlify / Cloudflare Pages. Το `astro preview`
   και άλλα hosting stacks δεν το εφαρμόζουν. Μετέφερε τις ίδιες ρυθμίσεις στο αντίστοιχο host.
   Επιβεβαίωσε live headers, MIME types και πραγματική 404 status. Η CSP υπάρχει και στο HTML,
   αλλά το `frame-ancestors` χρειάζεται HTTP header.
6. Για νέο analytics, form, player ή CDN άλλαξε μόνο τις αναγκαίες CSP directives και δοκίμασε build.
   HSTS ενεργοποιείται στο τελικό HTTPS hosting μετά τον έλεγχο του domain.
7. Το security.txt χρησιμοποιεί το επαληθευμένο γενικό inbox `info@keraboss.com`.
   Επιβεβαίωσε παρακολούθηση για αναφορές ασφαλείας ή αντικατάστησέ το με εξουσιοδοτημένο inbox.
   Η λήξη ανανεώνεται στο build: redeploy πριν παρέλθουν 180 ημέρες.
8. Search Console: DNS verification ή πραγματικό token, submit `/sitemap-index.xml`, URL Inspection
   και request indexing βασικών σελίδων. Προαιρετικά Bing Webmaster Tools.
9. Έλεγξε Schema Markup Validator / Rich Results Test, τελικά metadata και URL Inspection.
10. Έλεγξε CDN/WAF/bot management για δημόσιες σελίδες, assets, sitemap και LLM files:
    χωρίς login, JS challenge ή blanket AI-bot blocking. Το robots δεν παρακάμπτει WAF.
11. Παρακολούθησε indexing, πραγματικά crawl logs και Discover report εφόσον εμφανιστεί.

Η πλήρης τρέχουσα κατάσταση και τα τεκμήρια βρίσκονται στο [full audit](full-audit.md).
