# Legacy URL inventory και ασφαλής migration

Έλεγχος πηγών: 19 Νοεμβρίου 2026. Το [legacy-url-inventory.json](legacy-url-inventory.json)
περιέχει **75 συγκεκριμένα URLs**: 23 βασικά/υποστηρικτικά και 52 άρθρα από τα δύο
επίσημα press archives. Δεν είναι πλήρες live crawl του production.

## Τι παρατηρήθηκε και τι όχι

Η αναζήτηση και η ανάγνωση των επίσημων navigation / category snapshots έδωσαν
πραγματικά URLs και περιεχόμενο. Ο shell HTTP client αποτυγχάνει με
`Could not resolve host: keraboss.com`. Το web εργαλείο δεν επέστρεψε robots.txt,
sitemap_index.xml ή wp-sitemap.xml. Οι πληροφορίες από snapshot **δεν αποδεικνύουν
τρέχον status 200, canonical ή response headers**.

Γι' αυτό κάθε εγγραφή έχει `currentHttpStatus: null`, `currentCanonical: null`,
source URL, γλώσσα, μέθοδο discovery και ξεχωριστή προτεινόμενη μεταχείριση.
Τα organic metrics παραμένουν null: δεν έγινε authenticated έλεγχος Search Console,
Bing Webmaster Tools ή server/CDN logs. Ένα cache miss ή gateway error του εργαλείου
δεν καταγράφεται ως 404/502 του ίδιου του production site.

## Καθιερωμένες διευθύνσεις

| Σκοπός                     | Ελληνικά                                    | Αγγλικά                      |
| -------------------------- | ------------------------------------------- | ---------------------------- |
| Αρχική                     | `/`                                         | `/en/αρχική-σελίδα-english/` |
| Super K / τεχνικά στοιχεία | `/super-k/`                                 | `/en/super-k-2/`             |
| Configurator               | `/διαμόρφωσε-το-keraboss-σου/`              | `/en/build-your-keraboss-2/` |
| Ιστορία                    | `/ιστορία/`                                 | `/en/history/`               |
| Media                      | `/media/`                                   | `/en/media-en/`              |
| Press archive              | `/category/δημοσιότητα/`                    | `/en/category/publicity/`    |
| FAQ                        | `/συχνεσ-ερωτησεισ-kai-απαντησεισ-σχετικα/` | `/en/faq/`                   |
| Επικοινωνία                | `/επικοινωνία/`                             | `/en/contact-us/`            |
| Ενοικίαση                  | `/rent-a-car/`                              | `/en/rent-a-car-en/`         |
| Για επαγγελματίες          | `/profesionals/`                            | `/en/for-professionals/`     |
| Επίσημη παρουσίαση         | `/παρουσίαση/`                              | `/en/official-presentation/` |

