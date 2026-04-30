/**
 * arcturus-db.cy.ts — schema + seed-data integrity for the arcturus database.
 *
 * Verifies the cross-stack wiring: arcturus DB lives inside the .devcontainer
 * mariadb (port 3306), seeded by .devcontainer/mysql-init/01-bootstrap-arcturus.sh
 * with the Holo5 base + 3.0.0→3.5.0 migration dumps.
 */

interface CountRow {
  c: number;
}

interface UserRow {
  id: number;
  username: string;
}

describe('arcturus database — schema + seed data', () => {
  it('arcturus_user can connect and see the database', () => {
    cy.task<CountRow[]>('arcturusQuery', {
      sql: "SELECT COUNT(*) AS c FROM information_schema.schemata WHERE schema_name = 'arcturus'",
    }).then((rows) => {
      expect(rows[0]?.c).to.eq(1);
    });
  });

  it('schema has at least 100 tables (Holo5 base loaded)', () => {
    cy.task<CountRow[]>('arcturusQuery', {
      sql: "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = 'arcturus'",
    }).then((rows) => {
      // Holo5 base has ~122 tables. Allow some drift from migrations.
      expect(rows[0]?.c).to.be.greaterThan(100);
    });
  });

  it('users table contains the seeded SystemAccount', () => {
    cy.task<UserRow[]>('arcturusQuery', {
      sql: 'SELECT id, username FROM users WHERE id = 1 LIMIT 1',
    }).then((rows) => {
      expect(rows).to.have.length(1);
      expect(rows[0]?.username).to.eq('Systemaccount');
    });
  });

  it('emulator_settings table exists and is non-empty', () => {
    cy.task<CountRow[]>('arcturusQuery', {
      sql: 'SELECT COUNT(*) AS c FROM emulator_settings',
    }).then((rows) => {
      expect(rows[0]?.c).to.be.greaterThan(0);
    });
  });

  it('catalog_pages has > 700 rows (Holo5 base seed)', () => {
    cy.task<CountRow[]>('arcturusQuery', {
      sql: 'SELECT COUNT(*) AS c FROM catalog_pages',
    }).then((rows) => {
      // Per Arcturus boot logs we saw "Loaded 770 Catalog Pages!"
      expect(rows[0]?.c).to.be.greaterThan(700);
    });
  });

  it('rooms table is queryable', () => {
    cy.task<CountRow[]>('arcturusQuery', {
      sql: 'SELECT COUNT(*) AS c FROM rooms',
    }).then((rows) => {
      // No assertion on count — fresh DB may have 0 rooms. Just must be queryable.
      expect(rows[0]?.c).to.be.a('number');
    });
  });
});
