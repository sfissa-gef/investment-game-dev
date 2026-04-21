// D4: per-session QA flags written at ingest time.
//
// qa_passed is a denormalised boolean for fast filtering in admin views;
// qa_flags holds the full structured check results (array of flag objects).
exports.up = (pgm) => {
  pgm.addColumns('sessions', {
    qa_passed: { type: 'boolean' },
    qa_flags:  { type: 'jsonb' },
    qa_checked_at: { type: 'timestamptz' },
  });
  pgm.createIndex('sessions', 'qa_passed');
};

exports.down = (pgm) => {
  pgm.dropIndex('sessions', 'qa_passed');
  pgm.dropColumns('sessions', ['qa_passed', 'qa_flags', 'qa_checked_at']);
};
