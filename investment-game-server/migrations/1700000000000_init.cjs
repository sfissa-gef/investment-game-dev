exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('sessions', {
    id: 'id',
    session_id: { type: 'text', notNull: true, unique: true },
    participant_id: { type: 'text', notNull: true },
    enumerator_id: { type: 'text', notNull: true },
    country: { type: 'text', notNull: true },
    partner: { type: 'text' },
    round2_version: { type: 'char(1)', notNull: true },
    language: { type: 'text', notNull: true },
    currency_rate: { type: 'numeric' },
    app_version: { type: 'text' },
    session_start_time: { type: 'timestamptz' },
    session_end_time: { type: 'timestamptz' },
    payload: { type: 'jsonb', notNull: true },
    received_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('sessions', 'participant_id');
  pgm.createIndex('sessions', 'country');
  pgm.createIndex('sessions', 'received_at');

  pgm.createTable('audio_chunks', {
    id: 'id',
    session_id: { type: 'text', notNull: true, references: '"sessions"(session_id)', onDelete: 'CASCADE' },
    chunk_index: { type: 'integer', notNull: true },
    timestamp: { type: 'timestamptz', notNull: true },
    duration_ms: { type: 'integer' },
    encrypted: { type: 'boolean', default: false },
    blob: { type: 'bytea' },
    received_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('audio_chunks', 'audio_chunks_unique',
    'UNIQUE (session_id, chunk_index)');
};

exports.down = (pgm) => {
  pgm.dropTable('audio_chunks');
  pgm.dropTable('sessions');
};