Πηγές των paths: [ελληνική αρχική και navigation](https://keraboss.com/),
[αγγλική αρχική και navigation](https://keraboss.com/en/%CE%B1%CF%81%CF%87%CE%B9%CE%BA%CE%AE-%CF%83%CE%B5%CE%BB%CE%AF%CE%B4%CE%B1-english/),
[ελληνική ενοικίαση](https://keraboss.com/rent-a-car/),
[αγγλική ενοικίαση](https://keraboss.com/en/rent-a-car-en/),
[επίσημη παρουσίαση](https://keraboss.com/%CF%80%CE%B1%CF%81%CE%BF%CF%85%CF%83%CE%AF%CE%B1%CF%83%CE%B7/).

Η βασική πρόταση είναι διατήρηση των παραπάνω paths όταν παραμένει ο ίδιος σκοπός.
Το «-2» στα αγγλικά και το `/profesionals/` δεν πρέπει να αλλάξουν απλώς για αισθητικούς
λόγους. Το `/en/` δεν παρατηρήθηκε ως τρέχουσα canonical αγγλική αρχική. Αν προστεθεί
alias, πρέπει να είναι ρητή απόφαση με ένα μόνο redirect προς τον επιλεγμένο τελικό
προορισμό, όχι υπόθεση για την προηγούμενη συμπεριφορά.

Τα τεχνικά χαρακτηριστικά βρίσκονται σήμερα ως ενότητα στις δύο σελίδες του μοντέλου.
Δεν εντοπίστηκε ξεχωριστό legacy URL τεχνικών χαρακτηριστικών. Νέα specs σελίδα
μπορεί να προστεθεί μαζί με σύνδεση από το μοντέλο, χωρίς να μετατρέπεται το παλιό
model URL σε redirect ή να χάνεται η υπάρχουσα πληροφορία.

Το `/privacy-policy/` είναι ελληνικό έγγραφο όρων ενοικίασης/ακύρωσης/απορρήτου και
συνδέεται και από την αγγλική ενοικίαση. Δεν παρατηρήθηκε εγκεκριμένη αγγλική μετάφραση.
Χρειάζεται πραγματικό νομικό περιεχόμενο και owner review· δεν είναι ασφαλές να
αντικατασταθεί με γενικό placeholder ή να δηλωθεί ως αγγλικό μέσω hreflang.

## Press και άρθρα

Τα [ελληνικά](https://keraboss.com/category/%CE%B4%CE%B7%CE%BC%CE%BF%CF%83%CE%B9%CF%8C%CF%84%CE%B7%CF%84%CE%B1/)
και [αγγλικά archives](https://keraboss.com/en/category/publicity/) απέδωσαν 30 και 22
συγκεκριμένα article URLs αντίστοιχα. Το αγγλικό archive snapshot αναφερόταν ως
εννέα μηνών, άρα δεν πιστοποιεί τη σημερινή πληρότητα του αρχείου.

Κάθε article καταγράφεται με `review-and-preserve-content` και άγνωστο ακόμη target.
Αυτό είναι **εκκρεμότητα migration**, όχι έτοιμο redirect map. Απαιτείται διατήρηση
του περιεχομένου ή συγκεκριμένη ισοδύναμη νέα σελίδα ανά άρθρο. Μαζικό redirect όλων
των άρθρων στην αρχική, στο μοντέλο ή στο media archive δεν είναι ισοδύναμη μετάβαση.
Η καταγραφή δεν αποτελεί έγκριση επαναδημοσίευσης κειμένων ή φωτογραφιών τρίτων.

## Διαφορές περιεχομένου που επηρεάζουν το launch

Οι δύο [configurator](https://keraboss.com/en/build-your-keraboss-2/) περιγράφουν
τρεις συνδυασμούς εξοπλισμού και τέσσερα εργοστασιακά ονόματα χρωμάτων. Το
[αγγλικό FAQ](https://keraboss.com/en/faq/) εμφανίζει διαφορετική τιμολόγηση από τις
σελίδες διαμόρφωσης. Επομένως τιμές, Offer, διαθεσιμότητα και σταθερά ProductGroup IDs
χρειάζονται owner confirmation / εγκεκριμένο τεχνικό δελτίο. Δεν μεταφέρονται ως
τρέχοντα εμπορικά δεδομένα με βάση την πιο βολική από τις αντικρουόμενες πηγές.

## Πριν το domain cutover

1. Εξαγωγή όλων των πραγματικών old sitemaps και live crawl με status, canonical,
   hreflang, inlinks, media URLs και query URLs. Ένωση με το παρόν inventory.
2. Search Console και Bing export για clicks, impressions, top pages, queries,
   backlinks και index coverage. Καμία σελίδα δεν χαρακτηρίζεται «χαμηλής αξίας» χωρίς στοιχεία.
3. Απόφαση ανά legacy article / υποστηρικτικό route, owner-approved περιεχόμενο και
   συγκεκριμένος τελικός προορισμός όπου αλλάζει URL.
4. Εφαρμογή redirects στον πραγματικό hosting provider και έλεγχος από έξω:
   ένα 301/308 hop, τελικός 200, self-canonical, χωρίς loops/chains και χωρίς fallback στην αρχική.
5. Έλεγχος στα παλιά Unicode/percent-encoded URLs και με/χωρίς τελικό slash. Πραγματικά
   ανύπαρκτες διευθύνσεις να επιστρέφουν 404, όχι branded σελίδα με status 200.
6. Επιβεβαίωση του hosting/CDN, authentication previews, WAF/bot management και τελικών
   production headers. Κανένας έλεγχος σε τοπικό αρχείο δεν αποδεικνύει αυτές τις ρυθμίσεις.

Η παραπάνω εξωτερική επαλήθευση απαιτεί πρόσβαση στο hosting και στις search properties.
Production deploy, DNS και cutover παραμένουν εκτός της τρέχουσας εντολής.
