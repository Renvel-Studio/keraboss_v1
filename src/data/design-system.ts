export const typeRoles = [
  {
    role: 'display-hero',
    text: 'ΕΛΕΥΘΕΡΙΑ',
    note: 'Inter · 750 · display / Greek-safe heading leading',
  },
  { role: 'display', text: 'Ανοιχτός ορίζοντας.', note: 'Inter · 650 · heading' },
  { role: 'h1', text: 'Διαμόρφωσε το δικό σου Super K', note: 'Inter · 650 · heading' },
  { role: 'h2', text: 'Κάθε δρόμος, μια νέα ιστορία.', note: 'Inter · 650 · heading' },
  { role: 'h3', text: 'Ο χαρακτήρας σου, σε κίνηση.', note: 'Inter · 620 · compact' },
  { role: 'h4', text: 'Κατασκευασμένο στην Ελλάδα.', note: 'Inter · 620 · compact' },
  { role: 'h5', text: 'Μια προσωπική επιλογή.', note: 'Inter · 600 · compact' },
  { role: 'h6', text: 'Οι λεπτομέρειες κάνουν τη διαφορά.', note: 'Inter · 600 · compact' },
  {
    role: 'lead',
    text: 'Λιτές γραμμές. Έντονος χαρακτήρας. Χώρος για όσα έχουν σημασία.',
    note: 'Noto Sans · 400 · body',
  },
  {
    role: 'body',
    text: 'Η αίσθηση της ελευθερίας αρχίζει από τις απλές επιλογές. Μια διαδρομή δίπλα στη θάλασσα, ένας νέος προορισμός, μια ιστορία που γίνεται δική σου.',
    note: 'Noto Sans · 400 · body',
  },
  { role: 'label', text: 'Διαμόρφωση αυτοκινήτου', note: 'Inter · 550 · UI' },
  {
    role: 'caption',
    text: 'Super K στη Βάρκιζα. Φωτογραφία από το εταιρικό αρχείο.',
    note: 'Noto Sans · 400 · body',
  },
  {
    role: 'micro',
    text: 'KERABOSS CARS MANUFACTURING',
    note: 'Inter · 500 · UI · secondary metadata only',
  },
] as const;

export const colors = [
  { name: 'White', hex: '#FFFFFF', style: 'page' },
  { name: 'Keraboss Yellow', hex: '#FFCC00', style: 'yellow' },
  { name: 'Yellow Hover', hex: '#E6B800', style: 'yellow-hover' },
  { name: 'Desert Sand', hex: '#E9DFCD', style: 'muted' },
  { name: 'Light Sand', hex: '#F7F4ED', style: 'soft' },
  { name: 'Carbon', hex: '#141414', style: 'inverse' },
  { name: 'Stone', hex: '#5C584F', style: 'secondary' },
  { name: 'Sand Border', hex: '#D8CEBD', style: 'border-subtle' },
  { name: 'Control Border', hex: '#746D60', style: 'border-default' },
  { name: 'Success text', hex: '#1D633E', style: 'success-text' },
  { name: 'Success surface', hex: '#E7F3EA', style: 'success-surface' },
  { name: 'Error text', hex: '#A22B30', style: 'error-text' },
  { name: 'Error surface', hex: '#FBEAEC', style: 'error-surface' },
] as const;

export const motionProfiles = [
  {
    id: 'reveal',
    title: 'Ήπια αποκάλυψη',
    timing: '320 ms',
    description:
      'Αργό → γρήγορο → αργό. Για την είσοδο μιας λεπτομέρειας ή τη διακριτική ανύψωση κάρτας.',
    className: 'motion-reveal',
  },
  {
    id: 'shift',
    title: 'Αλλαγή σχέσης',
    timing: '480 ms',
    description:
      'Γρήγορη εκκίνηση, σύντομη επιβράδυνση και δύο γρήγορες φάσεις. Για μετάβαση βήματος διαμόρφωσης.',
    className: 'motion-shift',
  },
  {
    id: 'exit',
    title: 'Σύντομη έξοδος',
    timing: '180 ms',
    description:
      'Γρήγορο → ακόμη γρηγορότερο. Για την έξοδο προσωρινού στοιχείου, με ήπια επαναφορά στη δοκιμή.',
    className: 'motion-exit',
  },
  {
    id: 'bounce',
    title: 'Ελαστική επαναφορά',
    timing: '500 ms',
    description:
      'Μικρή, αποσβεννυόμενη ανύψωση. Για μια μεμονωμένη επιβεβαίωση επιλογής, χωρίς συνεχή κίνηση.',
    className: 'motion-bounce',
  },
] as const;
